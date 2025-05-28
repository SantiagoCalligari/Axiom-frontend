// app/[universitySlug]/[careerSlug]/ClientCareerPage.tsx

"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import EditCareerModal from "@/components/career/EditCareerModal";
import CreateSubjectModal from "@/components/career/CreateSubjectModal";
import { SubjectList } from "@/components/lists/SubjectList";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { BackButton } from "@/components/ui/BackButton";
import { useRouter } from "next/navigation";
import { CareerAdministrators } from "@/components/career/CareerAdministrators";

interface Subject {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

interface CareerDetail {
  id: number;
  university_id: number;
  name: string;
  slug: string;
  description: string | null;
  subjects: Subject[];
  administrators: { id: number; name: string; email: string }[];
}

interface UniversityInfo {
  name: string;
  slug: string;
}

interface ClientCareerPageProps {
  careerData: CareerDetail;
  universityInfo: UniversityInfo;
  breadcrumbItems: { label: string; href: string }[];
}

export default function ClientCareerPage({
  careerData,
  universityInfo,
  breadcrumbItems,
}: ClientCareerPageProps) {
  const { user, token } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>(careerData.subjects || []);
  const [career, setCareer] = useState<CareerDetail>(careerData);
  const router = useRouter();

  // Permisos
  const isAdmin = user?.roles?.includes("admin" as any);
  const isUniversityAdmin = user?.admin_universities?.some(u => u.id === careerData.university_id);
  const isCareerAdmin = user?.admin_careers?.some(c => c.id === careerData.id);
  const canEdit = isAdmin || isUniversityAdmin || isCareerAdmin;
  const canDelete = isAdmin || isUniversityAdmin;

  // Eliminar carrera
  const handleDelete = async () => {
    if (!token) {
      toast.error("No autenticado.");
      return;
    }
    if (!confirm("¿Seguro que querés eliminar la carrera? Esta acción no se puede deshacer.")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(
        `${apiUrl}/api/university/${universityInfo.slug}/career/${careerData.slug}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Error al eliminar la carrera.");
      }
      toast.success("Carrera eliminada correctamente.");
      router.push(`/${universityInfo.slug}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido.");
    }
  };

  // Actualizar carrera tras edición
  const handleCareerUpdated = (updated: { name: string; description: string }) => {
    setCareer((prev) => ({
      ...prev,
      name: updated.name,
      description: updated.description,
    }));
  };

  // Agregar materia
  const handleSubjectAdded = (subject: Subject) => {
    setSubjects((prev) => [...prev, subject]);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Encabezado */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-grow pr-4">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{career.name}</h1>
        </div>
        <div className="flex-shrink-0">
          <BackButton />
        </div>
      </div>

      {/* Acciones de admin */}
      {canEdit && (
        <div className="flex gap-2 mb-8">
          <Button variant="default" onClick={() => setCreateSubjectOpen(true)}>
            Agregar Materia
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            Editar carrera
          </Button>
          {canDelete && (
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar carrera
            </Button>
          )}
        </div>
      )}

      {/* Descripción */}
      {career.description && (
        <Card className="mb-8 bg-muted/30 border">
          <CardHeader>
            <CardTitle className="text-lg">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{career.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Sección de Materias con Búsqueda */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Materias</h2>
        </div>
        <SubjectList
          subjects={subjects}
          universitySlug={universityInfo.slug}
          careerSlug={career.slug}
        />
      </section>

      {/* Modales */}
      <EditCareerModal
        open={editOpen}
        onOpenChange={setEditOpen}
        universitySlug={universityInfo.slug}
        careerSlug={career.slug}
        initialName={career.name}
        initialDescription={career.description}
        token={token}
        onCareerUpdated={handleCareerUpdated}
      />
      <CreateSubjectModal
        open={createSubjectOpen}
        onOpenChange={setCreateSubjectOpen}
        universitySlug={universityInfo.slug}
        careerSlug={career.slug}
        token={token}
        onSubjectAdded={handleSubjectAdded}
      />

      {/* Administradores de la carrera */}
      <CareerAdministrators administrators={careerData.administrators || []} />
    </div>
  );
}
