// app/[universitySlug]/[careerSlug]/[subjectSlug]/[examId]/page.tsx
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from '@/components/ui/BackButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Separator } from '@/components/ui/separator';
// Ya no necesitamos Textarea, Button, MessageCircle, Send, User directamente aquí
// import { Textarea } from '@/components/ui/textarea';
// import { Button } from '@/components/ui/button';
// import { MessageCircle, Send, User } from 'lucide-react';

import { Check, Download, X } from 'lucide-react'; // Mantener iconos si se usan para Badge/Botón Descarga
import { CommentSection } from '@/components/exam/CommentSection'; // Importar CommentSection

// --- Interfaces ---
interface UniversityInfo { name: string; slug: string; }
interface CareerInfo { name: string; slug: string; }
interface SubjectInfo { name: string; slug: string; }
interface ExamDetail {
  id: number;
  title: string;
  professor_name: string | null;
  semester: string | null;
  year: number | null;
  is_resolved: boolean;
  exam_type: string | null;
  exam_date: string | null;
  download_url: string;
  description?: string | null;
  uploader?: { name: string };
  created_at: string;
  file_path: string; // Necesario si construyes la URL del visor
}
interface ExamApiResponse { data: ExamDetail; }
interface CareerApiResponseSimple { data: CareerInfo; }
interface UniversityApiResponseSimple { data: UniversityInfo; }
interface SubjectApiResponseSimple { data: SubjectInfo; }


// --- Funciones para obtener datos ---
async function getExamData(universitySlug: string, careerSlug: string, subjectSlug: string, examId: string): Promise<ExamDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) { console.error("API URL not configured."); return null; }
  const examEndpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}`;
  try {
    const response = await fetch(examEndpoint, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}: Could not fetch exam.`);
    const result: ExamApiResponse = await response.json();
    return result.data;
  } catch (error) { console.error("Error fetching exam data:", error); return null; }
}

async function getCareerInfo(universitySlug: string, careerSlug: string): Promise<CareerInfo | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL; if (!apiUrl) return null;
  const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}`;
  try {
    const response = await fetch(endpoint, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
    if (response.status === 404) return null; if (!response.ok) throw new Error(`Error ${response.status}`);
    const result: CareerApiResponseSimple = await response.json(); return result.data;
  } catch (error) { console.error("Error fetching career info:", error); return null; }
}
async function getUniversityInfo(slug: string): Promise<UniversityInfo | null> {
   const apiUrl = process.env.NEXT_PUBLIC_API_URL; if (!apiUrl) return null;
   const endpoint = `${apiUrl}/api/university/${slug}`;
   try {
     const response = await fetch(endpoint, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
     if (response.status === 404) return null; if (!response.ok) throw new Error(`Error ${response.status}`);
     const result: { data: UniversityInfo } = await response.json(); return result.data;
   } catch (error) { console.error("Error fetching university info:", error); return null; }
}
async function getSubjectInfo(universitySlug: string, careerSlug: string, subjectSlug: string): Promise<SubjectInfo | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL; if (!apiUrl) return null;
  const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}`;
  try {
    const response = await fetch(endpoint, { headers: { Accept: "application/json" }, next: { revalidate: 3600 } });
    if (response.status === 404) return null; if (!response.ok) throw new Error(`Error ${response.status}`);
    const result: SubjectApiResponseSimple = await response.json(); return result.data;
  } catch (error) { console.error("Error fetching subject info:", error); return null; }
}


