"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { createSubject } from "@/app/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universitySlug: string;
  careerSlug: string;
  onCreated: () => void;
}

export default function CreateSubjectModal({ open, onOpenChange, universitySlug, careerSlug, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createSubject(universitySlug, careerSlug, { name, description });
      toast.success("Materia creada correctamente");
      setName("");
      setDescription("");
      onCreated();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Materia</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Nombre de la materia"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            maxLength={128}
            disabled={loading}
          />
          <Input
            placeholder="Descripción (opcional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={512}
            disabled={loading}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 