// components/auth/LoginModal.tsx
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
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";

// Interfaces (keep as before)
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
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleCredentialsSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      toast.error("API URL is not configured.");
      setIsLoading(false);
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
        let errorMessage = "Login failed. Please check your credentials.";
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
      login(loginData.access_token);
      toast.success("Logged in successfully!");
      setIsOpen(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(message);
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLoginClick = () => {
    // --- Option 1: Direct Redirect (Simpler) ---
    // Redirect the user directly to the Laravel backend route that starts the Google OAuth flow.
    // The backend will handle the redirect to Google and the callback.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      // Make sure this route exists in your Laravel routes/web.php or routes/api.php
      window.location.href = `${apiUrl}/login/google/redirect`;
    } else {
      toast.error("API URL not configured for Google Login.");
    }

    // --- Option 2: Open Popup (More complex, better UX potentially) ---
    // This would involve opening a popup window for the Google flow and listening
    // for messages or URL changes to get the token back. More complex to implement reliably.

    // --- Placeholder ---
    // toast.info("Google Login not implemented yet.");
  };


  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail("");
      setPassword("");
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Entrar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ingresar</DialogTitle>
          <DialogDescription>
            Accedé con tu cuenta de Axiom o ingresa con Google.
          </DialogDescription>
        </DialogHeader>

        {/* Email/Password Form */}
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          {/* Changed layout: Removed grid-cols-4, using space-y-1 inside divs */}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com" // Added placeholder
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
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
              disabled={isLoading}
            />
            {/* Optional: Add Forgot Password link here */}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Ingresando..." : "Ingresa con tu mail"}
            </Button>
          </DialogFooter>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              O continuar con
            </span>
          </div>
        </div>

        {/* Google Login Button */}
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-x-2"
          onClick={handleGoogleLoginClick}
          disabled={isLoading} // Disable while email login is processing
        >
          Ingresar con Google
        </Button>

      </DialogContent>
    </Dialog>
  );
}
