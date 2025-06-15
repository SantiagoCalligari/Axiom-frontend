"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";

export function UserNameLink() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 24,
        zIndex: 50,
      }}
    >
      <Link
        href="/perfil"
        className="font-semibold text-base px-4 py-2 rounded hover:bg-primary/10 transition"
        style={{ background: "rgba(255,255,255,0.7)" }}
      >
        {user.display_name}
      </Link>
    </div>
  );
}
