"use client"; // Required for useState, useEffect, event handlers

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

// Define the expected shape of a successful login response
interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_at: string; // Or Date if you parse it
}

// Define the expected shape of an error response (adjust as needed)
interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>; // Optional: For validation errors
}

export function LoginModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setError("API URL is not configured.");
      setIsLoading(false);
      return;
    }

    // Endpoint from your Postman screenshot
    const loginEndpoint = `${apiUrl}/api/auth/token`;

    // Prepare form data as x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const response = await fetch(loginEndpoint, {
        method: "POST",
        headers: {
          // Crucial: Match the 'x-www-form-urlencoded' from Postman
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json", // Expect JSON response
        },
        body: formData.toString(), // Convert URLSearchParams to string
      });

      const result: LoginResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        // Handle potential error structures from Laravel
        let errorMessage = "Login failed. Please check your credentials.";
        if ("message" in result && result.message) {
          errorMessage = result.message;
        }
        // You could add more specific error handling here if needed
        // e.g., checking for result.errors for validation messages
        throw new Error(errorMessage);
      }

      // --- Success ---
      const loginData = result as LoginResponse;
      console.log("Login successful:", loginData);
      // TODO: Store the token securely (e.g., state management, context, httpOnly cookie via backend)
      // Example: localStorage.setItem('authToken', loginData.access_token); (Not recommended for production)
      setIsOpen(false); // Close modal on success
      setEmail(""); // Clear fields
      setPassword("");
      // TODO: Potentially redirect the user or update UI state
      // Example: router.push('/dashboard'); (if using Next.js router)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {/* This button will trigger the modal */}
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
          {error && (
            <p className="mb-4 text-center text-sm text-red-600">{error}</p>
          )}
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

