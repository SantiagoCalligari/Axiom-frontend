"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, GraduationCap, BookOpen, Star } from "lucide-react";
import Link from "next/link";

interface University {
  id: number;
  name: string;
  slug: string;
}

interface Career {
  id: number;
  name: string;
  slug: string;
  university_id: number;
  university: University;
}

interface Subject {
  id: number;
  name: string;
  slug: string;
  career_id: number;
  career: Career;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  roles: string[];
  admin_universities?: University[];
  admin_careers?: Career[];
  admin_subjects?: Subject[];
}

interface Subscriptions {
  universities: University[];
  careers: Career[];
  subjects: Subject[];
}

const getInitials = (name: string = ""): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const ProfileSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div className="md:col-span-1 flex flex-col items-center space-y-4">
      <Skeleton className="w-40 h-40 md:w-48 md:h-48 rounded-md" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-1/2 mt-2" />
    </div>
    <div className="md:col-span-2 space-y-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-5 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-5 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-5 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

export function ProfileDisplay() {
  const { token } = useAuth();
  const [user, setUser] = useState<UserData | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscriptions>({
    universities: [],
    careers: [],
    subjects: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user info (admin roles, etc)
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      if (!token) {
        setError("No estás autenticado.");
        setIsLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        setError("URL de la API no configurada.");
        setIsLoading(false);
        return;
      }
      const userEndpoint = `${apiUrl}/api/auth/user`;

      try {
        const response = await fetch(userEndpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401 || response.status === 403) {
          throw new Error("Sesión inválida o expirada.");
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error ${response.status}: No se pudo obtener los datos del usuario.`);
        }

        const result = await response.json();
        setUser(result.data || result);

      } catch (err) {
        const message = err instanceof Error ? err.message : "Ocurrió un error inesperado.";
        setError(message);
        console.error("Error fetching user data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  // Fetch subscriptions
  useEffect(() => {
    if (!token) return;
    setLoadingSubs(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    fetch(`${apiUrl}/api/subscriptions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setSubscriptions(data))
      .catch(() => setSubscriptions({ universities: [], careers: [], subjects: [] }))
      .finally(() => setLoadingSubs(false));
  }, [token]);

  if (isLoading || loadingSubs) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return <p className="text-center text-red-600">Error al cargar el perfil: {error}</p>;
  }

  if (!user) {
    return <p className="text-center text-muted-foreground">No se encontraron datos del usuario.</p>;
  }

  // Helpers to check admin status
  const isAdminUniversity = (u: University) =>
    user.admin_universities?.some((au) => au.id === u.id);
  const isAdminCareer = (c: Career) =>
    user.admin_careers?.some((ac) => ac.id === c.id);
  const isAdminSubject = (s: Subject) =>
    user.admin_subjects?.some((as) => as.id === s.id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* --- Columna Izquierda: Perfil Básico --- */}
      <div className="md:col-span-1 space-y-6">
        <div className="flex flex-col items-center text-center p-4 md:p-0">
          <div
            className="relative w-40 h-40 md:w-48 md:h-48 mb-4 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/Delft/marco.png)' }}
          >
            <Avatar className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] text-4xl">
              <AvatarFallback className="bg-transparent">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
          <p className="text-sm text-muted-foreground mt-3">
            Miembro desde: {new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* --- Columna Derecha: Suscripciones y roles administrativos --- */}
      <div className="md:col-span-2 space-y-8">
        {/* Universidades suscriptas */}
        {subscriptions.universities && subscriptions.universities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Universidades suscriptas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {subscriptions.universities.map((u) => (
                  <Link key={u.id} href={`/${u.slug}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 transition">
                      {u.name}
                      {isAdminUniversity(u) && (
                        <Star className="inline ml-1 h-4 w-4 text-yellow-500" fill="currentColor" />
                      )}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Carreras suscriptas */}
        {subscriptions.careers && subscriptions.careers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Carreras suscriptas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {subscriptions.careers.map((c) => (
                  < Link
                    key={c.id}
                    href={`/${c.university.slug}/${c.slug}`}
                  >
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 transition">
                      {c.name}
                      {isAdminCareer(c) && (
                        <Star className="inline ml-1 h-4 w-4 text-yellow-500" fill="currentColor" />
                      )}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materias suscriptas */}
        {subscriptions.subjects && subscriptions.subjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Materias suscriptas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {subscriptions.subjects.map((subject) => (
                  <Link
                    key={subject.id}
                    href={`/${subject.career?.university?.slug || "universidad"}/${subject.career?.slug || "carrera"}/${subject.slug}`}
                  >
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 transition">
                      {subject.name}
                      {isAdminSubject(subject) && (
                        <Star className="inline ml-1 h-4 w-4 text-yellow-500" fill="currentColor" />
                      )}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Universidades donde sos admin */}
        {user.admin_universities && user.admin_universities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Universidades donde sos administrador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.admin_universities.map((u) => (
                  <Link key={u.id} href={`/${u.slug}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 transition">
                      {u.name}
                      <Star className="inline ml-1 h-4 w-4 text-yellow-500" fill="currentColor" />
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Carreras donde sos admin */}
        {user.admin_careers && user.admin_careers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Carreras donde sos administrador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.admin_careers.map((career) => {
                  // Buscar la universidad en subscriptions
                  const uni = subscriptions.universities.find(u => u.id === career.university_id);
                  if (!uni) {
                    return (
                      <Badge key={career.id} variant="secondary" className="cursor-default">
                        {career.name}
                        <Star className="inline ml-1 h-4 w-4 text-yellow-500" fill="currentColor" />
                      </Badge>
                    );
                  }
                  return (
                    <Link key={career.id} href={`/${uni.slug}/${career.slug}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 transition">
                        {career.name}
                        <Star className="inline ml-1 h-4 w-4 text-yellow-500" fill="currentColor" />
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materias donde sos admin */}
        {user.admin_subjects && user.admin_subjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Materias donde sos administrador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.admin_subjects.map((subject) => {
                  // Buscar la carrera y universidad en subscriptions
                  const car = subscriptions.careers.find(c => c.id === subject.career_id);
                  const uni = car && subscriptions.universities.find(u => u.id === car.university_id);
                  if (!car || !uni) {
                    return (
                      <Badge key={subject.id} variant="secondary" className="cursor-default">
                        {subject.name}
                        <Star className="inline ml-1 h-4 w-4 text-yellow-500" fill="currentColor" />
                      </Badge>
                    );
                  }
                  return (
                    <Link key={subject.id} href={`/${uni.slug}/${car.slug}/${subject.slug}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20 transition">
                        {subject.name}
                        <Star className="inline ml-1 h-4 w-4 text-yellow-500" fill="currentColor" />
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div >
  );
}

ProfileDisplay.Skeleton = ProfileSkeleton;
