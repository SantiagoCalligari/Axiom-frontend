"use client";

import * as React from "react";
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { cn } from "@/lib/utils";

interface ExamCreateModalProps {
  universitySlug: string;
  careerSlug: string;
  subjectSlug: string;
  onCreated?: () => void;
}

const SEMESTER_OPTIONS = [
  { label: "1er Cuatrimestre", value: "1C" },
  { label: "2do Cuatrimestre", value: "2C" },
];

const EXAM_TYPE_OPTIONS = [
  { label: "Parcial", value: "midterm" },
  { label: "Recuperatorio", value: "retake" },
  { label: "Final", value: "final" },
];

type ExamFile = {
  id: string;
  file: File;
  title: string;
  professorName: string;
  semester: string;
  examType: string;
  examDate: string;
};

export function ExamCreateModal({
  universitySlug,
  careerSlug,
  subjectSlug,
  onCreated,
}: ExamCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<ExamFile[]>([]);
  const dropRef = useRef<HTMLDivElement>(null);

  const { token, verifyTokenAndExecute } = useAuth();

  const generateId = () => Math.random().toString(36).slice(2) + Date.now();

  const handleFilesAdd = (fileList: FileList | File[]) => {
    const newFiles: ExamFile[] = [];
    Array.from(fileList).forEach((file) => {
      if (
        file.type === "application/pdf" &&
        !files.some((f) => f.file.name === file.name && f.file.size === file.size)
      ) {
        newFiles.push({
          id: generateId(),
          file,
          title: file.name.replace(/\.[^/.]+$/, ""),
          professorName: "",
          semester: "",
          examType: "",
          examDate: "",
        });
      }
    });
    if (newFiles.length === 0) {
      toast.info("No se agregaron archivos nuevos.");
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdd(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFileMetaChange = (
    id: string,
    field: keyof Omit<ExamFile, "id" | "file">,
    value: string,
  ) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
            ...f,
            [field]: value,
          }
          : f,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error("Agrega al menos un archivo.");
      return;
    }


    await verifyTokenAndExecute(async () => {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const f of files) {
        const formData = new FormData();
        formData.append("file", f.file);
        formData.append("title", f.title);
        formData.append("professor_name", f.professorName);
        if (f.semester) formData.append("semester", f.semester);
        if (f.examType) formData.append("exam_type", f.examType);
        formData.append("exam_date", f.examDate);

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const url = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exams`;
          const res = await fetch(url, {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!res.ok) throw new Error();
          successCount++;
        } catch {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `Se subieron ${successCount} examen${successCount > 1 ? "es" : ""} correctamente.`,
        );
        setFiles([]);
        setOpen(false);
        onCreated?.();
      }
      if (errorCount > 0) {
        toast.error(
          `No se pudieron subir ${errorCount} archivo${errorCount > 1 ? "s" : ""}.`,
        );
      }
      setLoading(false);
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">+ Nuevo Examen</Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        style={{ minWidth: 350, maxWidth: 600 }}
      >
        <DialogHeader>
          <DialogTitle>Subir exámenes</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Zona de drop y selección */}
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={cn(
              "border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors",
              "hover:border-primary",
              "bg-muted",
              "mb-2"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFilesAdd(e.target.files);
                e.target.value = "";
              }}
            />
            <span className="block text-sm text-muted-foreground">
              Arrastra y suelta archivos PDF aquí, o haz click para seleccionarlos.
            </span>
          </div>

          {/* Lista de archivos y metadata */}
          <div
            className="flex flex-col gap-8"
            style={{
              maxHeight: "50vh",
              overflowY: "auto",
            }}
          >
            {files.length === 0 && (
              <div className="text-center text-muted-foreground text-sm">
                No hay archivos agregados.
              </div>
            )}
            {files.map((f, idx) => (
              <div
                key={f.id}
                className="border rounded-md p-5 bg-background relative mb-2"
              >
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => handleRemoveFile(f.id)}
                  title="Eliminar archivo"
                >
                  ×
                </Button>
                <div className="font-medium mb-3 truncate">
                  {idx + 1}. {f.file.name}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-4 mb-4">
                  <div>
                    <Label className="text-muted-foreground mb-1.5 block">Título*</Label>
                    <Input
                      value={f.title}
                      onChange={(e) =>
                        handleFileMetaChange(f.id, "title", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground mb-1.5 block">Profesor/a</Label>
                    <Input
                      value={f.professorName}
                      onChange={(e) =>
                        handleFileMetaChange(f.id, "professorName", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-2">
                  <div>
                    <Label className="text-muted-foreground mb-1.5 block">Cuatrimestre</Label>
                    <Select
                      value={f.semester}
                      onValueChange={(v) =>
                        handleFileMetaChange(f.id, "semester", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEMESTER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground mb-1.5 block">Tipo de examen*</Label>
                    <Select
                      value={f.examType}
                      onValueChange={(v) =>
                        handleFileMetaChange(f.id, "examType", v)
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXAM_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground mb-1.5 block">Fecha</Label>
                    <Input
                      type="date"
                      value={f.examDate}
                      onChange={(e) =>
                        handleFileMetaChange(f.id, "examDate", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || files.length === 0}>
              {loading ? "Subiendo..." : "Subir todo"}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
