// components/profile/ProfileDisplay.tsx
"use client";

// ... (imports: useAuth, React, useState, useEffect, toast, Avatar, Skeleton, Card)
// NO necesitamos importar Image de next/image para este enfoque
import { useAuth } from "@/app/context/AuthContext";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


// ... (Interfaz User y getInitials se mantienen igual)
interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

const getInitials = (name: string = ""): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};


// Skeleton actualizado para reflejar el nuevo enfoque (un solo contenedor)
const ProfileSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    {/* Skeleton Columna Izquierda */}
    <div className="md:col-span-1 flex flex-col items-center space-y-4">
      {/* Skeleton para el contenedor del marco/avatar */}
      <Skeleton className="w-40 h-40 md:w-48 md:h-48 rounded-md" /> {/* Un solo skeleton para el área */}
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-1/2 mt-2" />
    </div>
    {/* Skeleton Columna Derecha (se mantiene igual) */}
    <div className="md:col-span-2 space-y-8">
      {/* ... Skeletons de las Cards ... */}
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
  // ... (useState, useEffect para fetchUserData se mantienen igual)
  const { token, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      // ... (lógica de fetchUserData se mantiene igual) ...
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
          // logout();
          // toast.error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
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
  }, [token, logout]);


  // --- Loading State ---
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // --- Error State ---
  if (error) {
    return <p className="text-center text-red-600">Error al cargar el perfil: {error}</p>;
  }

  // --- Success State ---
  if (!user) {
    return <p className="text-center text-muted-foreground">No se encontraron datos del usuario.</p>;
  }

  // --- Renderizado Principal (Dos Columnas) ---
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

      {/* --- Columna Izquierda: Perfil Básico --- */}
      <div className="md:col-span-1 space-y-6">
        <div className="flex flex-col items-center text-center p-4 md:p-0">

          {/* Contenedor con el marco como FONDO */}
          <div
            className="relative w-40 h-40 md:w-48 md:h-48 mb-4 bg-contain bg-center bg-no-repeat" // Clases para el fondo
            style={{ backgroundImage: 'url(/Delft/marco.png)' }} // Establecer imagen de fondo
          >
            {/* Avatar centrado absolutamente */}
            <Avatar className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] text-4xl"> {/* Reducido a 85% para asegurar que no toque los bordes */}
              {/* <AvatarImage src={user.profile_picture_url} alt={user.name} /> */}
              {/* Hacer el fondo del Fallback transparente */}
              <AvatarFallback className="bg-transparent">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Nombre, Email, etc. */}
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
          <p className="text-sm text-muted-foreground mt-3">
            Miembro desde: {new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* --- Columna Derecha: Secciones con Cards (se mantiene igual) --- */}
      <div className="md:col-span-2 space-y-8">
        {/* ... Cards para Universidades, Carreras, Parciales ... */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Universidades</CardTitle>
            <CardDescription>Universidades asociadas a tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Funcionalidad pendiente: Aquí se mostrará un listado de tus universidades.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis Carreras</CardTitle>
            <CardDescription>Carreras que estás siguiendo.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Funcionalidad pendiente: Aquí se mostrará un listado de tus carreras.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis Parciales Subidos</CardTitle>
            <CardDescription>Exámenes que has compartido con la comunidad.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Funcionalidad pendiente: Aquí se mostrará un listado de los parciales que has subido.
            </p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// Exportar el Skeleton como una propiedad estática
ProfileDisplay.Skeleton = ProfileSkeleton;

