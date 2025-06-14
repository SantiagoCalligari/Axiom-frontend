// FILE: components/auth/LoginModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
}
interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export function LoginModal() {
  const {
    login,
    isLoginModalOpen,
    closeLoginModal,
    isLoading: isAuthLoading,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reset form if modal is closed externally
    if (!isLoginModalOpen) {
      setEmail("");
      setPassword("");
      setIsSubmitting(false);
    }
  }, [isLoginModalOpen]);

  const handleCredentialsSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsSubmitting(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      toast.error("URL de la API no configurada.");
      setIsSubmitting(false);
      return;
    }

    const loginEndpoint = `${apiUrl}/api/auth/token`;
    const formData = new URLSearchParams();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const response = await fetch(loginEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: formData.toString(),
      });

      const result: LoginResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        let errorMessage =
          "Error al iniciar sesión. Verifica tus credenciales.";
        if ("message" in result && result.message) {
          errorMessage = result.message;
          if (result.errors) {
            const firstError = Object.values(result.errors)[0]?.[0];
            if (firstError) errorMessage += `: ${firstError}`;
          }
        }
        throw new Error(errorMessage);
      }

      const loginData = result as LoginResponse;
      await login(loginData.access_token);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      toast.error(message);
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isLoginModalOpen} onOpenChange={closeLoginModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ingresar</DialogTitle>
          <DialogDescription>
            Accedé con tu cuenta de Axiom o ingresa con Google.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting || isAuthLoading}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting || isAuthLoading}
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || isAuthLoading}
              className="w-full"
            >
              {isSubmitting || isAuthLoading
                ? "Ingresando..."
                : "Ingresa con tu mail"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
