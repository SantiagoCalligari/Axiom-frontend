"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface EditUniversityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universitySlug: string;
  universityName: string;
  universityDescription: string | null;
  token: string | null;
}

export default function EditUniversityModal({
  open,
  onOpenChange,
  universitySlug,
  universityName,
  universityDescription,
  token,
}: EditUniversityModalProps) {
  const [name, setName] = useState(universityName);
  const [description, setDescription] = useState(universityDescription || "");
  const [loading, setLoading] = useState(false);

  // Sync state with props when modal opens
  useEffect(() => {
    if (open) {
      setName(universityName);
      setDescription(universityDescription || "");
    }
  }, [open, universityName, universityDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("No autenticado.");
      return;
    }
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/university/${universitySlug}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Error al modificar la universidad.");
      }
      toast.success("Universidad modificada correctamente.");
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
          <DialogTitle>Editar Universidad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Nombre de la universidad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Textarea
            placeholder="Descripción de la universidad"
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
