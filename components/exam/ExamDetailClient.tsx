"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/BackButton";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Check,
  Download,
  X,
  RotateCw,
  Columns,
  LayoutPanelTop,
  FileText,
  FileDown,
  BookOpen,
} from "lucide-react";
import { CommentSection } from "@/components/comments/CommentSection";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKaTeX from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import "katex/dist/katex.min.css";

// --- Interfaces (Props received from Server Component) ---
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
  user_id: number;
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
  ocr_text?: string | null;
  resolution_markdown?: string | null;
  resolution_download_url?: string | null;
}

interface ExamDetailClientProps {
  examData: ExamDetail;
  subjectInfo: SubjectInfo;
  careerInfo: CareerInfo;
  universityInfo: UniversityInfo;
  universitySlug: string;
  careerSlug: string;
  subjectSlug: string;
}

type LayoutStyle = "columns" | "stacked";
type TabType = "pdf" | "ocr" | "resolution";

function getExamTypeLabel(type: string | null) {
  if (!type) return "";
  switch (type.toLowerCase()) {
    case "midterm":
      return "Parcial";
    case "retake":
      return "Recuperatorio";
    case "final":
      return "Final";
    default:
      return type;
  }
}

// --- Simple in-memory cache for resolution PDFs ---
const resolutionPdfCache: Record<string, string> = {};

