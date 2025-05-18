"use client";

import * as React from "react";
import { useState } from "react";
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

export function ExamCreateModal({
  universitySlug,
  careerSlug,
  subjectSlug,
  onCreated,
}: ExamCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [professorName, setProfessorName] = useState("");
  const [semester, setSemester] = useState("");
  const [examType, setExamType] = useState("");
  const [examDate, setExamDate] = useState("");

  const { token, verifyTokenAndExecute } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      const name = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await verifyTokenAndExecute(async () => {
      if (!file) {
        toast.error("Subí un archivo");
        return;
      }
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("professor_name", professorName);
      if (semester) formData.append("semester", semester);
      if (examType) formData.append("exam_type", examType);
      formData.append("exam_date", examDate);

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

        if (!res.ok) {
          throw new Error("Error al crear el examen");
        }

        toast.success("Examen creado correctamente");
        setOpen(false);
        setFile(null);
        setTitle("");
        setProfessorName("");
        setSemester("");
        setExamType("");
        setExamDate("");
        onCreated?.();
      } catch (err) {
        toast.error("No se pudo crear el examen");
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">+ Nuevo Examen</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir nuevo examen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Archivo PDF</Label>
            <Input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Profesor/a</Label>
              <Input
                value={professorName}
                onChange={(e) => setProfessorName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div>
              <Label>Cuatrimestre</Label>
              <Select value={semester} onValueChange={setSemester}>
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
              <Label>Tipo de examen</Label>
              <Select value={examType} onValueChange={setExamType}>
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
              <Label>Fecha</Label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Subiendo..." : "Subir"}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
