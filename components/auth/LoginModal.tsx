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
import { useAuth } from "@/app/context/AuthContext"; // Import useAuth
import { toast } from "sonner"; // Import toast

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
  // Remove local error state, use toast instead
  // const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth(); // Get login function from context

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    // setError(null); // No longer needed

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      // Use toast for errors
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
          // Optionally display validation errors if present
          if (result.errors) {
            const firstError = Object.values(result.errors)[0]?.[0];
            if (firstError) errorMessage += `: ${firstError}`;
          }
        }
        throw new Error(errorMessage);
      }

      // --- Success ---
      const loginData = result as LoginResponse;
      login(loginData.access_token); // Use context login function
      toast.success("Logged in successfully!"); // Show success toast
      setIsOpen(false);
      setEmail("");
      setPassword("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(message); // Show error toast
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset fields when modal is closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEmail("");
      setPassword("");
      // setError(null); // No longer needed
    }
    setIsOpen(open);
  };

  return (
    // Pass handleOpenChange to Dialog
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Entrar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>
            Enter your credentials to access your account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Input fields remain the same */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="col-span-3"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="col-span-3"
                disabled={isLoading}
              />
            </div>
          </div>
          {/* Remove local error display */}
          {/* {error && <p className="mb-4 text-center text-sm text-red-600">{error}</p>} */}
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
