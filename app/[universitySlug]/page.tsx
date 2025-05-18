// app/[universitySlug]/page.tsx
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackButton } from '@/components/ui/BackButton';
import { CareerList } from '@/components/lists/CareerList';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import CreateCareerButton from './CreateCareerButton';

// --- Interfaces ---
interface Career {
  id: number;
  name: string;
  slug: string;
}
interface UniversityDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  careers: Career[];
}
interface ApiResponse { data: UniversityDetail; }

// --- Función para obtener datos ---
// NO EXPORTAR ESTA FUNCIÓN
async function getUniversityData(slug: string): Promise<UniversityDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.error("URL de la API no configurada.");
    return null;
  }
  const universityEndpoint = `${apiUrl}/api/university/${slug}`;
  try {
    const response = await fetch(universityEndpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}: No se pudo obtener la universidad.`);
    const result: ApiResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching university data:", error);
    return null;
  }
}

// --- Componente de Página ---
export default async function UniversityPage({ params }: { params: Promise<{ universitySlug: string }> }) {
  const { universitySlug } = await params;
  const universityData = await getUniversityData(universitySlug);

  if (!universityData) {
    notFound();
  }

  // --- Construir Breadcrumbs ---
  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: universityData.name, href: `/${universitySlug}` },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Encabezado con Breadcrumbs y Botón Volver */}
      <div className="mb-6 flex items-start justify-between">
        <div className='flex-grow pr-4'>
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{universityData.name}</h1>
        </div>
        <div className="flex-shrink-0">
          <BackButton />
        </div>
      </div>

      {/* Descripción */}
      {universityData.description && (
        <Card className="mb-8 bg-muted/30 border">
          <CardHeader><CardTitle className="text-lg">Descripción</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">{universityData.description}</p></CardContent>
        </Card>
      )}

      {/* Sección de Carreras con Búsqueda */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Carreras Ofrecidas</h2>
          <CreateCareerButton universitySlug={universityData.slug} />
        </div>
        <CareerList
          careers={universityData.careers || []}
          universitySlug={universityData.slug}
        />
      </section>
    </div>
  );
}
