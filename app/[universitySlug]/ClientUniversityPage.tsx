// app/[universitySlug]/ClientUniversityPage.tsx

"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { BackButton } from "@/components/ui/BackButton";
import { UniversityAdminActions } from "@/components/university/UniversityAdminActions";
import { UniversityAdministrators } from "@/components/university/UniversityAdministrators";
import { CareerList } from "@/components/lists/CareerList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import CreateUniversityModal from "@/components/university/CreateUniversityModal";

interface Career {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}
interface UniversityDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  careers: Career[];
  administrators: { id: number; name: string; email: string }[];
}
interface ClientUniversityPageProps {
  universityData: UniversityDetail;
  breadcrumbItems: { label: string; href: string }[];
}

export default function ClientUniversityPage({
  universityData,
  breadcrumbItems,
}: ClientUniversityPageProps) {
  const { user, token } = useAuth();
  const [careers, setCareers] = useState<Career[]>(universityData.careers || []);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isAdmin = user?.roles?.includes("admin" as any);

  const handleCareerAdded = (career: Career) => {
    setCareers((prev) => [...prev, career]);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Botón solo para admin */}
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <button
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition"
            onClick={() => setShowCreateModal(true)}
          >
            Crear Universidad
          </button>
        </div>
      )}
      <CreateUniversityModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        token={token}
      />

      {/* Encabezado con Breadcrumbs y Botón Volver */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex-grow pr-4">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{universityData.name}</h1>
        </div>
        <div className="flex-shrink-0">
          <BackButton />
        </div>
      </div>

      {/* Acciones de administrador (agregar carrera, editar universidad) */}
      <UniversityAdminActions
        universityId={universityData.id}
        universitySlug={universityData.slug}
        universityName={universityData.name}
        universityDescription={universityData.description}
        administrators={universityData.administrators || []}
        onCareerAdded={handleCareerAdded}
      />

      {/* Descripción */}
      {universityData.description && (
        <Card className="mb-8 bg-muted/30 border">
          <CardHeader>
            <CardTitle className="text-lg">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{universityData.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Sección de Carreras con Búsqueda */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Carreras Ofrecidas</h2>
        </div>
        <CareerList
          careers={careers}
          universitySlug={universityData.slug}
        />
      </section>

      {/* Administradores al fondo, más pequeño y bonito */}
      <UniversityAdministrators administrators={universityData.administrators || []} />
    </div>
  );
}
