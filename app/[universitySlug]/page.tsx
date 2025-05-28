// app/[universitySlug]/page.tsx

import { notFound } from 'next/navigation';
import ClientUniversityPage from './ClientUniversityPage';

// --- Interfaces ---
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

  // --- Estado para carreras (en el client) ---
  // Usamos un Client Component wrapper para manejar el estado de carreras
  return (
    <ClientUniversityPage
      universityData={universityData}
      breadcrumbItems={breadcrumbItems}
    />
  );
}
