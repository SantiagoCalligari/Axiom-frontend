// app/universidades/[universitySlug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackButton } from '@/components/ui/BackButton'; // Crearemos este componente

// --- Interfaces para los datos de la API ---
interface Career {
  id: number;
  university_id: number;
  name: string;
  universitySlug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface UniversityDetail {
  id: number;
  name: string;
  universitySlug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  careers: Career[];
}

interface ApiResponse {
  data: UniversityDetail;
}

async function getUniversityData(universitySlug: string): Promise<UniversityDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.error("URL de la API no configurada.");
    return null;
  }

  const universityEndpoint = `${apiUrl}/api/university/${universitySlug}`;

  try {
    const response = await fetch(universityEndpoint, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudo obtener la universidad.`);
    }

    const result: ApiResponse = await response.json();
    return result.data;

  } catch (error) {
    console.error("Error fetching university data:", error);
    return null;
  }
}


export default async function UniversityPage({ params }: { params: any }) {
  const { universitySlug } = await params
  const universityData = await getUniversityData(universitySlug);

  // Si no se encontraron datos (404 u otro error manejado como null)
  if (!universityData) {
    notFound(); // Muestra la página 404 de Next.js
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Encabezado con Botón Volver y Título */}
      <div className="mb-8 flex items-center gap-x-4">
        <BackButton /> {/* Usar el componente cliente para router.back() */}
        <h1 className="text-3xl md:text-4xl font-bold">{universityData.name}</h1>
      </div>

      {/* Descripción de la Universidad */}
      {universityData.description && (
        <Card className="mb-8 bg-muted/30"> {/* Fondo sutil */}
          <CardHeader>
            <CardTitle className="text-lg">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{universityData.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Sección de Carreras */}
      <section>
        <h2 className="text-2xl font-semibold mb-5 border-b pb-2">Carreras</h2>
        {universityData.careers && universityData.careers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {universityData.careers.map((career) => (
              <Link
                key={career.id}
                href={`/${universityData.universitySlug}/${career.universitySlug}`}
                passHref
                className="block hover:shadow-md transition-shadow duration-200 rounded-lg" // Efecto hover en el enlace
              >
                <Card className="h-full flex flex-col"> {/* h-full para igualar altura en grid */}
                  <CardHeader>
                    <CardTitle className="text-lg">{career.name}</CardTitle>
                    {/* Podríamos añadir descripción de carrera si existiera */}
                    {/* {career.description && <CardDescription>{career.description}</CardDescription>} */}
                  </CardHeader>
                  {/* Podríamos añadir más contenido si fuera necesario */}
                  {/* <CardContent>...</CardContent> */}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No se encontraron carreras para esta universidad.</p>
        )}
      </section>
    </div>
  );
}

// Opcional: Generar Metadata Dinámica
export async function generateMetadata({ params }: { params: any }) {
  const { universitySlug } = await params
  const universityData = await getUniversityData(universitySlug);
  if (!universityData) {
    return { title: 'Universidad no encontrada' };
  }
  return {
    title: `${universityData.name} | Axiom`,
    description: universityData.description || `Información sobre ${universityData.name}`,
  };
}
