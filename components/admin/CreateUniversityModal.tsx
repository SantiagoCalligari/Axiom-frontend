import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateUniversityModal({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/api/universities`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${localStorage.getItem("axiom_access_token")}` },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Error al crear universidad");
      toast.success("Universidad creada correctamente");
      setName("");
      setDescription("");
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Universidad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Nombre de la universidad"
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
              <Button type="button" variant="outline" disabled={loading}>Cancelar</Button>
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