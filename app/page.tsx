// app/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Fleur_De_Leah } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginModal } from "@/components/auth/LoginModal";
// Corrected import path for AuthContext based on previous examples
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import { RegisterModal } from "@/components/auth/RegisterModal";
import Link from "next/link"; // <-- Import Link
import { Skeleton } from "@/components/ui/skeleton"; // <-- Import Skeleton

// University Interface (keep as before)
interface University {
  id: number;
  name: string;
}

// Font Initialization (keep as before)
const fleur = Fleur_De_Leah({ weight: "400", subsets: ["latin"] });

// SearchIcon Component (keep as before)
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  // ... (SVG code remains the same)
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

export default function Home() {
  const { token, logout, isLoading: isAuthLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<University[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    toast.info("Sesión cerrada."); // Spanish
  };

  // --- Search Logic (remains the same) ---
  const fetchUniversities = useCallback(async ( // Added useCallback and dependency array
    query: string,
    signal: AbortSignal,
  ): Promise<University[]> => {
    // ... (fetchUniversities implementation remains the same)
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

      if (signal.aborted) {
        console.log("Fetch abortado para:", query);
        return [];
      }

      if (!response.ok) {
        throw new Error(`Error al buscar universidades (status: ${response.status})`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Fetch abortado exitosamente');
        return [];
      }
      console.error("Error de búsqueda:", error);
      toast.error(
        error instanceof Error ? error.message : "Falló la búsqueda.", // Spanish
      );
      return [];
    } finally {
      if (!signal.aborted) {
        setIsSearchLoading(false);
      }
    }
  }, []); // Empty dependency array for useCallback

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (searchTerm.trim()) {
      setIsDropdownVisible(true);
      setIsSearchLoading(true);

      fetchUniversities(searchTerm, signal)
        .then((fetchedResults) => {
          if (!signal.aborted) {
            setResults(fetchedResults);
          }
        })
        .catch((error) => {
          if ((error as Error).name !== 'AbortError') {
            console.error("Error de fetch no manejado en effect:", error);
          }
        });

    } else {
      setResults([]);
      setIsDropdownVisible(false);
      setIsSearchLoading(false);
    }

    return () => {
      console.log("Abortando fetch para:", searchTerm);
      controller.abort();
    };
    // Include fetchUniversities in dependency array as it's defined with useCallback
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  // --- End Search Logic ---


  // Auth Loading State - Added Skeletons for header
  if (isAuthLoading) {
    return (
      <div className="relative flex min-h-screen flex-col bg-gray-200">
        {/* Skeleton Header */}
        <div className="absolute top-4 right-4 flex h-10 items-center gap-x-3 p-4 sm:top-6 sm:right-6">
          <Skeleton className="h-10 w-20 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
        {/* Skeleton Body */}
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
      {/* Conditional Header Buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-x-3 p-4 sm:top-6 sm:right-6">
        {token ? (
          // --- User is logged in ---
          <>
            {/* Link to Profile Page */}
            <Link href="/perfil" passHref>
              <Button variant="outline">Perfil</Button> {/* Spanish */}
            </Link>
            <Button variant="ghost" onClick={handleLogout}>
              Salir {/* Spanish */}
            </Button>
          </>
        ) : (
          // --- User is logged out ---
          <>
            <LoginModal />
            <RegisterModal />
          </>
        )}
      </div>

      {/* Centering Container (remains the same) */}
      <div className="flex flex-1 items-center justify-center p-4">
        {/* Content Block (remains the same) */}
        <div className="flex w-full flex-col items-center text-center mb-16 sm:mb-20">
          {/* Heading (remains the same) */}
          <h1
            className={`mb-1 text-8xl font-medium text-blue-700 sm:text-9xl ${fleur.className}`}
          >
            Axiom
          </h1>
          {/* Subtitle (remains the same) */}
          <p
            className={`mb-6 text-lg text-gray-600 sm:text-xl ${fleur.className}`}
          >
            Por estudiantes, Para estudiantes
          </p>

          {/* --- Search Bar Section with Dropdown (remains the same) --- */}
          <div
            ref={searchContainerRef}
            className="relative w-full max-w-2xl px-4 md:px-0"
          >
            <div className="relative flex items-center">
              <Input
                type="search"
                placeholder="Buscá tu Universidad" // Spanish
                className="w-full h-14 rounded-full px-6 py-3 pr-12 text-lg font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm.trim() && setIsDropdownVisible(true)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                aria-label="Buscar" // Spanish
              >
                <SearchIcon className="h-6 w-6" />
              </Button>
            </div>

            {/* --- Dropdown Menu (remains the same) --- */}
            {isDropdownVisible && searchTerm.trim() && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                {isSearchLoading ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Cargando... {/* Spanish */}
                  </div>
                ) : results.length > 0 ? (
                  <ul className="max-h-60 overflow-y-auto py-1">
                    {results.map((uni) => (
                      <li
                        key={uni.id}
                        className="cursor-pointer px-4 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                        onClick={() => {
                          setSearchTerm(uni.name);
                          setIsDropdownVisible(false);
                          setResults([]);
                          console.log("Universidad seleccionada:", uni); // Spanish
                        }}
                      >
                        {uni.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron resultados. {/* Spanish */}
                  </div>
                )}
              </div>
            )}
            {/* --- End Dropdown Menu --- */}
          </div>
          {/* --- End Search Bar Section --- */}
        </div>
      </div>
    </div>
  );
}
