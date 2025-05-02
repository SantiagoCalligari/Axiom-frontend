// app/perfil/page.tsx
import { ProfileDisplay } from "@/components/profile/ProfileDisplay"; // We'll create this next
import { Suspense } from "react"; // Optional: For loading states

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>
      {/* Optional Suspense boundary if ProfileDisplay uses it */}
      <Suspense fallback={<p>Cargando perfil...</p>}>
        <ProfileDisplay />
      </Suspense>
    </div>
  );
}

