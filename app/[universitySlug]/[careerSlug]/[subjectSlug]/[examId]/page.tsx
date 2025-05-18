// FILE: app/[universitySlug]/[careerSlug]/[subjectSlug]/[examId]/page.tsx
// This is now a Server Component

import { notFound } from "next/navigation";
import { ExamDetailClient } from "@/components/exam/ExamDetailClient"; // Import the new Client Component
import { Metadata } from "next"; // For generateMetadata

// --- Interfaces for data fetching ---
interface UniversityInfo {
  name: string;
  slug: string;
}
interface CareerInfo {
  name: string;
  slug: string;
}
interface SubjectInfo {
  name: string;
  slug: string;
}
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
  file_path: string;
}

interface PageParams {
  universitySlug: string;
  careerSlug: string;
  subjectSlug: string;
  examId: string;
}

// --- Data Fetching Functions (Server-Side) ---
async function getExamData(
  universitySlug: string,
  careerSlug: string,
  subjectSlug: string,
  examId: string,
): Promise<ExamDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL; // Use NEXT_PUBLIC_API_URL or a server-only env var
  if (!apiUrl) {
    console.error("API URL not configured.");
    return null;
  }
  const examEndpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examId}`;
  try {
    const response = await fetch(examEndpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (response.status === 404) return null;
    if (!response.ok)
      throw new Error(`Error ${response.status}: Could not fetch exam.`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching exam data:", error);
    return null;
  }
}

async function getSubjectInfo(
  universitySlug: string,
  careerSlug: string,
  subjectSlug: string,
): Promise<SubjectInfo | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}`;
  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching subject info:", error);
    return null;
  }
}

async function getCareerInfo(
  universitySlug: string,
  careerSlug: string,
): Promise<CareerInfo | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}`;
  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching career info:", error);
    return null;
  }
}

async function getUniversityInfo(
  slug: string,
): Promise<UniversityInfo | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  const endpoint = `${apiUrl}/api/university/${slug}`;
  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching university info:", error);
    return null;
  }
}

// --- Page Component (Server Component) ---
export default async function ExamPageServer({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { universitySlug, careerSlug, subjectSlug, examId } = await params;

  const [examData, subjectInfo, careerInfo, universityInfo] =
    await Promise.all([
      getExamData(universitySlug, careerSlug, subjectSlug, examId),
      getSubjectInfo(universitySlug, careerSlug, subjectSlug),
      getCareerInfo(universitySlug, careerSlug),
      getUniversityInfo(universitySlug),
    ]);

  if (!examData || !subjectInfo || !careerInfo || !universityInfo) {
    notFound();
  }

  return (
    <ExamDetailClient
      examData={examData}
      subjectInfo={subjectInfo}
      careerInfo={careerInfo}
      universityInfo={universityInfo}
      universitySlug={universitySlug}
      careerSlug={careerSlug}
      subjectSlug={subjectSlug}
    />
  );
}

// --- Generate Metadata (Stays in the Server Component) ---
export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { universitySlug, careerSlug, subjectSlug, examId } = await params;
  const examData = await getExamData(
    universitySlug,
    careerSlug,
    subjectSlug,
    examId,
  );

  if (!examData) {
    return { title: "Examen no encontrado" };
  }
  return {
    title: `${examData.title || `Examen #${examData.id}`} | Axiom`,
    description: `Detalles y discusión del examen ${examData.title || ""}`,
  };
}
