// components/career/CreateSubjectModal.tsx

"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

interface CreateSubjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universitySlug: string;
  careerSlug: string;
  token: string | null;
  onSubjectAdded: (subject: { id: number; name: string; slug: string; description: string | null }) => void;
}

export default function CreateSubjectModal({
  open,
  onOpenChange,
  universitySlug,
  careerSlug,
  token,
  onSubjectAdded,
}: CreateSubjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("No autenticado.");
      return;
    }
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subjects`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            name,
            description,
          }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Error al crear la materia.");
      }
      const data = await response.json();
      toast.success("Materia creada correctamente.");
      onOpenChange(false);
      setName("");
      setDescription("");
      if (onSubjectAdded && data && data.data) {
        onSubjectAdded(data.data);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Materia</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Nombre de la materia"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            placeholder="Descripción de la materia"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Creando..." : "Crear"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
