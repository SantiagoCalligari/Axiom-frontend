// app/[universitySlug]/[careerSlug]/[subjectSlug]/page.tsx
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackButton } from '@/components/ui/BackButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ExamList } from '@/components/lists/ExamList'; // Importar ExamList

interface UniversityInfo { name: string; slug: string; }
interface CareerInfo { name: string; slug: string; }
interface SubjectDetail {
  id: number; name: string; slug: string; description: string | null;
}
interface SubjectApiResponse { data: SubjectDetail; }
interface CareerApiResponseSimple { data: CareerInfo; }

async function getSubjectData(universitySlug: string, careerSlug: string, subjectSlug: string): Promise<SubjectDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  const subjectEndpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}`;
  try {
    const response = await fetch(subjectEndpoint, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}: No se pudo obtener la materia.`);
    const result: SubjectApiResponse = await response.json();
    return result.data;
  } catch (error) { console.error("Error fetching subject data:", error); return null; }
}

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

async function getUniversityInfo(slug: string): Promise<UniversityInfo | null> {
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


export default async function SubjectPage({ params }: { params: Promise<{ universitySlug: string, careerSlug: string, subjectSlug: string }> }) {
  const { universitySlug, careerSlug, subjectSlug } = await params;
  const [subjectData, careerInfo, universityInfo] = await Promise.all([
    getSubjectData(universitySlug, careerSlug, subjectSlug),
    getCareerInfo(universitySlug, careerSlug),
    getUniversityInfo(universitySlug)
  ]);

  if (!subjectData || !careerInfo || !universityInfo) {
    notFound();
  }

  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: universityInfo.name, href: `/${universitySlug}` },
    { label: careerInfo.name, href: `/${universitySlug}/${careerSlug}` },
    { label: subjectData.name, href: `/${universitySlug}/${careerSlug}/${subjectSlug}` },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Encabezado */}
      <div className="mb-6 flex items-start justify-between">
        <div className='flex-grow pr-4'>
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{subjectData.name}</h1>
        </div>
        <div className="flex-shrink-0">
          <BackButton />
        </div>
      </div>

      {/* Descripción */}
      {subjectData.description && (
        <Card className="mb-8 bg-muted/30 border">
          <CardHeader><CardTitle className="text-lg">Descripción</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">{subjectData.description}</p></CardContent>
        </Card>
      )}

      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Exámenes Disponibles</h2>
        <ExamList
          universitySlug={universitySlug}
          careerSlug={careerSlug}
          subjectSlug={subjectSlug}
        />
      </section>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ universitySlug: string, careerSlug: string, subjectSlug: string }> }) {
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

