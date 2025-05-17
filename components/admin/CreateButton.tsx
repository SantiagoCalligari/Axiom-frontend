"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { ReactNode } from "react";

interface Props {
  allowedRoles: string[];
  children: ReactNode;
  onClick: () => void;
}

export default function CreateButton({ allowedRoles, children, onClick }: Props) {
  const { user } = useAuth();

  if (!user?.roles?.some((r) => allowedRoles.includes(r.name))) {
    return null;
  }

  return (
    <Button onClick={onClick}>
      {children}
    </Button>
  );
} 