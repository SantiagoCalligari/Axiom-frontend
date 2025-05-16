// FILE: components/exam/ExamDetailClient.tsx
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
} from "lucide-react";
import { CommentSection } from "@/components/exam/CommentSection";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    setIsClient(true);
    const savedLayout = localStorage.getItem("examPageLayout") as LayoutStyle;
    if (savedLayout && (savedLayout === "columns" || savedLayout === "stacked")) {
      setLayoutStyle(savedLayout);
    }
  }, []);

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

  const pdfUrl = examData.download_url;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex-grow pr-4">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-2xl md:text-3xl font-bold mt-1">
            {examData.title || `Examen #${examData.id}`}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
            {examData.professor_name && (
              <span>Prof: {examData.professor_name}</span>
            )}
            {examData.semester && <span>{examData.semester}</span>}
            {examData.year && <span>({examData.year})</span>}
            {examData.exam_date && (
              <span>
                Fecha: {new Date(examData.exam_date).toLocaleDateString("es-ES")}
              </span>
            )}
            {examData.exam_type && (
              <Badge variant="outline" className="ml-1">
                {examData.exam_type}
              </Badge>
            )}
            <Badge
              variant={examData.is_resolved ? "default" : "outline"}
              className={`ml-1 ${examData.is_resolved
                ? "border-green-600 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                : "border-red-600 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
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
        <div className="flex-shrink-0 flex items-center gap-2">
          <Button
            variant={layoutStyle === "columns" ? "secondary" : "outline"}
            size="icon"
            onClick={() => handleLayoutStyleChange("columns")}
            title="Vista en Columnas"
          >
            <Columns className="h-4 w-4" />
          </Button>
          <Button
            variant={layoutStyle === "stacked" ? "secondary" : "outline"}
            size="icon"
            onClick={() => handleLayoutStyleChange("stacked")}
            title="Vista Apilada"
          >
            <LayoutPanelTop className="h-4 w-4" />
          </Button>
          <BackButton />
        </div>
      </div>

      <Separator className="my-6" />

      <div
        className={cn(
          "gap-8",
          layoutStyle === "columns"
            ? "grid grid-cols-1 lg:grid-cols-3"
            : "flex flex-col space-y-8",
        )}
      >
        <div
          className={cn(
            layoutStyle === "columns" ? "lg:col-span-2" : "w-full",
          )}
        >
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Vista Previa del Examen</CardTitle>
            </CardHeader>
            <CardContent>
              {!isClient ? (
                <div className="w-full h-[75vh] flex items-center justify-center border rounded-md bg-muted">
                  <RotateCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pdfUrl ? (
                <iframe
                  key={pdfUrl}
                  src={pdfUrl}
                  className="w-full h-[75vh] border rounded-md"
                  title={`Vista previa de ${examData.title || "examen"}`}
                >
                  <p className="p-4 text-center">
                    Tu navegador no soporta la vista previa integrada de PDF.
                    Puedes{" "}
                    <a
                      href={pdfUrl}
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
                <p className="text-center text-muted-foreground py-10">
                  No se pudo cargar la vista previa del PDF.
                </p>
              )}
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <a
                  href={examData.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" /> Descargar PDF Original
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div
          className={cn(
            layoutStyle === "columns" ? "lg:col-span-1" : "w-full",
          )}
        >
          <Suspense fallback={<div className="h-64 bg-muted rounded-md animate-pulse"></div>}>
            <CommentSection
              universitySlug={universitySlug}
              careerSlug={careerSlug}
              subjectSlug={subjectSlug}
              examId={examData.id.toString()}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

