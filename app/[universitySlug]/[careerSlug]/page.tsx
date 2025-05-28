// app/[universitySlug]/[careerSlug]/page.tsx

import { notFound } from 'next/navigation';
import ClientCareerPage from './ClientCareerPage';

// --- Interfaces ---
interface UniversityInfo { name: string; slug: string; }
interface Subject { id: number; name: string; slug: string; description: string | null; }
interface CareerDetail {
  id: number; university_id: number; name: string; slug: string;
  description: string | null; subjects: Subject[];
  administrators: { id: number; name: string; email: string }[];
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
  const { universitySlug, careerSlug } = await params;
  const [careerData, universityInfo] = await Promise.all([
    getCareerData(universitySlug, careerSlug),
    getUniversityInfo(universitySlug)
  ]);

  if (!careerData || !universityInfo) {
    notFound();
  }

  // --- Construir Breadcrumbs (con Inicio) ---
  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: universityInfo.name, href: `/${universitySlug}` },
    { label: careerData.name, href: `/${universitySlug}/${careerSlug}` },
  ];

  return (
    <ClientCareerPage
      careerData={careerData}
      universityInfo={universityInfo}
      breadcrumbItems={breadcrumbItems}
    />
  );
}

// --- Generar Metadata ---
export async function generateMetadata({ params }: { params: Promise<{ universitySlug: string, careerSlug: string }> }) {
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
