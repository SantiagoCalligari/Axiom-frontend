import { Fleur_De_Leah } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchBar } from "@/components/ui/SearchBar";
import { LoginModal } from "@/components/auth/LoginModal";

// Initialize the font
const fleur = Fleur_De_Leah({ weight: "400", subsets: ["latin"] });

function SearchIcon(props) {
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
  )
}

export default function Home() {
  return (
    // Main container: full height, relative positioning, light gray background
    <div className="relative flex min-h-screen flex-col bg-gray-200">
      <div className="absolute top-4 right-4 flex gap-x-3 p-4 sm:top-6 sm:right-6">
        <LoginModal></LoginModal>
        <Button>Registrate</Button>
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="flex w-full flex-col items-center text-center mb-16 sm:mb-20">
          <h1
            className={`mb-1 text-8xl font-medium text-blue-700 sm:text-9xl ${fleur.className}`}
          >
            Axiom
          </h1>

          <p
            className={`mb-6 text-lg text-gray-600 sm:text-xl ${fleur.className}`}
          >
            Por estudiantes, Para estudiantes
          </p>

          <div className="w-full max-w-2xl px-4 md:px-0">
            <div className="relative flex items-center">
              <Input
                type="search"
                placeholder="Buscá tu Universidad"
                className="w-full h-14 px-6 py-3 text-lg font-medium rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-400"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <SearchIcon className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
