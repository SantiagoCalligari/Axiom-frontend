// app/[universitySlug]/page.tsx
import { notFound } from 'next/navigation';
// Link no se usa directamente aquí ahora
// import Link from 'next/link';
// Button y ArrowLeft no se usan directamente aquí
// import { Button } from '@/components/ui/button';
// import { ArrowLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackButton } from '@/components/ui/BackButton';
import { CareerList } from '@/components/lists/CareerList'; // Importar CareerList

// --- Interfaces para los datos de la API ---
interface Career {
  id: number;
  // university_id no es necesario si no se usa en CareerList
  name: string;
  slug: string;
  // description no es necesario si no se usa en CareerList
  // created_at no es necesario
  // updated_at no es necesario
}

interface UniversityDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  // created_at no es necesario
  // updated_at no es necesario
  careers: Career[];
}

interface ApiResponse {
  data: UniversityDetail;
}

// --- Función para obtener datos de la universidad ---
async function getUniversityData(universitySlug: string): Promise<UniversityDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    console.error("URL de la API no configurada.");
    return null;
  }
  // Usar la ruta API correcta según route:list
  const universityEndpoint = `${apiUrl}/api/university/${universitySlug}`;

  try {
    const response = await fetch(universityEndpoint, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 } // Revalidar cada hora
    });

    if (response.status === 404) {
      return null; // Indicador de no encontrado
    }

    if (!response.ok) {
      // Lanza error para otros fallos de API
      throw new Error(`Error ${response.status}: No se pudo obtener la universidad.`);
    }

    const result: ApiResponse = await response.json();
    return result.data;

  } catch (error) {
    console.error("Error fetching university data:", error);
    return null; // O devolver null para manejarlo en la página
  }
}

// --- Componente de Página (Server Component) ---
// MANTENIENDO la forma de obtener params solicitada
export default async function UniversityPage({ params }: { params: Promise<{ universitySlug: string }> }) {
  const { universitySlug } = await params; // Acceder a params como solicitaste
  const universityData = await getUniversityData(universitySlug);

  // Si no se encontraron datos (404 u otro error manejado como null)
  if (!universityData) {
    notFound(); // Muestra la página 404 de Next.js
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Encabezado con Botón Volver y Título */}
      <div className="mb-8 flex items-center justify-between"> {/* Usar justify-between */}
        <h1 className="text-3xl md:text-4xl font-bold">{universityData.name}</h1>
        <BackButton /> {/* Botón a la derecha */}
      </div>

      {/* Descripción de la Universidad */}
      {universityData.description && (
        <Card className="mb-8 bg-muted/30 border"> {/* Fondo sutil y borde */}
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
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Carreras Ofrecidas</h2> {/* Aumentado mb */}
        {/* Usar el componente CareerList en lugar del mapeo directo */}
        <CareerList
          careers={universityData.careers || []}
          universitySlug={universityData.slug} // Pasar el slug de la universidad actual
        />
      </section>
    </div>
  );
}

// --- Generar Metadata Dinámica ---
// MANTENIENDO la forma de obtener params solicitada
export async function generateMetadata({ params }: { params: Promise<{ universitySlug: string }> }) {
  const { universitySlug } = await params; // Acceder a params como solicitaste
  const universityData = await getUniversityData(universitySlug);
  if (!universityData) {
    return { title: 'Universidad no encontrada' };
  }
  return {
    title: `${universityData.name} | Axiom`,
    description: universityData.description || `Información sobre ${universityData.name}`,
  };
}
