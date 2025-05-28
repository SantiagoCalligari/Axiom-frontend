// components/career/EditCareerModal.tsx

"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface EditCareerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universitySlug: string;
  careerSlug: string;
  initialName: string;
  initialDescription: string | null;
  token: string | null;
  onCareerUpdated: (data: { name: string; description: string }) => void;
}

export default function EditCareerModal({
  open,
  onOpenChange,
  universitySlug,
  careerSlug,
  initialName,
  initialDescription,
  token,
  onCareerUpdated,
}: EditCareerModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setDescription(initialDescription || "");
    }
  }, [open, initialName, initialDescription]);

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
        `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}`,
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
        throw new Error(data.message || "Error al modificar la carrera.");
      }
      toast.success("Carrera modificada correctamente.");
      onCareerUpdated({ name, description });
      onOpenChange(false);
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
          <DialogTitle>Editar Carrera</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Nombre de la carrera"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            placeholder="Descripción de la carrera"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