export function ExamDetailClient({
  examData,
  subjectInfo,
  careerInfo,
  universityInfo,
  universitySlug,
  careerSlug,
  subjectSlug,
}: ExamDetailClientProps) {
  const [isClient, setIsClient] = useState(false);
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>("columns");
  const [tab, setTab] = useState<TabType>(
    examData.ocr_text ? "ocr" : "pdf"
  );

  // --- Resolution PDF state ---
  const [resolutionPdfUrl, setResolutionPdfUrl] = useState<string | null>(null);
  const [isLoadingResolution, setIsLoadingResolution] = useState(false);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    const savedLayout = localStorage.getItem("examPageLayout") as LayoutStyle;
    if (savedLayout && (savedLayout === "columns" || savedLayout === "stacked")) {
      setLayoutStyle(savedLayout);
    }
  }, []);

  // --- Fetch resolution PDF when tab is selected ---
  useEffect(() => {
    if (tab === "resolution" && examData.is_resolved) {
      const cacheKey = String(examData.id);
      if (resolutionPdfCache[cacheKey]) {
        setResolutionPdfUrl(resolutionPdfCache[cacheKey]);
        setIsLoadingResolution(false);
        setResolutionError(null);
        return;
      }
      setIsLoadingResolution(true);
      setResolutionError(null);

      // Use baseUrl from env
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const apiUrl = `${baseUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exam/${examData.id}/resolution`;

      fetch(apiUrl)
        .then(async (res) => {
          if (!res.ok) throw new Error("No se pudo obtener la resolución.");
          const data = await res.json();
          const url = data?.data?.download_url;
          if (!url) throw new Error("No se encontró el PDF de resolución.");
          resolutionPdfCache[cacheKey] = url;
          setResolutionPdfUrl(url);
        })
        .catch((err) => {
          setResolutionError(
            err?.message || "Error al cargar la resolución."
          );
        })
        .finally(() => setIsLoadingResolution(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, examData.id, examData.is_resolved, universitySlug, careerSlug, subjectSlug]);

  const handleLayoutStyleChange = (style: LayoutStyle) => {
    setLayoutStyle(style);
    localStorage.setItem("examPageLayout", style);
  };

  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: universityInfo.name, href: `/${universitySlug}` },
    { label: careerInfo.name, href: `/${universitySlug}/${careerSlug}` },
    {
      label: subjectInfo.name,
      href: `/${universitySlug}/${careerSlug}/${subjectSlug}`,
    },
    {
      label: examData.title || `Examen #${examData.id}`,
      href: `/${universitySlug}/${careerSlug}/${subjectSlug}/${examData.id}`,
    },
  ];

  // --- Descarga OCR como archivo .md ---
  const handleDownloadOCR = () => {
    if (!examData.ocr_text) return;
    const blob = new Blob([examData.ocr_text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${examData.title || "ocr-examen"}.md`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // --- Descarga resolución (si existe) ---
  const handleDownloadResolution = () => {
    if (!resolutionPdfUrl) return;
    window.open(resolutionPdfUrl, "_blank");
  };

  return (
    <div className="container mx-auto max-w-7xl px-1 sm:px-2 py-4 sm:py-8">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-grow pr-0 sm:pr-4 min-w-0 w-full">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mt-1 break-words">
            {examData.title || `Examen #${examData.id}`}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground mt-1">
            {examData.professor_name && (
              <span className="truncate max-w-[150px] sm:max-w-none">Prof: {examData.professor_name}</span>
            )}
            {examData.semester && <span>{examData.semester}</span>}
            {examData.year && <span>({examData.year})</span>}
            {examData.exam_date && (
              <span>
                Fecha: {new Date(examData.exam_date).toLocaleDateString("es-ES")}
              </span>
            )}
            {examData.exam_type && (
              <Badge variant="outline" className="ml-0 sm:ml-1 text-xs">
                {getExamTypeLabel(examData.exam_type)}
              </Badge>
            )}
            <Badge
              variant={examData.is_resolved ? "default" : "outline"}
              className={`ml-0 sm:ml-1 text-xs ${examData.is_resolved
                ? "border-green-600 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                : "border-red-600 bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-300"
                }`}
            >
              {examData.is_resolved ? (
                <Check className="h-3 w-3 mr-1" />
              ) : (
                <X className="h-3 w-3 mr-1" />
              )}
              {examData.is_resolved ? "Resuelto" : "No Resuelto"}
            </Badge>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant={layoutStyle === "columns" ? "secondary" : "outline"}
            size="icon"
            onClick={() => handleLayoutStyleChange("columns")}
            title="Vista en Columnas"
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <Columns className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant={layoutStyle === "stacked" ? "secondary" : "outline"}
            size="icon"
            onClick={() => handleLayoutStyleChange("stacked")}
            title="Vista Apilada"
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <LayoutPanelTop className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <BackButton />
        </div>
      </div>

      <Separator className="my-4 sm:my-6" />

      <div
        className={cn(
          "gap-4 sm:gap-8",
          layoutStyle === "columns"
            ? "grid grid-cols-1 lg:grid-cols-3"
            : "flex flex-col space-y-4 sm:space-y-8",
        )}
      >
        <div
          className={cn(
            layoutStyle === "columns" ? "lg:col-span-2" : "w-full",
            "w-full"
          )}
        >
          <Card className="overflow-hidden">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                {examData.ocr_text ? "Vista OCR / PDF" : "Vista Previa del Examen"}
              </CardTitle>
              {/* Tabs */}
              <div className="flex gap-2 mt-2">
                {examData.ocr_text && (
                  <Button
                    variant={tab === "ocr" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setTab("ocr")}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    OCR
                  </Button>
                )}
                <Button
                  variant={tab === "pdf" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setTab("pdf")}
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                {examData.is_resolved && (
                  <Button
                    variant={tab === "resolution" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setTab("resolution")}
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    Resolución
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              {/* --- OCR TAB --- */}
              {tab === "ocr" && examData.ocr_text && (
                <div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-wrap break-words border rounded-md p-4 bg-muted">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeSanitize, rehypeKaTeX]}
                    >
                      {examData.ocr_text}
                    </ReactMarkdown>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadOCR}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar OCR (.md)
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                    >
                      <a
                        href={examData.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PDF Original
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* --- PDF TAB --- */}
              {tab === "pdf" && (
                <div>
                  {!isClient ? (
                    <div className="w-full h-[50vh] sm:h-[75vh] flex items-center justify-center border rounded-md bg-muted">
                      <RotateCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : examData.download_url ? (
                    <iframe
                      key={examData.download_url}
                      src={examData.download_url}
                      className="w-full h-[50vh] sm:h-[75vh] border rounded-md"
                      title={`Vista previa de ${examData.title || "examen"}`}
                    >
                      <p className="p-4 text-center">
                        Tu navegador no soporta la vista previa integrada de PDF.
                        Puedes{" "}
                        <a
                          href={examData.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-primary"
                        >
                          descargar el archivo aquí
                        </a>{" "}
                        para verlo.
                      </p>
                    </iframe>
                  ) : (
                    <p className="text-center text-muted-foreground py-6 sm:py-10">
                      No se pudo cargar la vista previa del PDF.
                    </p>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-3 sm:mt-4 w-full text-xs sm:text-sm"
                  >
                    <a
                      href={examData.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Descargar PDF Original
                    </a>
                  </Button>
                </div>
              )}

              {/* --- RESOLUCIÓN TAB --- */}
              {tab === "resolution" && examData.is_resolved && (
                <div>
                  {isLoadingResolution ? (
                    <div className="w-full h-[50vh] sm:h-[75vh] flex items-center justify-center border rounded-md bg-muted">
                      <RotateCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : resolutionError ? (
                    <p className="text-center text-destructive py-6 sm:py-10">
                      {resolutionError}
                    </p>
                  ) : resolutionPdfUrl ? (
                    <>
                      <iframe
                        key={resolutionPdfUrl}
                        src={resolutionPdfUrl}
                        className="w-full h-[50vh] sm:h-[75vh] border rounded-md"
                        title={`Resolución de ${examData.title || "examen"}`}
                      >
                        <p className="p-4 text-center">
                          Tu navegador no soporta la vista previa integrada de PDF.
                          Puedes{" "}
                          <a
                            href={resolutionPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-primary"
                          >
                            descargar el archivo aquí
                          </a>{" "}
                          para verlo.
                        </p>
                      </iframe>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 sm:mt-4 w-full text-xs sm:text-sm"
                        onClick={handleDownloadResolution}
                      >
                        <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Descargar Resolución (PDF)
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground py-6 sm:py-10">
                      No hay resolución cargada para este examen.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div
          className={cn(
            layoutStyle === "columns" ? "lg:col-span-1" : "w-full",
            "w-full"
          )}
        >
          <Suspense fallback={<div className="h-48 sm:h-64 bg-muted rounded-md animate-pulse"></div>}>
            <CommentSection
              universitySlug={universitySlug}
              careerSlug={careerSlug}
              subjectSlug={subjectSlug}
              examId={examData.id.toString()}
              isResolutionComments={tab === "resolution"}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
