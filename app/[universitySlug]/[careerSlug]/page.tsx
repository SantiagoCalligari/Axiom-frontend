// app/[universitySlug]/[careerSlug]/page.tsx
import { notFound } from 'next/navigation';
// Link no se usa directamente aquí ahora
// import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackButton } from '@/components/ui/BackButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'; // Importar Breadcrumbs
import { SubjectList } from '@/components/lists/SubjectList'; // Importar SubjectList

// --- Interfaces (Añadir UniversityInfo para el breadcrumb) ---
interface UniversityInfo { // Interfaz simplificada para la info necesaria
  name: string;
  slug: string;
}
interface Subject {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}
interface CareerDetail {
  id: number;
  university_id: number;
  name: string;
  slug: string;
  description: string | null;
  subjects: Subject[];
  // Asumimos que la API de carrera NO devuelve info de la universidad
}
interface CareerApiResponse { data: CareerDetail; }
interface UniversityApiResponse { data: UniversityInfo; } // Para obtener nombre de Uni

// --- Funciones para obtener datos ---
// getCareerData (se mantiene igual, pero no necesita devolver subjects si usamos SubjectList)
async function getCareerData(universitySlug: string, careerSlug: string): Promise<CareerDetail | null> {
  // ... (implementación igual que antes) ...
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  const careerEndpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}`;
  try {
    const response = await fetch(careerEndpoint, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const result: CareerApiResponse = await response.json();
    return result.data;
  } catch (error) { console.error("Error fetching career data:", error); return null; }
}

// Nueva función para obtener solo info básica de la universidad
async function getUniversityInfo(slug: string): Promise<UniversityInfo | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  const universityEndpoint = `${apiUrl}/api/university/${slug}`; // Endpoint de la universidad
  try {
    // Podríamos optimizar para pedir menos datos si la API lo permite
    const response = await fetch(universityEndpoint, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}`);
    // Asumimos que la respuesta completa tiene al menos name y slug
    const result: { data: UniversityInfo } = await response.json();
    return result.data;
  } catch (error) { console.error("Error fetching university info:", error); return null; }
}

// --- Componente de Página ---
export default async function CareerPage({ params }: { params: Promise<{ universitySlug: string, careerSlug: string }> }) {
  const { universitySlug, careerSlug } = await params;
  // Obtener datos en paralelo
  const [careerData, universityInfo] = await Promise.all([
    getCareerData(universitySlug, careerSlug),
    getUniversityInfo(universitySlug) // Obtener info de la Uni para breadcrumb
  ]);

  if (!careerData || !universityInfo) {
    notFound();
  }

  // Construir items para Breadcrumbs
  const breadcrumbItems = [
    { label: universityInfo.name, href: `/${universitySlug}` },
    { label: careerData.name, href: `/${universitySlug}/${careerSlug}` }, // Último item
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between"> {/* Ajustado para espacio */}
        {/* Breadcrumbs y Título a la izquierda */}
        <div className='flex-grow'>
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{careerData.name}</h1>
        </div>
        {/* Botón Volver a la derecha */}
        <BackButton />
      </div>

      {/* Descripción */}
      {careerData.description && (
        <Card className="mb-8 bg-muted/30">
          <CardHeader><CardTitle className="text-lg">Descripción</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">{careerData.description}</p></CardContent>
        </Card>
      )}

      {/* Sección de Materias con Búsqueda */}
      <section>
        <h2 className="text-2xl font-semibold mb-5 border-b pb-2">Materias</h2>
        {/* Usar el componente SubjectList */}
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
  // ... (se mantiene igual, podría añadir nombre de Uni si se obtiene aquí también) ...
  const { universitySlug, careerSlug } = await params;
  const careerData = await getCareerData(universitySlug, careerSlug);

  if (!careerData) {
    return { title: 'Carrera no encontrada' };
  }
  return {
    title: `${careerData.name} | Axiom`,
    description: careerData.description || `Materias de la carrera ${careerData.name}`,
  };
}
