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
import { Badge } from "@/components/ui/badge"; // Para mostrar info extra del examen
import { BackButton } from '@/components/ui/BackButton';

// --- Interfaces ---
interface Exam {
  id: number;
  // subject_id: number; // Probablemente no venga aquí
  // user_id: number; // Quizás si quieres mostrar quién lo subió
  name: string; // O un nombre/descripción del examen
  slug: string; // Asumiendo que los exámenes tienen slug
  // Otros campos relevantes: year, professor, type ('parcial', 'final'), file_url?
  type?: string;
  year?: number;
  professor?: string;
  created_at: string;
  updated_at: string;
}

interface SubjectDetail {
  id: number;
  // university_id: number;
  // career_id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  exams: Exam[]; // Asumiendo que la API anida los exámenes
}

interface SubjectApiResponse {
  data: SubjectDetail;
}

// --- Función para obtener datos de la materia ---
async function getSubjectData(universitySlug: string, careerSlug: string, subjectSlug: string): Promise<SubjectDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.error("URL de la API no configurada.");
    return null;
  }
  // Endpoint API correcto según route:list
  const subjectEndpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}`;

  try {
    const response = await fetch(subjectEndpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}: No se pudo obtener la materia.`);

    const result: SubjectApiResponse = await response.json();
    // Asumiendo que la API devuelve los exámenes anidados bajo 'exams'
    // Si no, necesitarás otra llamada API (ej: /exams) usando los slugs/IDs
    return result.data;

  } catch (error) {
    console.error("Error fetching subject data:", error);
    return null;
  }
}

// --- Componente de Página (Server Component) ---
export default async function SubjectPage({ params }: { params: { universitySlug: string, careerSlug: string, subjectSlug: string } }) {
  const { universitySlug, careerSlug, subjectSlug } = params;
  const subjectData = await getSubjectData(universitySlug, careerSlug, subjectSlug);

  if (!subjectData) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Encabezado */}
      <div className="mb-8 flex items-center gap-x-4">
        <BackButton />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{subjectData.name}</h1>
          {/* Podríamos añadir breadcrumbs o nombres de Uni/Carrera si los pasamos */}
          {/* <p className="text-muted-foreground">Carrera X / Universidad Y</p> */}
        </div>
      </div>

      {/* Descripción de la Materia */}
      {subjectData.description && (
        <Card className="mb-8 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{subjectData.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Sección de Exámenes */}
      <section>
        <h2 className="text-2xl font-semibold mb-5 border-b pb-2">Exámenes Disponibles</h2>
        {subjectData.exams && subjectData.exams.length > 0 ? (
          <div className="space-y-4"> {/* Cambiado a space-y para una lista vertical */}
            {subjectData.exams.map((exam) => (
              <Link
                key={exam.id}
                // Enlace a la futura página del examen
                href={`/${universitySlug}/${careerSlug}/${subjectSlug}/${exam.slug}`} // Estructura de URL para examen
                passHref
                className="block hover:bg-muted/50 transition-colors duration-150 rounded-lg" // Efecto hover sutil
              >
                <Card>
                  <CardHeader>
                    {/* Asumiendo que 'name' es el título o descripción principal del examen */}
                    <CardTitle className="text-lg">{exam.name || `Examen ID: ${exam.id}`}</CardTitle>
                    {/* Mostrar info extra como Badges */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {exam.type && <Badge variant="secondary">{exam.type}</Badge>}
                      {exam.year && <Badge variant="outline">Año: {exam.year}</Badge>}
                      {exam.professor && <Badge variant="outline">Prof: {exam.professor}</Badge>}
                    </div>
                  </CardHeader>
                  {/* <CardContent>...</CardContent> */}
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

// --- Generar Metadata Dinámica ---
export async function generateMetadata({ params }: { params: { universitySlug: string, careerSlug: string, subjectSlug: string } }) {
  const { universitySlug, careerSlug, subjectSlug } = params;
  const subjectData = await getSubjectData(universitySlug, careerSlug, subjectSlug);

  if (!subjectData) {
    return { title: 'Materia no encontrada' };
  }
  return {
    title: `${subjectData.name} | Axiom`,
    description: subjectData.description || `Exámenes de ${subjectData.name}`,
  };
}

