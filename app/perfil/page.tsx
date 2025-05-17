// app/perfil/page.tsx
"use client"; // Necesario para useRouter

import { ProfileDisplay } from "@/components/profile/ProfileDisplay";
import { Suspense } from "react";
import { useRouter } from "next/navigation"; // Importar useRouter
import { Button } from "@/components/ui/button"; // Importar Button
import { ArrowLeft } from "lucide-react"; // Importar icono

export default function ProfilePage() {
  const router = useRouter(); // Inicializar el router

  return (
    // Contenedor principal con padding y ancho máximo
    <div className="container mx-auto max-w-6xl px-2 sm:px-4 py-4 sm:py-8">
      {/* Botón Volver y Título */}
      <div className="mb-4 sm:mb-8 flex items-center gap-x-2 sm:gap-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()} // Añadir onClick para volver
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
    </div>
  );
}
