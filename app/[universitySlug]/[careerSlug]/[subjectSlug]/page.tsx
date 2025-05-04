// app/[universitySlug]/[careerSlug]/[subjectSlug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from '@/components/ui/BackButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'; // Importar

// --- Interfaces (Añadir UniversityInfo y CareerInfo) ---
interface UniversityInfo { name: string; slug: string; }
interface CareerInfo { name: string; slug: string; }
interface Exam {
  id: number; name: string; slug: string; type?: string; year?: number;
  professor?: string; created_at: string; updated_at: string;
}
interface SubjectDetail {
  id: number; name: string; slug: string; description: string | null;
  created_at: string; updated_at: string; exams: Exam[];
}
interface SubjectApiResponse { data: SubjectDetail; }
interface CareerApiResponseSimple { data: CareerInfo; } // Para obtener nombre de Carrera
interface UniversityApiResponseSimple { data: UniversityInfo; } // Para obtener nombre de Uni

// --- Funciones para obtener datos ---
// getSubjectData (se mantiene igual)
async function getSubjectData(universitySlug: string, careerSlug: string, subjectSlug: string): Promise<SubjectDetail | null> {
  // ... (implementación igual que antes) ...
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  const subjectEndpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}`;
  try {
    const response = await fetch(subjectEndpoint, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const result: SubjectApiResponse = await response.json();
    return result.data;
  } catch (error) { console.error("Error fetching subject data:", error); return null; }
}

// getCareerInfo (similar a getUniversityInfo)
async function getCareerInfo(universitySlug: string, careerSlug: string): Promise<CareerInfo | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  const careerEndpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}`;
  try {
    const response = await fetch(careerEndpoint, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const result: CareerApiResponseSimple = await response.json();
    return result.data;
  } catch (error) { console.error("Error fetching career info:", error); return null; }
}

// getUniversityInfo (reutilizar o copiar desde página de carrera)
async function getUniversityInfo(slug: string): Promise<UniversityInfo | null> {
  // ... (misma implementación que en página de carrera) ...
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  const universityEndpoint = `${apiUrl}/api/university/${slug}`;
  try {
    const response = await fetch(universityEndpoint, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const result: { data: UniversityInfo } = await response.json();
    return result.data;
  } catch (error) { console.error("Error fetching university info:", error); return null; }
}


// --- Componente de Página ---
export default async function SubjectPage({ params }: { params: Promise<{ universitySlug: string, careerSlug: string, subjectSlug: string }> }) {
  const { universitySlug, careerSlug, subjectSlug } = await params;
  // Obtener todos los datos en paralelo
  const [subjectData, careerInfo, universityInfo] = await Promise.all([
    getSubjectData(universitySlug, careerSlug, subjectSlug),
    getCareerInfo(universitySlug, careerSlug),
    getUniversityInfo(universitySlug)
  ]);

  if (!subjectData || !careerInfo || !universityInfo) {
    notFound();
  }

  // Construir items para Breadcrumbs
  const breadcrumbItems = [
    { label: universityInfo.name, href: `/${universitySlug}` },
    { label: careerInfo.name, href: `/${universitySlug}/${careerSlug}` },
    { label: subjectData.name, href: `/${universitySlug}/${careerSlug}/${subjectSlug}` }, // Último
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Encabezado */}
      <div className="mb-6 flex items-center justify-between">
        <div className='flex-grow'>
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{subjectData.name}</h1>
        </div>
        <BackButton />
      </div>

      {/* Descripción */}
      {subjectData.description && (
        <Card className="mb-8 bg-muted/30">
          <CardHeader><CardTitle className="text-lg">Descripción</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">{subjectData.description}</p></CardContent>
        </Card>
      )}

      {/* Sección de Exámenes (sin barra de búsqueda aquí) */}
      <section>
        <h2 className="text-2xl font-semibold mb-5 border-b pb-2">Exámenes Disponibles</h2>
        {subjectData.exams && subjectData.exams.length > 0 ? (
          <div className="space-y-4">
            {subjectData.exams.map((exam) => (
              <Link
                key={exam.id}
                href={`/${universitySlug}/${careerSlug}/${subjectSlug}/${exam.slug}`}
                passHref
                className="block hover:bg-muted/50 transition-colors duration-150 rounded-lg"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{exam.name || `Examen ID: ${exam.id}`}</CardTitle>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {exam.type && <Badge variant="secondary">{exam.type}</Badge>}
                      {exam.year && <Badge variant="outline">Año: {exam.year}</Badge>}
                      {exam.professor && <Badge variant="outline">Prof: {exam.professor}</Badge>}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No se encontraron exámenes para esta materia.</p>
        )}
      </section>
    </div>
  );
}

// --- Generar Metadata ---
export async function generateMetadata({ params }: { params: Promise<{ universitySlug: string, careerSlug: string, subjectSlug: string }> }) {
  // ... (se mantiene igual, podría añadir nombres de Uni/Carrera) ...
  const { universitySlug, careerSlug, subjectSlug } = await params;
  const subjectData = await getSubjectData(universitySlug, careerSlug, subjectSlug);

  if (!subjectData) {
    return { title: 'Materia no encontrada' };
  }
  return {
    title: `${subjectData.name} | Axiom`,
    description: subjectData.description || `Exámenes de ${subjectData.name}`,
  };
}
