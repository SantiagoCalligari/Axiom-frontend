// app/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Fleur_De_Leah } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";

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

// REMOVED debounce function

export default function Home() {
  const { token, logout, isLoading: isAuthLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<University[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    toast.info("Logged out.");
  };

  // --- Search Logic ---

  // Function to fetch universities (now accepts AbortSignal)
  const fetchUniversities = async (
    query: string,
    signal: AbortSignal, // Added signal parameter
  ): Promise<University[]> => {
    // No length check here, fetch even for 1 character if desired
    // Or keep a minimum length check: if (query.trim().length < 1) return [];
    setIsSearchLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      // Avoid toast spamming, maybe log error or show once
      console.error("API URL is not configured.");
      setIsSearchLoading(false);
      return [];
    }

    try {
      const params = new URLSearchParams({ search: query, limit: "8" });
      const response = await fetch(
        `${apiUrl}/api/universities?${params.toString()}`,
        {
          headers: { Accept: "application/json" },
          signal, // Pass the signal to fetch
        },
      );

      // Don't throw error if aborted, just return empty
      if (signal.aborted) {
        console.log("Fetch aborted for:", query);
        return [];
      }

      if (!response.ok) {
        // Handle non-abort errors
        throw new Error(`Failed to fetch universities (status: ${response.status})`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      // Ignore abort errors, log others
      if ((error as Error).name === 'AbortError') {
        console.log('Fetch aborted successfully');
        return [];
      }
      console.error("Search error:", error);
      toast.error(
        error instanceof Error ? error.message : "Search failed.",
      );
      return [];
    } finally {
      // Only set loading false if the signal wasn't aborted
      // This prevents flicker if a new request starts immediately
      if (!signal.aborted) {
        setIsSearchLoading(false);
      }
    }
  };

  // Effect to trigger search on every searchTerm change
  useEffect(() => {
    // Create an AbortController for this specific effect run
    const controller = new AbortController();
    const signal = controller.signal;

    if (searchTerm.trim()) { // Check if searchTerm is not just whitespace
      setIsDropdownVisible(true);
      setIsSearchLoading(true); // Set loading immediately

      fetchUniversities(searchTerm, signal)
        .then((fetchedResults) => {
          // Only update results if the request wasn't aborted
          if (!signal.aborted) {
            setResults(fetchedResults);
          }
        })
        .catch((error) => {
          // Error handling is now mostly inside fetchUniversities
          // We only need to catch potential unhandled promise rejections if any
          if ((error as Error).name !== 'AbortError') {
            console.error("Unhandled fetch error in effect:", error);
          }
        })
        .finally(() => {
          // Loading state is handled within fetchUniversities based on abort status
          // We could potentially set loading false here ONLY if signal wasn't aborted,
          // but doing it in fetchUniversities is cleaner.
        });

    } else {
      setResults([]); // Clear results if search term is empty/whitespace
      setIsDropdownVisible(false);
      setIsSearchLoading(false); // Ensure loading is false if term is cleared
    }

    // Cleanup function: Abort the fetch request when the component unmounts
    // or when the searchTerm changes again (triggering the effect to re-run)
    return () => {
      console.log("Aborting fetch for:", searchTerm); // Log abortion
      controller.abort();
      // Maybe set loading false here on abort? Consider UX.
      // setIsSearchLoading(false);
    };
  }, [searchTerm]); // Dependency: only searchTerm

  // Effect for click outside (keep as before)
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
  }, []); // Empty dependency array is correct here

  // --- End Search Logic ---

  // Auth Loading State (keep as before)
  if (isAuthLoading) {
    // ... (Auth loading skeleton remains the same)
    return (
      <div className="relative flex min-h-screen flex-col bg-gray-200">
        {/* Optional: Add skeleton loaders for header and content */}
        <div className="absolute top-4 right-4 flex h-10 gap-x-3 p-4 sm:top-6 sm:right-6">
          {/* Skeleton buttons */}
          <div className="h-10 w-20 animate-pulse rounded-md bg-gray-300"></div>
          <div className="h-10 w-24 animate-pulse rounded-md bg-gray-300"></div>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          {/* Skeleton content */}
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
      {/* Conditional Header Buttons (keep as before) */}
      <div className="absolute top-4 right-4 flex items-center gap-x-3 p-4 sm:top-6 sm:right-6">
        {token ? (
          <>
            <Button variant="outline">Profile</Button>
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <LoginModal />
            <Button>Registrate</Button>
          </>
        )}
      </div>

      {/* Centering Container (keep as before) */}
      <div className="flex flex-1 items-center justify-center p-4">
        {/* Content Block (keep as before) */}
        <div className="flex w-full flex-col items-center text-center mb-16 sm:mb-20">
          {/* Heading (keep as before) */}
          <h1
            className={`mb-1 text-8xl font-medium text-blue-700 sm:text-9xl ${fleur.className}`}
          >
            Axiom
          </h1>
          {/* Subtitle (keep as before) */}
          <p
            className={`mb-6 text-lg text-gray-600 sm:text-xl ${fleur.className}`}
          >
            Por estudiantes, Para estudiantes
          </p>

          {/* --- Search Bar Section with Dropdown --- */}
          <div
            ref={searchContainerRef}
            className="relative w-full max-w-2xl px-4 md:px-0"
          >
            <div className="relative flex items-center">
              <Input
                type="search"
                placeholder="Buscá tu Universidad"
                className="w-full h-14 rounded-full px-6 py-3 pr-12 text-lg font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm.trim() && setIsDropdownVisible(true)} // Show dropdown on focus if term exists
              />
              {/* Search Icon Button (keep as before) */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                aria-label="Search"
              >
                <SearchIcon className="h-6 w-6" />
              </Button>
            </div>

            {/* --- Dropdown Menu (logic slightly adjusted for empty term) --- */}
            {isDropdownVisible && searchTerm.trim() && ( // Only show if visible AND term exists
              <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                {isSearchLoading ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Loading...
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
                          console.log("Selected University:", uni);
                        }}
                      >
                        {uni.name}
                      </li>
                    ))}
                  </ul>
                ) : ( // Show "No results" only if not loading and results are empty
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No results found.
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
