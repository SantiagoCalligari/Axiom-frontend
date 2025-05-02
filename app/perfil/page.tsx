// // app/perfil/page.tsx
import { ProfileDisplay } from "@/components/profile/ProfileDisplay";
import { Suspense } from "react";

export default function ProfilePage() {
  return (
    // Contenedor principal con padding y ancho máximo
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* El título puede ir aquí o dentro de ProfileDisplay si prefieres */}
      {/* <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1> */}
      <Suspense fallback={<ProfileDisplay.Skeleton />}> {/* Usaremos un Skeleton estático */}
        <ProfileDisplay />
      </Suspense>
    </div>
  );
}
