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
// No necesitamos useAuth aquí porque no estamos logueando al usuario
import { toast } from "sonner";

// Interfaz para errores de validación de Laravel (común)
interface ValidationErrorResponse {
  message: string;
  errors: Record<string, string[]>; // { email: ["El email ya existe."], ... }
}

export function RegisterModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    // Validación simple del lado del cliente
    if (password !== passwordConfirmation) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      // Asumiendo un mínimo de 8 caracteres (ajusta según tus reglas de Laravel)
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

    // Endpoint común para registro en Laravel API
    const registerEndpoint = `${apiUrl}/api/register`; // Ajusta si es diferente

    try {
      const response = await fetch(registerEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
          password_confirmation: passwordConfirmation,
        }),
      });

      // Éxito (usualmente 201 Created)
      if (response.ok) {
        // const newUser = await response.json(); // Podrías obtener datos del nuevo usuario si la API los devuelve
        toast.success(
          "¡Registro exitoso! Revisa tu correo para verificar tu cuenta.",
        );
        setIsOpen(false); // Cerrar modal
        // Limpiar campos
        setName("");
        setEmail("");
        setPassword("");
        setPasswordConfirmation("");
        // NO loguear al usuario aquí, necesita verificar email
      } else {
        // Manejar errores (ej: 422 Validación)
        const errorData: ValidationErrorResponse | any = await response.json();
        let errorMessage = "Error en el registro. Intenta de nuevo.";

        if (response.status === 422 && errorData.errors) {
          // Extraer el primer error de validación para mostrar
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

  // Limpiar campos al cerrar
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setEmail("");
      setPassword("");
      setPasswordConfirmation("");
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {/* El botón que abre este modal estará en page.tsx */}
        <Button>Registrate</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Cuenta</DialogTitle>
          <DialogDescription>
            Completa los datos para unirte a Axiom.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRegisterSubmit} className="space-y-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="register-email">Email</Label> {/* ID único */}
            <Input
              id="register-email"
              type="email"
              placeholder="tu@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="register-password">Contraseña</Label> {/* ID único */}
            <Input
              id="register-password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password-confirmation">Confirmar Contraseña</Label>
            <Input
              id="password-confirmation"
              type="password"
              placeholder="Repite tu contraseña"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Registrando..." : "Crear Cuenta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

