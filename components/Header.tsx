"use client";

import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { RegisterModal } from "@/components/auth/RegisterModal";
import Link from "next/link";
import { toast } from "sonner";

export function Header() {
  const {
    isAuthenticated,
    openLoginModal,
    logout,
    user,
  } = useAuth();

  const handleLogout = () => {
    logout();
    toast.info("Sesión cerrada.");
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
      style={{ pointerEvents: "none" }}
    >
      <div style={{ pointerEvents: "auto" }}>
        {isAuthenticated ? (
          <div className="flex flex-col items-end gap-2">
            <Link href="/perfil" passHref>
              <Button
                variant="outline"
                className="max-w-[10rem] w-full overflow-hidden text-ellipsis whitespace-nowrap"
                title={user?.display_name || "Perfil"}
              >
                <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                  {user?.display_name || "Perfil"}
                </span>
              </Button>
            </Link>
            <Button variant="ghost" className="w-full max-w-[10rem]" onClick={handleLogout}>
              Salir
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2">
            <Button
              variant="outline"
              className="w-full max-w-[10rem]"
              onClick={openLoginModal}
            >
              Entrar
            </Button>
            <RegisterModal />
          </div>
        )}
      </div>
    </div>
  );
}
