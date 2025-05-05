// app/[universitySlug]/[careerSlug]/page.tsx
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackButton } from '@/components/ui/BackButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SubjectList } from '@/components/lists/SubjectList';

// --- Interfaces ---
interface UniversityInfo { name: string; slug: string; }
interface Subject { id: number; name: string; slug: string; description: string | null; }
interface CareerDetail {
  id: number; university_id: number; name: string; slug: string;
  description: string | null; subjects: Subject[];
}
interface CareerApiResponse { data: CareerDetail; }
interface UniversityApiResponseSimple { data: UniversityInfo; }

// --- Funciones para obtener datos ---
async function getCareerData(universitySlug: string, careerSlug: string): Promise<CareerDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  const careerEndpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}`;
  try {
    const response = await fetch(careerEndpoint, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}: No se pudo obtener la carrera.`);
    const result: CareerApiResponse = await response.json();
    return result.data;
  } catch (error) { console.error("Error fetching career data:", error); return null; }
}

async function getUniversityInfo(slug: string): Promise<UniversityInfo | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  const universityEndpoint = `${apiUrl}/api/university/${slug}`;
  try {
    const response = await fetch(universityEndpoint, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}: No se pudo obtener info de la universidad.`);
    const result: { data: UniversityInfo } = await response.json();
    return result.data;
  } catch (error) { console.error("Error fetching university info:", error); return null; }
}

// --- Componente de Página ---
export default async function CareerPage({ params }: { params: Promise<{ universitySlug: string, careerSlug: string }> }) {
  const { universitySlug, careerSlug } = await params; // Manteniendo tu forma
  const [careerData, universityInfo] = await Promise.all([
    getCareerData(universitySlug, careerSlug),
    getUniversityInfo(universitySlug)
  ]);

  if (!careerData || !universityInfo) {
    notFound();
  }

  // --- Construir Breadcrumbs (con Inicio) ---
  const breadcrumbItems = [
    { label: "Inicio", href: "/" }, // Enlace a la página principal
    { label: universityInfo.name, href: `/${universitySlug}` },
    { label: careerData.name, href: `/${universitySlug}/${careerSlug}` }, // Item actual
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Encabezado */}
      <div className="mb-6 flex items-start justify-between">
        <div className='flex-grow pr-4'>
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{careerData.name}</h1>
        </div>
        <div className="flex-shrink-0">
          <BackButton />
        </div>
      </div>

      {/* Descripción */}
      {careerData.description && (
        <Card className="mb-8 bg-muted/30 border">
          <CardHeader><CardTitle className="text-lg">Descripción</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">{careerData.description}</p></CardContent>
        </Card>
      )}

      {/* Sección de Materias con Búsqueda */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Materias</h2>
        <SubjectList
          subjects={careerData.subjects || []}
          universitySlug={universitySlug}
          careerSlug={careerSlug}
        />
      </section>
    </div>
  );
}

// --- Generar Metadata ---
export async function generateMetadata({ params }: { params: Promise<{ universitySlug: string, careerSlug: string }> }) {
  const { universitySlug, careerSlug } = await params; // Manteniendo tu forma
  const careerData = await getCareerData(universitySlug, careerSlug);
  // Podríamos obtener universityInfo aquí también para el título si quisiéramos

  if (!careerData) {
    return { title: 'Carrera no encontrada' };
  }
  return {
    // title: `${careerData.name} - ${universityInfo?.name || ''} | Axiom`, // Ejemplo con nombre de Uni
    title: `${careerData.name} | Axiom`,
    description: careerData.description || `Materias de la carrera ${careerData.name}`,
  };
}
