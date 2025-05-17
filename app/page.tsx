// FILE: app/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Fleur_De_Leah } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// LoginModal is now global, trigger via useAuth
// import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import { RegisterModal } from "@/components/auth/RegisterModal";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import CreateUniversityModal from "@/components/admin/CreateUniversityModal";

interface University {
  id: number;
  name: string;
  slug: string;
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

const fleur = Fleur_De_Leah({ weight: "400", subsets: ["latin"] });

export default function Home() {
  const {
    token,
    logout,
    isLoading: isAuthLoading,
    openLoginModal,
    isAuthenticated, // Use isAuthenticated for conditional rendering
    user,
  } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<University[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info("Sesión cerrada.");
  };

  const fetchUniversities = useCallback(
    async (query: string, signal: AbortSignal): Promise<University[]> => {
      setIsSearchLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error("URL de la API no configurada.");
        setIsSearchLoading(false);
        return [];
      }

      try {
        const params = new URLSearchParams({ search: query, limit: "8" });
        const response = await fetch(
          `${apiUrl}/api/universities?${params.toString()}`,
          {
            headers: { Accept: "application/json" },
            signal,
          },
        );

        if (signal.aborted) return [];
        if (!response.ok)
          throw new Error(
            `Error al buscar universidades (status: ${response.status})`,
          );

        const data = await response.json();
        return data.data || [];
      } catch (error) {
        if ((error as Error).name === "AbortError") return [];
        console.error("Error de búsqueda:", error);
        toast.error(
          error instanceof Error ? error.message : "Falló la búsqueda.",
        );
        return [];
      } finally {
        if (!signal.aborted) setIsSearchLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (searchTerm.trim()) {
      setIsDropdownVisible(true);
      setIsSearchLoading(true); // Ensure loading state is true before fetch
      fetchUniversities(searchTerm, signal)
        .then((fetchedResults) => {
          if (!signal.aborted) setResults(fetchedResults);
        })
        .catch((error) => {
          if ((error as Error).name !== "AbortError")
            console.error("Error de fetch no manejado en effect:", error);
        });
    } else {
      setResults([]);
      setIsDropdownVisible(false);
      setIsSearchLoading(false); // Ensure loading state is false if no search term
    }
    return () => controller.abort();
  }, [searchTerm, fetchUniversities]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isAuthLoading && !token) {
    // Show full page skeleton only on initial auth load and no token yet
    return (
      <div className="relative flex min-h-screen flex-col bg-gray-200">
        <div className="absolute top-4 right-4 flex h-10 items-center gap-x-3 p-4 sm:top-6 sm:right-6">
          <Skeleton className="h-10 w-20 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="flex w-full animate-pulse flex-col items-center text-center mb-16 sm:mb-20">
            <div className="mb-1 h-20 w-3/5 rounded bg-gray-300 sm:h-24"></div>
            <div className="mb-6 h-6 w-2/5 rounded bg-gray-300"></div>
            <div className="w-full max-w-2xl px-4 md:px-0">
              <div className="h-14 w-full rounded-full bg-gray-300"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-200">
      <div className="absolute top-4 right-4 flex items-center gap-x-3 p-4 sm:top-6 sm:right-6">
        {isAuthenticated ? ( // Use isAuthenticated
          <>
            <Link href="/perfil" passHref>
              <Button variant="outline">Perfil</Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout}>
              Salir
            </Button>
          </>
        ) : (
          <>
            {/* Button to trigger global LoginModal */}
            <Button variant="outline" onClick={openLoginModal}>
              Entrar
            </Button>
            <RegisterModal /> {/* RegisterModal can keep its own trigger for now */}
          </>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="flex w-full flex-col items-center text-center mb-8 sm:mb-20">
          <h1
            className={`mb-1 text-6xl font-medium text-blue-700 sm:text-9xl ${fleur.className}`}
          >
            Axiom
          </h1>
          <p
            className={`mb-4 text-base text-gray-600 sm:text-xl ${fleur.className}`}
          >
            Por estudiantes, Para estudiantes
          </p>

          <div
            ref={searchContainerRef}
            className="relative w-full max-w-2xl px-2 sm:px-4 md:px-0"
          >
            <div className="relative flex items-center">
              <Input
                type="search"
                placeholder="Buscá tu Universidad"
                className="w-full h-12 sm:h-14 rounded-full px-4 sm:px-6 py-2 sm:py-3 pr-12 text-base sm:text-lg font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm.trim() && setIsDropdownVisible(true)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 sm:right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                aria-label="Buscar"
              >
                <SearchIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </div>

            {isDropdownVisible && searchTerm.trim() && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                {isSearchLoading ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Cargando...
                  </div>
                ) : results.length > 0 ? (
                  <ul className="max-h-60 overflow-y-auto py-1">
                    {results.map((uni) => (
                      <li key={uni.id}>
                        <Link
                          href={`/${uni.slug}`}
                          className="block cursor-pointer px-4 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                          onClick={() => setIsDropdownVisible(false)}
                        >
                          {uni.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron resultados.
                  </div>
                )}
              </div>
            )}
          </div>
          {user?.roles?.some((r) => r.name === "admin") && (
            <Button className="mb-6" onClick={() => setShowCreateModal(true)}>
              Crear Universidad
            </Button>
          )}
          <CreateUniversityModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            onCreated={() => {
              setShowCreateModal(false);
              // Podrías recargar la lista aquí si es necesario
            }}
          />
        </div>
      </div>
    </div>
  );
}
