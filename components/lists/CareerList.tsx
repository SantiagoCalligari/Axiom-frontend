// components/lists/CareerList.tsx
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Importar useRouter

// Interfaz Career (se mantiene igual)
interface Career {
  id: number;
  name: string;
  slug: string;
}

interface CareerListProps {
  careers: Career[];
  universitySlug: string;
}

export function CareerList({ careers, universitySlug }: CareerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter(); // Inicializar el router

  const filteredCareers = useMemo(() => {
    if (!searchTerm) return careers;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return careers.filter(career =>
      career.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [careers, searchTerm]);

  // --- Función para manejar la precarga ---
  const handlePrefetchCareer = (careerSlug: string) => {
    const href = `/${universitySlug}/${careerSlug}`;
    // Usar router.prefetch para iniciar la carga de la página y sus datos
    router.prefetch(href);
    console.log(`Prefetching: ${href}`); // Opcional: para depuración
  };

  return (
    <div className="space-y-6">
      {/* Barra de Búsqueda de Carreras */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar carrera dentro de esta universidad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 w-full md:w-1/2 lg:w-1/3"
        />
      </div>

      {/* Lista de Carreras Filtrada */}
      {filteredCareers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCareers.map((career) => (
            <Link
              key={career.id}
              href={`/${universitySlug}/${career.slug}`}
              passHref
              className="block hover:shadow-md transition-shadow duration-200 rounded-lg"
              // --- Añadir manejadores de eventos para prefetch ---
              onMouseEnter={() => handlePrefetchCareer(career.slug)}
              onFocus={() => handlePrefetchCareer(career.slug)}
            // ----------------------------------------------------
            >
              <Card className="h-full flex flex-col hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">{career.name}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-4">
          {searchTerm
            ? `No se encontraron carreras que coincidan con "${searchTerm}".`
            : 'No hay carreras para mostrar.'}
        </p>
      )}
    </div>
  );
}
