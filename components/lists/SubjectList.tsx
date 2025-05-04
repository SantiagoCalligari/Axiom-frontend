"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Importar useRouter

// Interfaz Subject (se mantiene igual)
interface Subject {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

interface SubjectListProps {
  subjects: Subject[];
  universitySlug: string;
  careerSlug: string;
}

export function SubjectList({ subjects, universitySlug, careerSlug }: SubjectListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter(); // Inicializar el router

  const filteredSubjects = useMemo(() => {
    if (!searchTerm) return subjects;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return subjects.filter(subject =>
      subject.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [subjects, searchTerm]);

  // --- Función para manejar la precarga ---
  const handlePrefetchSubject = (subjectSlug: string) => {
    const href = `/${universitySlug}/${careerSlug}/${subjectSlug}`;
    // Usar router.prefetch para iniciar la carga de la página y sus datos
    router.prefetch(href);
    console.log(`Prefetching: ${href}`); // Opcional: para depuración
  };

  return (
    <div className="space-y-6">
      {/* Barra de Búsqueda de Materias */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar materia dentro de esta carrera..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 w-full md:w-1/2 lg:w-1/3"
        />
      </div>

      {/* Lista de Materias Filtrada */}
      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/${universitySlug}/${careerSlug}/${subject.slug}`}
              passHref
              className="block hover:shadow-md transition-shadow duration-200 rounded-lg"
              // --- Añadir manejadores de eventos para prefetch ---
              onMouseEnter={() => handlePrefetchSubject(subject.slug)}
              onFocus={() => handlePrefetchSubject(subject.slug)}
            // ----------------------------------------------------
            >
              <Card className="h-full flex flex-col hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  {subject.description && <CardDescription className="line-clamp-2">{subject.description}</CardDescription>}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-4">
          {searchTerm
            ? `No se encontraron materias que coincidan con "${searchTerm}".`
            : 'No hay materias para mostrar.'}
        </p>
      )}
    </div>
  );
}