// --- Componente de Página ---
export default async function ExamPage({ params }: { params: { universitySlug: string, careerSlug: string, subjectSlug: string, examId: string } }) {
  const { universitySlug, careerSlug, subjectSlug, examId } = await params;
  const [examData, subjectInfo, careerInfo, universityInfo] = await Promise.all([
    getExamData(universitySlug, careerSlug, subjectSlug, examId),
    getSubjectInfo(universitySlug, careerSlug, subjectSlug),
    getCareerInfo(universitySlug, careerSlug),
    getUniversityInfo(universitySlug)
  ]);

  if (!examData || !subjectInfo || !careerInfo || !universityInfo) {
    notFound();
  }

  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: universityInfo.name, href: `/${universitySlug}` },
    { label: careerInfo.name, href: `/${universitySlug}/${careerSlug}` },
    { label: subjectInfo.name, href: `/${universitySlug}/${careerSlug}/${subjectSlug}` },
    { label: examData.title || `Examen #${examData.id}`, href: `/${universitySlug}/${careerSlug}/${subjectSlug}/${examData.id}` },
  ];

  const pdfUrl = examData.download_url;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Encabezado */}
       <div className="mb-6 flex items-start justify-between">
         <div className='flex-grow pr-4'>
            <Breadcrumbs items={breadcrumbItems} />
            <h1 className="text-2xl md:text-3xl font-bold mt-1">{examData.title || `Examen #${examData.id}`}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                {examData.professor_name && <span>Prof: {examData.professor_name}</span>}
                {examData.semester && <span>{examData.semester}</span>}
                {examData.year && <span>({examData.year})</span>}
                {examData.exam_date && <span>Fecha: {new Date(examData.exam_date).toLocaleDateString('es-ES')}</span>}
                {examData.exam_type && <Badge variant="outline" className="ml-1">{examData.exam_type}</Badge>}
                <Badge variant={examData.is_resolved ? "default" : "outline"} className={`ml-1 ${examData.is_resolved ? "border-green-600 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" : "border-red-600 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"}`}>
                    {examData.is_resolved ? <Check className="h-3 w-3 mr-1"/> : <X className="h-3 w-3 mr-1"/>}
                    {examData.is_resolved ? 'Resuelto' : 'No Resuelto'}
                </Badge>
            </div>
         </div>
          <div className="flex-shrink-0">
            <BackButton />
          </div>
      </div>

      <Separator className="my-6" />

      {/* Contenido Principal (2 columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Columna Izquierda: Visor PDF */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader><CardTitle>Vista Previa del Examen</CardTitle></CardHeader>
            <CardContent>
              {pdfUrl ? (
                // Iframe para mostrar el PDF
                <iframe
                  src={pdfUrl}
                  className="w-full h-[75vh] border rounded-md" // 75% de la altura de la ventana
                  title={`Vista previa de ${examData.title || 'examen'}`}
                  // sandbox="allow-scripts allow-same-origin allow-popups allow-modals allow-forms" // Ajusta sandbox según seguridad
                  // Esto deshabilitaría la descarga nativa del iframe en muchos navegadores
                  // Si solo quieres forzar la descarga con tu botón, investiga opciones de sandbox o headers.
                >
                  {/* Fallback content for browsers that don't support iframes */}
                  Tu navegador no soporta la vista previa integrada de PDF. Puedes <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="underline">descargar el archivo aquí</a> para verlo.
                </iframe>
              ) : (
                <p className="text-center text-muted-foreground py-10">No se pudo cargar la vista previa del PDF.</p>
              )}
               {/* Botón de descarga manual */}
               <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                  <a href={examData.download_url} target="_blank" rel="noopener noreferrer">
                     <Download className="mr-2 h-4 w-4" /> Descargar PDF Original
                  </a>
               </Button>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Sección de Comentarios (Usar el componente) */}
        <div className="lg:col-span-1">
           {/* Renderizar el componente de la sección de comentarios */}
           <CommentSection
               universitySlug={universitySlug}
               careerSlug={careerSlug}
               subjectSlug={subjectSlug}
               examId={examData.id.toString()} // Asegúrate de pasar el ID como string
           />
        </div>

      </div> {/* Fin del grid de 2 columnas */}
    </div> // Fin del contenedor principal
  ); // Fin del return del componente
} // Fin del componente de página


// --- Generar Metadata Dinámica ---
export async function generateMetadata({ params }: { params: { universitySlug: string, careerSlug: string, subjectSlug: string, examId: string } }) {
  const { universitySlug, careerSlug, subjectSlug, examId } = await params;
  const examData = await getExamData(universitySlug, careerSlug, subjectSlug, examId);
  // Podríamos obtener careerInfo y universityInfo aquí también para el título

  if (!examData) {
    return { title: 'Examen no encontrado' };
  }
  return {
    title: `${examData.title || `Examen #${examData.id}`} | Axiom`,
    description: `Detalles y discusión del examen ${examData.title || ''}`,
  };
}
