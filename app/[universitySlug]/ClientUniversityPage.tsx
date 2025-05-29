// app/[universitySlug]/ClientUniversityPage.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { BackButton } from "@/components/ui/BackButton";
import { UniversityAdministrators } from "@/components/university/UniversityAdministrators";
import { CareerList } from "@/components/lists/CareerList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AddCareerModal from "@/components/university/AddCareerModal";
import EditUniversityModal from "@/components/university/EditUniversityModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const router = useRouter();
  const [careers, setCareers] = useState<Career[]>(universityData.careers || []);
  const [showAddCareer, setShowAddCareer] = useState(false);
  const [showEditUniversity, setShowEditUniversity] = useState(false);

  const isAdmin = user?.roles?.includes("admin" as any);
  const isUniversityAdmin = user?.admin_universities?.some(
    (u: { id: number }) => u.id === universityData.id
  );
  const canCreateOrEdit = isAdmin || isUniversityAdmin;

  const handleCareerAdded = (career: Career) => {
    setCareers((prev) => [...prev, career]);
  };

  // Eliminar universidad
  const handleDeleteUniversity = async () => {
    if (!token) {
      toast.error("No autenticado.");
      return;
    }
    if (!confirm("¿Seguro que querés eliminar la universidad? Esta acción no se puede deshacer.")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(
        `${apiUrl}/api/university/${universityData.slug}`,
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
        throw new Error(data.message || "Error al eliminar la universidad.");
      }
      toast.success("Universidad eliminada correctamente.");
      router.push(`/`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido.");
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
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

      {/* Botones de acciones (agregar carrera, editar, eliminar) */}
      {canCreateOrEdit && (
        <div className="flex gap-2 mb-6">
          <Button variant="default" onClick={() => setShowAddCareer(true)}>
            Agregar Carrera
          </Button>
          <Button variant="outline" onClick={() => setShowEditUniversity(true)}>
            Editar Universidad
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteUniversity}
          >
            Eliminar Universidad
          </Button>
        </div>
      )}

      <AddCareerModal
        open={showAddCareer}
        onOpenChange={setShowAddCareer}
        universitySlug={universityData.slug}
        token={token}
        onCareerAdded={handleCareerAdded}
      />
      <EditUniversityModal
        open={showEditUniversity}
        onOpenChange={setShowEditUniversity}
        universitySlug={universityData.slug}
        universityName={universityData.name}
        universityDescription={universityData.description}
        token={token}
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
