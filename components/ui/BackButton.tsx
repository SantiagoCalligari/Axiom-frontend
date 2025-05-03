// components/ui/BackButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => router.back()}
      aria-label="Volver a la página anterior"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}

