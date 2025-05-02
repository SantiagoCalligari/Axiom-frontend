// components/profile/ProfileDisplay.tsx
"use client";

import { useAuth } from "@/app/context/AuthContext";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Using Shadcn Avatar
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

// Interface based on the Postman response for /api/auth/user
interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  // Add other fields if your API returns more
}

// Helper function to get initials from name
const getInitials = (name: string = ""): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2) // Get max 2 initials
    .join("")
    .toUpperCase();
};

export function ProfileDisplay() {
  const { token } = useAuth(); // Get token from context
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      if (!token) {
        setError("No estás autenticado.");
        setIsLoading(false);
        // Optional: Redirect to login?
        // router.push('/login');
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
            Authorization: `Bearer ${token}`, // Send the token
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        // Check if token is invalid/expired (common status codes)
        if (response.status === 401 || response.status === 403) {
          // Optional: Clear token and redirect?
          // logout(); // Assuming logout clears token from context/storage
          // toast.error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
          // router.push('/'); // Redirect to home or login
          throw new Error("Sesión inválida o expirada.");
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})); // Try to get error message
          throw new Error(errorData.message || `Error ${response.status}: No se pudo obtener los datos del usuario.`);
        }

        const result = await response.json();

        // Assuming the API returns { "data": { ...user data } }
        if (result.data) {
          setUser(result.data);
        } else {
          // Handle cases where 'data' property might be missing
          setUser(result); // Or throw error if structure is unexpected
          console.warn("La respuesta de la API no contenía la propiedad 'data'.", result);
        }

      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Ocurrió un error inesperado.";
        setError(message);
        toast.error(message);
        console.error("Error fetching user data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [token]); // Re-fetch if token changes

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Skeleton className="h-8 w-1/3" /> {/* Placeholder for section title */}
        <Skeleton className="h-10 w-full" /> {/* Placeholder for section content */}
        <Skeleton className="h-8 w-1/3" /> {/* Placeholder for section title */}
        <Skeleton className="h-10 w-full" /> {/* Placeholder for section content */}
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return <p className="text-red-600">Error al cargar el perfil: {error}</p>;
  }

  // --- Success State ---
  if (!user) {
    // Should ideally be covered by loading/error, but as a fallback
    return <p>No se encontraron datos del usuario.</p>;
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 p-4 border rounded-lg bg-card text-card-foreground shadow">
        <Avatar className="h-20 w-20 text-xl">
          {/* Optional: Add AvatarImage if you store image URLs later */}
          {/* <AvatarImage src={user.profile_picture_url} alt={user.name} /> */}
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-semibold">{user.name}</h2>
          <p className="text-muted-foreground">{user.email}</p>
          {/* You could add more details like join date */}
          {/* <p className="text-sm text-muted-foreground">Miembro desde: {new Date(user.created_at).toLocaleDateString()}</p> */}
        </div>
      </div>

      {/* Placeholder Sections */}
      <section>
        <h3 className="text-xl font-semibold mb-3 border-b pb-2">Mis Universidades</h3>
        <div className="p-4 rounded-md bg-muted text-muted-foreground">
          <p>Aquí se mostrarán las universidades asociadas a tu cuenta.</p>
          {/* TODO: Fetch and display user's universities from API */}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3 border-b pb-2">Mis Carreras</h3>
        <div className="p-4 rounded-md bg-muted text-muted-foreground">
          <p>Aquí se mostrarán las carreras que estás cursando.</p>
          {/* TODO: Fetch and display user's careers from API */}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3 border-b pb-2">Mis Parciales Subidos</h3>
        <div className="p-4 rounded-md bg-muted text-muted-foreground">
          <p>Aquí verás un listado de los parciales que has subido.</p>
          {/* TODO: Fetch and display user's uploaded exams from API */}
        </div>
      </section>
    </div>
  );
}

