// components/auth/RegisterModal.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, User, Loader2, Smile } from "lucide-react";

interface ValidationErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}

export function RegisterModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (password !== passwordConfirmation) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setIsLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      toast.error("URL de la API no configurada.");
      setIsLoading(false);
      return;
    }

    const registerEndpoint = `${apiUrl}/api/auth/register`;

    try {
      const response = await fetch(registerEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name,
          display_name: displayName,
          email: email,
          password: password,
          password_confirmation: passwordConfirmation,
        }),
      });

      if (response.ok) {
        toast.success(
          "¡Registro exitoso! Revisa tu correo para verificar tu cuenta.",
        );
        setIsOpen(false);
        setName("");
        setDisplayName("");
        setEmail("");
        setPassword("");
        setPasswordConfirmation("");
      } else {
        const errorData: ValidationErrorResponse | any = await response.json();
        let errorMessage = "Error en el registro. Intenta de nuevo.";

        if (response.status === 422 && errorData.errors) {
          const firstErrorKey = Object.keys(errorData.errors)[0];
          errorMessage = errorData.errors[firstErrorKey][0];
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        throw new Error(errorMessage);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      toast.error(message);
      console.error("Error de registro:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setDisplayName("");
      setEmail("");
      setPassword("");
      setPasswordConfirmation("");
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Registrate</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px] rounded-xl shadow-lg p-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center mb-0">
            Crear Cuenta
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground mb-1">
            Unite a <span className="font-semibold text-primary">Axiom</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRegisterSubmit} className="space-y-3 py-1">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-xs text-muted-foreground">
              Nombre completo
            </Label>
            <div className="relative">
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                className="pl-9 py-2"
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="display-name" className="text-xs text-muted-foreground">
              ¿Cómo querés que nos refiramos a vos?
            </Label>
            <div className="relative">
              <Input
                id="display-name"
                type="text"
                placeholder="Ej: Nico, Flor, Profe, etc."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={isLoading}
                className="pl-9 py-2"
              />
              <Smile className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="register-email" className="text-xs text-muted-foreground">
              Email
            </Label>
            <div className="relative">
              <Input
                id="register-email"
                type="email"
                placeholder="tu@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="pl-9 py-2"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="register-password" className="text-xs text-muted-foreground">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="register-password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pl-9 py-2"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password-confirmation" className="text-xs text-muted-foreground">
              Confirmar Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password-confirmation"
                type="password"
                placeholder="Repite tu contraseña"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                disabled={isLoading}
                className="pl-9 py-2"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 text-base font-semibold flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
              {isLoading ? "Registrando..." : "Crear Cuenta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
