"use client";

import { ProfileDisplay } from "@/components/profile/ProfileDisplay";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCog, Loader2, X, Check, Search, School, BookOpen, GraduationCap, Plus } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

interface User {
  id: number;
  name: string;
  email: string;
  roles: { id: number; name: string }[];
}

const ROLE_LABELS: Record<string, string> = {
  university_admin: "Administrador de Universidad",
  career_admin: "Administrador de Carrera",
  subject_admin: "Administrador de Materia",
  teacher: "Docente",
  user: "Usuario",
  admin: "Administrador",
  superadmin: "Superadministrador",
  moderator: "Moderador",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, token } = useAuth();

  // --- Subscriptions ---
  const [subscriptions, setSubscriptions] = useState<{
    universities: any[];
    careers: any[];
    subjects: any[];
  }>({ universities: [], careers: [], subjects: [] });
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  // --- Admin Role Management State ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [assignableRoles, setAssignableRoles] = useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // --- Modal State ---
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // --- Role Assignment State (inside modal) ---
  const [roleActionLoading, setRoleActionLoading] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  // --- Entity selection for admin roles ---
  const [universitySearch, setUniversitySearch] = useState("");
  const [universityOptions, setUniversityOptions] = useState<any[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<any | null>(null);

  const [careerOptions, setCareerOptions] = useState<any[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState<any | null>(null);

  const [subjectOptions, setSubjectOptions] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);

  // --- Show role management for any role except "user" ---
  useEffect(() => {
    if (!user) return setIsAdmin(false);
    setIsAdmin(user.roles?.some((r: any) => r.name !== "user"));
  }, [user]);

  // --- Fetch subscriptions ---
  useEffect(() => {
    if (!token) return;
    setLoadingSubscriptions(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setSubscriptions(data))
      .catch(() => setSubscriptions({ universities: [], careers: [], subjects: [] }))
      .finally(() => setLoadingSubscriptions(false));
  }, [token]);

  // --- Fetch assignable roles ---
  useEffect(() => {
    if (!isAdmin || !token) return;
    setLoadingRoles(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/roles/assignable`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    })
      .then((res) => res.json())
      .then((data) => setAssignableRoles(data.roles || []))
      .catch(() => setAssignableRoles([]))
      .finally(() => setLoadingRoles(false));
  }, [isAdmin, token]);

  // --- Search users ---
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;
    setLoadingUsers(true);
    setSelectedUser(null);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`);
      if (search) url.searchParams.set("search", search);
      url.searchParams.set("limit", "10");
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      const data = await res.json();
      setUsers(data.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // --- Assign role ---
  const handleAssignRole = async () => {
    if (!token || !selectedUser || !selectedRole) return;
    setRoleActionLoading(`assign-${selectedUser.id}-${selectedRole}`);
    try {
      const body: any = { role: selectedRole };
      if (selectedRole === "university_admin") {
        if (!selectedUniversity) return toast.error("Selecciona una universidad");
        body.university_id = selectedUniversity.id;
      }
      if (selectedRole === "career_admin") {
        if (!selectedCareer) return toast.error("Selecciona una carrera");
        body.career_id = selectedCareer.id;
      }
      if (selectedRole === "subject_admin") {
        if (!selectedSubject) return toast.error("Selecciona una materia");
        body.subject_id = selectedSubject.id;
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${selectedUser.id}/assign-role`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo asignar el rol");
      }
      toast.success("Rol asignado");
      handleUserSelect(selectedUser.id);
      closeModal();
    } catch (err: any) {
      toast.error(err?.message || "Error al asignar rol");
    } finally {
      setRoleActionLoading(null);
    }
  };

  // --- Remove role ---
  const handleRemoveRole = async (userId: number, roleName: string) => {
    if (!token) return;
    setRoleActionLoading(`remove-${userId}-${roleName}`);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userId}/remove-role`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ role: roleName }),
        }
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo remover el rol");
      }
      toast.success("Rol removido");
      handleUserSelect(userId);
    } catch (err: any) {
      toast.error(err?.message || "Error al remover rol");
    } finally {
      setRoleActionLoading(null);
    }
  };

  // --- Select user to manage roles ---
  const handleUserSelect = (userId: number) => {
    const found = users.find((u) => u.id === userId);
    setSelectedUser(found || null);
    setShowModal(true);
    setSelectedRole("");
    setSelectedUniversity(null);
    setUniversitySearch("");
    setUniversityOptions([]);
    setSelectedCareer(null);
    setCareerOptions([]);
    setSelectedSubject(null);
    setSubjectOptions([]);
  };

  // --- Modal close helper ---
  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setSelectedRole("");
    setSelectedUniversity(null);
    setUniversitySearch("");
    setUniversityOptions([]);
    setSelectedCareer(null);
    setCareerOptions([]);
    setSelectedSubject(null);
    setSubjectOptions([]);
  };

  // --- University search for career/subject admin ---
  useEffect(() => {
    if (
      !selectedRole ||
      !["university_admin", "career_admin", "subject_admin"].includes(selectedRole) ||
      !universitySearch ||
      !token
    ) {
      setUniversityOptions([]);
      return;
    }
    setLoadingUniversities(true);
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/universities`);
    url.searchParams.set("search", universitySearch);
    url.searchParams.set("limit", "5");
    fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUniversityOptions(data.data || []))
      .catch(() => setUniversityOptions([]))
      .finally(() => setLoadingUniversities(false));
  }, [selectedRole, universitySearch, token]);

  // --- Fetch careers when university is selected ---
  useEffect(() => {
    if (
      !selectedUniversity ||
      !["career_admin", "subject_admin"].includes(selectedRole) ||
      !token
    ) {
      setCareerOptions([]);
      return;
    }
    setLoadingCareers(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/university/${selectedUniversity.slug}/careers`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => setCareerOptions(data.data || []))
      .catch(() => setCareerOptions([]))
      .finally(() => setLoadingCareers(false));
  }, [selectedUniversity, selectedRole, token]);

  // --- Fetch subjects when career is selected (only for subject_admin) ---
  useEffect(() => {
    if (
      !selectedCareer ||
      selectedRole !== "subject_admin" ||
      !selectedUniversity ||
      !token
    ) {
      setSubjectOptions([]);
      return;
    }
    setLoadingSubjects(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/university/${selectedUniversity.slug}/career/${selectedCareer.slug}/subjects`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => setSubjectOptions(data.data || []))
      .catch(() => setSubjectOptions([]))
      .finally(() => setLoadingSubjects(false));
  }, [selectedCareer, selectedUniversity, selectedRole, token]);

  // --- Reset lower selections if upper changes ---
  useEffect(() => {
    setSelectedCareer(null);
    setCareerOptions([]);
    setSelectedSubject(null);
    setSubjectOptions([]);
  }, [selectedUniversity]);

  useEffect(() => {
    setSelectedSubject(null);
    setSubjectOptions([]);
  }, [selectedCareer]);

  return (
    <div className="container mx-auto max-w-6xl px-2 sm:px-4 py-4 sm:py-8">
      {/* Botón Volver y Título */}
      <div className="mb-4 sm:mb-8 flex items-center gap-x-2 sm:gap-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          aria-label="Volver a la página anterior"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">Mi Perfil</h1>
      </div>

      {/* Contenido del Perfil */}
      <Suspense fallback={<ProfileDisplay.Skeleton />}>
        <ProfileDisplay />
      </Suspense>

      {/* Gestión de Roles para Admins */}
      {isAdmin && (
        <div className="mt-10">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Gestión de Roles de Usuario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSearch}
                className="flex flex-col sm:flex-row gap-2 mb-4"
              >
                <div className="relative w-full max-w-xs">
                  <Input
                    placeholder="Buscar usuario por nombre o email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-full border border-muted shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search className="h-4 w-4" />
                  </span>
                </div>
                <Button
                  type="submit"
                  disabled={loadingUsers}
                  className="rounded-full px-6 shadow"
                >
                  Buscar
                </Button>
              </form>
              {loadingUsers && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="animate-spin h-4 w-4" /> Buscando usuarios...
                </div>
              )}
              {!loadingUsers && users.length > 0 && (
                <div className="space-y-2">
                  {users
                    .filter((u) => u.id !== user?.id) // Do not show yourself
                    .map((u) => (
                      <Card
                        key={u.id}
                        className={`p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border ${selectedUser?.id === u.id
                          ? "border-primary"
                          : "border-muted"
                          }`}
                      >
                        <div>
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {u.email}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {u.roles.map((r) => (
                              <Badge key={r.id} variant="secondary">
                                {ROLE_LABELS[r.name] || r.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserSelect(u.id)}
                          className="rounded-full"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Gestionar Roles
                        </Button>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal for Assigning Roles */}
      <Dialog open={showModal} onOpenChange={open => !open && closeModal()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Asignar rol a {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <>
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedUser.roles.map((role) => (
                    <Badge key={role.id} variant="default" className="flex items-center gap-1">
                      {ROLE_LABELS[role.name] || role.name}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        title="Remover rol"
                        disabled={roleActionLoading === `remove-${selectedUser.id}-${role.name}`}
                        onClick={() => handleRemoveRole(selectedUser.id, role.name)}
                      >
                        {roleActionLoading === `remove-${selectedUser.id}-${role.name}` ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    </Badge>
                  ))}
                </div>
                <form
                  className="flex flex-col gap-3"
                  onSubmit={e => {
                    e.preventDefault();
                    handleAssignRole();
                  }}
                >
                  <label className="font-medium">Rol a asignar</label>
                  <select
                    className="rounded-full border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={selectedRole}
                    onChange={e => {
                      setSelectedRole(e.target.value);
                      setSelectedUniversity(null);
                      setUniversitySearch("");
                      setUniversityOptions([]);
                      setSelectedCareer(null);
                      setCareerOptions([]);
                      setSelectedSubject(null);
                      setSubjectOptions([]);
                    }}
                  >
                    <option value="">Selecciona un rol</option>
                    {assignableRoles
                      .filter(
                        (role) =>
                          !selectedUser.roles.some((r) => r.name === role)
                      )
                      .map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role] || role}
                        </option>
                      ))}
                  </select>
                  {/* University selection for entity roles */}
                  {["university_admin", "career_admin", "subject_admin"].includes(selectedRole) && (
                    <div>
                      {selectedUniversity ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-muted px-3 py-1 rounded-full flex items-center gap-2">
                            {selectedUniversity.name}
                            <button
                              type="button"
                              className="ml-1 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                setSelectedUniversity(null);
                                setUniversitySearch("");
                                setUniversityOptions([]);
                                setSelectedCareer(null);
                                setCareerOptions([]);
                                setSelectedSubject(null);
                                setSubjectOptions([]);
                              }}
                              aria-label="Quitar universidad seleccionada"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input
                            placeholder="Buscar universidad"
                            value={universitySearch}
                            onChange={e => {
                              setUniversitySearch(e.target.value);
                              setSelectedUniversity(null);
                            }}
                            className="pl-10 pr-4 py-2 rounded-full border border-muted shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Search className="h-4 w-4" />
                          </span>
                          {universitySearch && (
                            <div className="absolute z-10 bg-white border rounded shadow w-full mt-1 max-h-48 overflow-auto">
                              {loadingUniversities ? (
                                <div className="p-2 text-muted-foreground flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                                </div>
                              ) : universityOptions.length === 0 ? (
                                <div className="p-2 text-muted-foreground">Sin resultados</div>
                              ) : (
                                universityOptions.map((option) => (
                                  <div
                                    key={option.id}
                                    className="p-2 cursor-pointer hover:bg-primary/10"
                                    onClick={() => {
                                      setSelectedUniversity(option);
                                      setUniversitySearch("");
                                    }}
                                  >
                                    {option.name}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Career selection for career_admin and subject_admin */}
                  {["career_admin", "subject_admin"].includes(selectedRole) && selectedUniversity && (
                    <div>
                      <select
                        className="rounded-full border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={selectedCareer?.id || ""}
                        onChange={e => {
                          const c = careerOptions.find(c => c.id === Number(e.target.value));
                          setSelectedCareer(c || null);
                        }}
                      >
                        <option value="">Selecciona una carrera</option>
                        {careerOptions.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {/* Subject selection for subject_admin */}
                  {selectedRole === "subject_admin" && selectedCareer && (
                    <div>
                      <label className="font-medium">Materia</label>
                      <select
                        className="rounded-full border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={selectedSubject?.id || ""}
                        onChange={e => {
                          const s = subjectOptions.find(s => s.id === Number(e.target.value));
                          setSelectedSubject(s || null);
                        }}
                      >
                        <option value="">Selecciona una materia</option>
                        {subjectOptions.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <DialogFooter className="mt-4 flex flex-row gap-2 justify-end">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      size="sm"
                      variant="secondary"
                      className="rounded-full"
                      disabled={
                        !selectedRole ||
                        roleActionLoading === `assign-${selectedUser.id}-${selectedRole}` ||
                        (selectedRole === "university_admin" && !selectedUniversity) ||
                        (selectedRole === "career_admin" && !selectedCareer) ||
                        (selectedRole === "subject_admin" && !selectedSubject)
                      }
                    >
                      {roleActionLoading === `assign-${selectedUser.id}-${selectedRole}` ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Asignar Rol
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
