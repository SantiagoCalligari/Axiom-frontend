// app/admin/exams/[examId]/ExamReviewClient.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CalendarDays, User2, FileText, CheckCircle2, XCircle } from "lucide-react";

function isAnyAdmin(roles: string[] | undefined) {
  if (!roles) return false;
  return roles.some((r) =>
    ["admin", "university_admin", "career_admin", "subject_admin"].includes(r)
  );
}

function getExamTypeColor(type: string | null) {
  if (!type) return "bg-muted text-muted-foreground";
  const t = type.toLowerCase();
  if (t.includes("final")) return "bg-blue-50 text-blue-700 border border-blue-200";
  if (t.includes("parcial") || t.includes("midterm")) return "bg-gray-50 text-gray-700 border border-gray-200";
  if (t.includes("recup") || t.includes("retake")) return "bg-yellow-50 text-yellow-700 border border-yellow-200";
  return "bg-muted text-muted-foreground";
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ExamDetail {
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
  uploader?: { name: string } | null;
  created_at: string;
  description?: string | null;
  download_url: string;
  professor_name?: string | null;
  semester?: string | null;
  original_file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
}

export default function ExamReviewClient({ examId }: { examId: string }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Solo admins pueden entrar
  const isAdmin = isAnyAdmin(user?.roles as any);

  useEffect(() => {
    if (!token || !isAdmin) return;
    const fetchExam = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(
          `${apiUrl}/api/admin/exams/${examId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("No se pudo cargar el examen.");
        const data = await res.json();
        setExam(data.data);
      } catch (err) {
        setError("No se pudo cargar el examen.");
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [token, isAdmin, examId]);

  // Redirigir si no es admin
  useEffect(() => {
    if (user && !isAdmin) {
      router.replace("/");
    }
  }, [user, isAdmin, router]);

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        Solo administradores pueden acceder a esta página.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-muted-foreground">Cargando examen...</span>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-red-500">
        {error || "No se encontró el examen."}
      </div>
    );
  }

  // --- Acciones ---
  const handleApprove = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(
        `${apiUrl}/api/admin/exams/${exam.id}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );
      if (!res.ok) throw new Error("No se pudo aprobar el examen.");
      toast.success("Examen aprobado correctamente.");
      router.replace("/"); // O redirigí a donde prefieras
    } catch (err) {
      toast.error("Error al aprobar el examen.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const formData = new FormData();
      formData.append("rejection_reason", rejectionReason.trim());
      const res = await fetch(
        `${apiUrl}/api/admin/exams/${exam.id}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );
      if (!res.ok) throw new Error("No se pudo rechazar el examen.");
      toast.success("Examen rechazado correctamente.");
      setShowRejectModal(false);
      router.replace("/"); // O redirigí a donde prefieras
    } catch (err) {
      toast.error("Error al rechazar el examen.");
    } finally {
      setActionLoading(false);
      setRejectionReason("");
    }
  };

  // --- Preview PDF ---
  const isPDF = exam.mime_type === "application/pdf" || (exam.download_url && exam.download_url.endsWith(".pdf"));

  return (
    <div className="w-full max-w-[1600px] mx-auto my-10 flex flex-col md:flex-row gap-8 px-2 md:px-8">
      {/* PDF Preview */}
      <div className="flex-1 min-w-[350px] max-w-[900px] flex items-center justify-center">
        {isPDF ? (
          <div
            className="bg-black/5 border rounded-2xl shadow-md flex items-center justify-center w-full"
            style={{
              aspectRatio: "210/297", // A4
              maxHeight: "90vh",
              minHeight: 500,
              background: "#f8fafc",
            }}
          >
            <iframe
              src={exam.download_url}
              title="Vista previa del examen"
              width="100%"
              height="100%"
              className="w-full h-full"
              style={{
                border: "none",
                height: "100%",
                minHeight: 500,
                maxHeight: "90vh",
                background: "#fff",
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <a
              href={exam.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary underline text-lg font-medium"
            >
              <FileText className="w-5 h-5" />
              Descargar archivo
            </a>
          </div>
        )}
      </div>

      {/* Info y acciones */}
      <div className="flex-1 max-w-[500px] flex flex-col gap-6">
        <div className="bg-white dark:bg-muted border border-muted-foreground/10 rounded-2xl shadow-md p-6 flex flex-col gap-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="text-base px-3 py-1">{exam.subject.career.university.name}</Badge>
            <Badge variant="secondary" className="text-base px-3 py-1">{exam.subject.career.name}</Badge>
            <Badge variant="secondary" className="text-base px-3 py-1">{exam.subject.name}</Badge>
            {exam.exam_type && (
              <Badge className={getExamTypeColor(exam.exam_type) + " text-base px-3 py-1"}>
                {exam.exam_type}
              </Badge>
            )}
            {exam.year && (
              <Badge variant="outline" className="text-base px-3 py-1">{exam.year}</Badge>
            )}
            {exam.semester && (
              <Badge variant="outline" className="text-base px-3 py-1">{exam.semester}</Badge>
            )}
            {exam.professor_name && (
              <Badge variant="outline" className="text-base px-3 py-1">{exam.professor_name}</Badge>
            )}
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold">{exam.title}</h1>

          {/* Uploader y fecha */}
          <div className="flex items-center gap-3 text-lg text-muted-foreground">
            {exam.uploader && (
              <>
                <User2 className="w-5 h-5" />
                <span>Subido por <span className="font-medium">{exam.uploader.name}</span></span>
              </>
            )}
            <CalendarDays className="w-5 h-5 ml-2" />
            <span>{formatDate(exam.created_at)}</span>
          </div>

          {/* Descripción */}
          {exam.description && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Descripción</div>
              <div className="bg-muted/40 rounded p-3 text-base">{exam.description}</div>
            </div>
          )}

          {/* Archivo */}
          <div>
            <a
              href={exam.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary underline text-lg font-medium"
            >
              <FileText className="w-5 h-5" />
              Descargar archivo
            </a>
            {exam.original_file_name && (
              <span className="ml-2 text-sm text-muted-foreground">
                ({exam.original_file_name}, {Math.round((exam.file_size || 0) / 1024)} KB)
              </span>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-4 justify-end mt-2">
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-3 rounded-lg shadow"
              style={{ minWidth: 150 }}
            >
              <CheckCircle2 className="w-5 h-5" />
              Aprobar
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-gray-200 text-gray-900 hover:bg-gray-300 text-lg px-8 py-3 rounded-lg shadow"
              style={{ minWidth: 150 }}
            >
              <XCircle className="w-5 h-5" />
              Rechazar
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de rechazo */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar examen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4">
            <Textarea
              placeholder="Motivo del rechazo (obligatorio)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              minLength={3}
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gray-200 text-gray-900 hover:bg-gray-300"
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? "Enviando..." : "Rechazar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
