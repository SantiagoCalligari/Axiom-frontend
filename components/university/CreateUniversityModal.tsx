// components/university/CreateUniversityModal.tsx

"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function CreateUniversityModal({
  open,
  onOpenChange,
  token,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [aliases, setAliases] = useState<string[]>([]);
  const [aliasInput, setAliasInput] = useState("");
  const [loading, setLoading] = useState(false);
  const aliasInputRef = useRef<HTMLInputElement>(null);

  const handleAddAlias = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = aliasInput.trim();
    if (trimmed && !aliases.includes(trimmed)) {
      setAliases((prev) => [...prev, trimmed]);
      setAliasInput("");
      setTimeout(() => aliasInputRef.current?.focus(), 0);
    }
  };

  const handleRemoveAlias = (alias: string) => {
    setAliases((prev) => prev.filter((a) => a !== alias));
    setTimeout(() => aliasInputRef.current?.focus(), 0);
  };

  const handleAliasInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && aliasInput.trim()) {
      e.preventDefault();
      handleAddAlias();
    } else if (e.key === "Backspace" && !aliasInput && aliases.length > 0) {
      // Borrar el último alias con backspace si el input está vacío
      setAliases((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("No autenticado.");
      return;
    }
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/universities`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          name,
          description,
          aliases,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Error al crear la universidad.");
      }
      toast.success("Universidad creada correctamente.");
      onOpenChange(false);
      setName("");
      setDescription("");
      setAliases([]);
      setAliasInput("");
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
          <DialogTitle>Crear Universidad</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Nombre de la universidad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Aliases input visual */}
          <div>
            <label className="block text-sm font-medium mb-1">Aliases</label>
            <div
              className="flex flex-wrap items-center gap-1 px-3 py-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-primary/30"
              style={{ minHeight: 40 }}
              onClick={() => aliasInputRef.current?.focus()}
            >
              {aliases.map((alias) => (
                <span
                  key={alias}
                  className="inline-flex items-center bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium"
                >
                  {alias}
                  <button
                    type="button"
                    className="ml-1 text-xs text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveAlias(alias)}
                    tabIndex={-1}
                    aria-label={`Eliminar alias ${alias}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                ref={aliasInputRef}
                type="text"
                className="flex-1 min-w-[80px] border-none outline-none bg-transparent text-sm py-1"
                placeholder={aliases.length === 0 ? "Agregar alias y presioná Enter o , ..." : ""}
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                onKeyDown={handleAliasInputKeyDown}
                disabled={loading}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Presioná <b>Enter</b> o <b>,</b> para agregar un alias. Backspace para borrar el último.
            </div>
          </div>

          <Textarea
            placeholder="Descripción de la universidad"
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
