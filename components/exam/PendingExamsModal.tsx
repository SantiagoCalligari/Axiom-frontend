// components/exam/PendingExamsModal.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, User2 } from "lucide-react";

interface PendingExam {
  id: number;
  title: string;
  year: number | null;
  exam_type: string | null;
  exam_date: string | null;
  is_resolved: boolean;
  subject: {
    id: number;
    name: string;
    career: {
      id: number;
      name: string;
      university: {
        id: number;
        name: string;
      };
    };
  };
  uploader?: { name: string };
  created_at: string;
}

interface PendingExamsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PendingExamsResponse {
  data: PendingExam[];
  next_page_url: string | null;
  total: number;
}

function getExamTypeColor(type: string | null) {
  if (!type) return "bg-muted text-muted-foreground";
  const t = type.toLowerCase();
  if (t.includes("final")) return "bg-blue-50 text-blue-700 border border-blue-200";
  if (t.includes("parcial")) return "bg-gray-50 text-gray-700 border border-gray-200";
  if (t.includes("recup")) return "bg-yellow-50 text-yellow-700 border border-yellow-200";
  return "bg-muted text-muted-foreground";
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PendingExamsModal({ open, onOpenChange }: PendingExamsModalProps) {
  const { user, token } = useAuth();

  // Filtros
  const [universityId, setUniversityId] = useState<number | null>(null);
  const [careerId, setCareerId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);

  // Data
  const [exams, setExams] = useState<PendingExam[]>([]);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Helpers para filtros rápidos
  const universities = user?.admin_universities || [];
  const careers = user?.admin_careers || [];
  const subjects = user?.admin_subjects || [];

  // Para saber si hay más de una universidad/carrera/materia en la lista
  const showUniversity = useMemo(() => {
    const set = new Set(exams.map(e => e.subject.career.university.name));
    return set.size > 1;
  }, [exams]);
  const showCareer = useMemo(() => {
    const set = new Set(exams.map(e => e.subject.career.name));
    return set.size > 1;
  }, [exams]);
  const showSubject = useMemo(() => {
    const set = new Set(exams.map(e => e.subject.name));
    return set.size > 1;
  }, [exams]);

  // Fetch exams
  const fetchExams = async (url?: string, append = false) => {
    if (!token) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      let endpoint =
        url ||
        `${apiUrl}/api/admin/exams/pending?${[
          universityId ? `university_id=${universityId}` : "",
          careerId ? `career_id=${careerId}` : "",
          subjectId ? `subject_id=${subjectId}` : "",
        ]
          .filter(Boolean)
          .join("&")}`;

      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error("Error al cargar exámenes.");
      const data: PendingExamsResponse = await res.json();
      setExams((prev) => (append ? [...prev, ...data.data] : data.data));
      setNextPageUrl(data.next_page_url);
    } catch (err) {
      setExams([]);
      setNextPageUrl(null);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Cargar exámenes al abrir o cambiar filtros
  useEffect(() => {
    if (!open) return;
    setInitialLoading(true);
    fetchExams(undefined, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, universityId, careerId, subjectId]);

  // Limpiar filtros al cerrar
  useEffect(() => {
    if (!open) {
      setUniversityId(null);
      setCareerId(null);
      setSubjectId(null);
      setExams([]);
      setNextPageUrl(null);
    }
  }, [open]);

  // Render filtros rápidos (siempre visibles)
  function FilterButtons() {
    const filterActive = universityId || careerId || subjectId;
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          size="sm"
          variant={filterActive ? "secondary" : "default"}
          className={filterActive ? "" : "shadow"}
          onClick={() => {
            setUniversityId(null);
            setCareerId(null);
            setSubjectId(null);
          }}
        >
          Todos
        </Button>
        {universities.map((u) => (
          <Button
            key={u.id}
            size="sm"
            variant={universityId === u.id ? "default" : "secondary"}
            onClick={() => {
              setUniversityId(u.id);
              setCareerId(null);
              setSubjectId(null);
            }}
          >
            {u.name}
          </Button>
        ))}
        {careers.map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={careerId === c.id ? "default" : "secondary"}
            onClick={() => {
              setUniversityId(null);
              setCareerId(c.id);
              setSubjectId(null);
            }}
          >
            {c.name}
          </Button>
        ))}
        {subjects.map((s) => (
          <Button
            key={s.id}
            size="sm"
            variant={subjectId === s.id ? "default" : "secondary"}
            onClick={() => {
              setUniversityId(null);
              setCareerId(null);
              setSubjectId(s.id);
            }}
          >
            {s.name}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exámenes pendientes</DialogTitle>
        </DialogHeader>
        <FilterButtons />
        {initialLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No hay exámenes pendientes para mostrar.
          </div>
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white dark:bg-muted border border-muted-foreground/10 rounded-xl shadow-sm hover:shadow transition-shadow p-4 flex flex-col gap-2"
              >
                {/* QUIÉN LO PIDE */}
                {exam.uploader && (
                  <div className="flex items-center gap-2 mb-1">
                    <User2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Solicitado por <span className="font-medium">{exam.uploader.name}</span>
                    </span>
                  </div>
                )}

                {/* Badges esenciales */}
                <div className="flex flex-wrap gap-2 items-center mb-1">
                  {showUniversity && (
                    <Badge variant="secondary" className="text-xs font-normal px-2 py-1">
                      {exam.subject.career.university.name}
                    </Badge>
                  )}
                  {showCareer && (
                    <Badge variant="secondary" className="text-xs font-normal px-2 py-1">
                      {exam.subject.career.name}
                    </Badge>
                  )}
                  {showSubject && (
                    <Badge variant="secondary" className="text-xs font-normal px-2 py-1">
                      {exam.subject.name}
                    </Badge>
                  )}
                  {exam.exam_type && (
                    <Badge className={getExamTypeColor(exam.exam_type) + " text-xs font-normal px-2 py-1"}>
                      {exam.exam_type}
                    </Badge>
                  )}
                  {exam.year && (
                    <Badge variant="outline" className="text-xs font-normal px-2 py-1">
                      {exam.year}
                    </Badge>
                  )}
                </div>

                {/* Título y fecha */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="font-semibold text-base text-primary">{exam.title}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="w-3 h-3" />
                    Solicitado el {formatDate(exam.created_at)}
                  </div>
                </div>

                {/* Botón revisar */}
                <div className="pt-2">
                  <Link
                    href={`/admin/exams/${exam.id}`}
                    className="block w-full text-center bg-gray-900 text-white font-medium py-2 rounded-md hover:bg-gray-800 transition"
                  >
                    Revisar
                  </Link>
                </div>
              </div>
            ))}
            {nextPageUrl && (
              <div className="flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => fetchExams(nextPageUrl, true)}
                  disabled={loading}
                >
                  {loading ? "Cargando..." : "Cargar más"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
