// components/exam/PendingExamsWidget.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { PendingExamsModal } from "@/components/exam/PendingExamsModal";
import { Badge } from "@/components/ui/badge";

function isAnyAdmin(roles: string[] | undefined) {
  if (!roles) return false;
  return roles.some((r) =>
    ["admin", "university_admin", "career_admin", "subject_admin"].includes(r)
  );
}

export function PendingExamsWidget() {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  // Solo admins de cualquier tipo
  const isAdmin = isAnyAdmin(user?.roles as any);

  // Fetch count (opcional, si tu API lo soporta, si no, podés omitir esto)
  useEffect(() => {
    if (!token || !isAdmin) return;
    const fetchCount = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(
          `${apiUrl}/api/admin/exams/pending`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        setPendingCount(data.total ?? null);
      } catch {
        setPendingCount(null);
      }
    };
    fetchCount();
  }, [token, isAdmin]);

  // No mostrar si no hay usuario o no es admin
  if (!user || !isAdmin) return null;

  return (
    <>
      <div
        className="fixed bottom-4 left-4 z-50"
        style={{ pointerEvents: "none" }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <Button
            variant="secondary"
            className="flex items-center gap-2 shadow-lg"
            onClick={() => setOpen(true)}
          >
            Exámenes pendientes
            {pendingCount !== null && (
              <Badge
                variant="destructive"
                className="max-w-[3.5rem] px-2 overflow-hidden text-ellipsis"
              >
                {pendingCount > 999 ? "999+" : pendingCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
      <PendingExamsModal open={open} onOpenChange={setOpen} />
    </>
  );
}
