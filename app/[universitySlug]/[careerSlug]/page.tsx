// app/[universitySlug]/[careerSlug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackButton } from '@/components/ui/BackButton';

// --- Interfaces para los datos de la API ---
interface Subject {
  id: number;
  // university_id: number; // Probablemente no venga en este nivel
  // career_id: number; // Probablemente no venga en este nivel
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface CareerDetail {
  id: number;
  university_id: number; // Viene en la carrera
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  subjects: Subject[]; // Asumiendo que la API anida las materias
}

interface CareerApiResponse {
  data: CareerDetail;
}

// --- Función para obtener los datos de la carrera ---
async function getCareerData(universitySlug: string, careerSlug: string): Promise<CareerDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.error("URL de la API no configurada.");
    return null;
  }

  // Usar la estructura de ruta de la API correcta
  const careerEndpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}`;

  try {
    const response = await fetch(careerEndpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 } // Revalidar cada hora
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}: No se pudo obtener la carrera.`);

    const result: CareerApiResponse = await response.json();
    // Asumiendo que la API devuelve las materias anidadas bajo 'subjects'
    // Si no es así, necesitarás otra llamada API para obtener las materias
    return result.data;

  } catch (error) {
    console.error("Error fetching career data:", error);
    return null;
  }
}

// --- Componente de Página (Server Component) ---
export default async function CareerPage({ params }: { params: { universitySlug: string, careerSlug: string } }) {
  const { universitySlug, careerSlug } = params; // Desestructurar para claridad
  const careerData = await getCareerData(universitySlug, careerSlug);

  if (!careerData) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Encabezado con Botón Volver y Título */}
      <div className="mb-8 flex items-center gap-x-4">
        <BackButton />
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{careerData.name}</h1>
          {/* Podríamos añadir el nombre de la universidad si lo necesitáramos y lo pasáramos o lo obtuviéramos */}
          {/* <p className="text-muted-foreground">Universidad...</p> */}
        </div>
      </div>

      {/* Descripción de la Carrera */}
      {careerData.description && (
        <Card className="mb-8 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{careerData.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Sección de Materias */}
      <section>
        <h2 className="text-2xl font-semibold mb-5 border-b pb-2">Materias</h2>
        {careerData.subjects && careerData.subjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {careerData.subjects.map((subject) => (
              <Link
                key={subject.id}
                // Enlace a la futura página de la materia
                href={`/${universitySlug}/${careerSlug}/${subject.slug}`} // Nueva estructura de URL
                passHref
                className="block hover:shadow-md transition-shadow duration-200 rounded-lg"
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    {subject.description && <CardDescription>{subject.description}</CardDescription>}
                  </CardHeader>
                  {/* <CardContent>...</CardContent> */}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No se encontraron materias para esta carrera.</p>
        )}
      </section>
    </div>
  );
}

// --- Generar Metadata Dinámica ---
export async function generateMetadata({ params }: { params: { universitySlug: string, careerSlug: string } }) {
  const { universitySlug, careerSlug } = params;
  const careerData = await getCareerData(universitySlug, careerSlug);

  if (!careerData) {
    return { title: 'Carrera no encontrada' };
  }
  return {
    // Podríamos añadir el nombre de la universidad al título si tuviéramos esa info aquí
    title: `${careerData.name} | Axiom`,
    description: careerData.description || `Materias de la carrera ${careerData.name}`,
  };
}

