// components/lists/ExamList.tsx
"use client";

import React, { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ArrowUp, ArrowDown, Check, X, RotateCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// --- Interfaces ---
interface Exam {
  id: number;
  title: string;
  professor_name: string | null;
  semester: string | null;
  year: number | null;
  is_resolved: boolean;
  exam_type: string | null;
  exam_date: string | null;
  download_url: string;
  created_at: string;
}
interface PaginationMeta {
  current_page: number; from: number | null; last_page: number;
  links: { url: string | null; label: string; active: boolean }[];
  path: string; per_page: number; to: number | null; total: number;
}
interface PaginatedExamsResponse { data: Exam[]; links: any; meta: PaginationMeta; }

interface ExamListProps {
  universitySlug: string;
  careerSlug: string;
  subjectSlug: string;
}

const sortOptions = [
  { value: 'exam_date', label: 'Fecha Examen' },
  { value: 'title', label: 'Título' },
  { value: 'professor_name', label: 'Profesor' },
  { value: 'year', label: 'Año' },
  { value: 'created_at', label: 'Subido' },
];

// --- Traducción de tipos de examen ---
function getExamTypeLabel(type: string | null) {
  if (!type) return "";
  switch (type.toLowerCase()) {
    case "midterm":
      return "Parcial";
    case "retake":
      return "Recuperatorio";
    case "final":
      return "Final";
    default:
      return type;
  }
}

export function ExamList({ universitySlug, careerSlug, subjectSlug }: ExamListProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Estados de Filtro y Orden
  const [professorFilter, setProfessorFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState<null | boolean>(null);
  const [sortBy, setSortBy] = useState('exam_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // --- Fetch ---
  const fetchExams = useCallback(async (page = 1) => {
    setIsLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) { toast.error("URL API no configurada."); setIsLoading(false); return; }
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (professorFilter) params.set('professor', professorFilter);
    if (semesterFilter) params.set('semester', semesterFilter);
    if (resolvedFilter !== null) params.set('is_resolved', String(resolvedFilter));
    params.set('sort_by', sortBy);
    params.set('sort_order', sortOrder);
    const endpoint = `${apiUrl}/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}/exams?${params.toString()}`;
    try {
      const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const result: PaginatedExamsResponse = await response.json();
      setExams(result.data || []);
      setPaginationMeta(result.meta || null);
      setCurrentPage(result.meta?.current_page || 1);
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast.error(error instanceof Error ? error.message : "Error al cargar exámenes.");
      setExams([]); setPaginationMeta(null);
    } finally { setIsLoading(false); }
  }, [universitySlug, careerSlug, subjectSlug, professorFilter, semesterFilter, resolvedFilter, sortBy, sortOrder]);

  useEffect(() => { fetchExams(currentPage); }, [fetchExams, currentPage]);

  // --- Handlers ---
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    startTransition(() => { setter(value); setCurrentPage(1); });
  };
  const handleProfessorChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange(setProfessorFilter, e.target.value);
  const handleSemesterChange = (value: string) => handleFilterChange(setSemesterFilter, value);
  const handleResolvedChange = (value: string) => {
    if (value === "") handleFilterChange(setResolvedFilter, null);
    else if (value === "resueltos") handleFilterChange(setResolvedFilter, true);
    else handleFilterChange(setResolvedFilter, false);
  };
  const handleSortByChange = (value: string) => handleFilterChange(setSortBy, value);
  const handleSortOrderChange = () => handleFilterChange(setSortOrder, (prev: 'asc' | 'desc') => prev === 'asc' ? 'desc' : 'asc');
  const handleResetFilters = () => {
    startTransition(() => {
      setProfessorFilter(''); setSemesterFilter(''); setResolvedFilter(null);
      setSortBy('exam_date'); setSortOrder('desc'); setCurrentPage(1);
    });
  };
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (paginationMeta?.last_page || 1)) {
      startTransition(() => { setCurrentPage(newPage); });
    }
  };

  // --- Paginación ---
  const paginationItems = useMemo(() => {
    if (!paginationMeta || paginationMeta.last_page <= 1) return null;
    const items: any = []; const totalPages = paginationMeta.last_page; const currentPageNum = paginationMeta.current_page;
    const pagesToShow = new Set<number>(); pagesToShow.add(1); pagesToShow.add(totalPages); pagesToShow.add(currentPageNum);
    if (currentPageNum > 1) pagesToShow.add(currentPageNum - 1); if (currentPageNum < totalPages) pagesToShow.add(currentPageNum + 1);
    let lastAddedPage = 0;
    Array.from(pagesToShow).sort((a, b) => a - b).forEach(page => {
      if (page > lastAddedPage + 1) items.push(<PaginationEllipsis key={`ellipsis-${lastAddedPage}`} />);
      items.push(
        <PaginationItem key={page}>
          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(page); }} isActive={currentPageNum === page} aria-current={currentPageNum === page ? 'page' : undefined}>
            {page}
          </PaginationLink>
        </PaginationItem>
      ); lastAddedPage = page;
    }); return items;
  }, [paginationMeta, currentPage]);

  return (
    <div className="space-y-4" id="exam-list-section">

      {/* --- Toolbar de Filtros y Orden --- */}
      <div className="w-full border rounded-lg bg-muted/40 p-4">
        <form
          className="
      flex flex-col gap-4
      md:flex-row md:items-end md:gap-4
      w-full
    "
          onSubmit={e => e.preventDefault()}
        >
          {/* Filtros principales */}
          <div className="flex flex-col gap-4 flex-1 md:flex-row md:gap-4">
            {/* Profesor */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <Label htmlFor="prof-filter" className="text-xs font-medium">Profesor</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="prof-filter"
                  placeholder="Buscar profesor..."
                  value={professorFilter}
                  onChange={handleProfessorChange}
                  className="pl-8 h-9 text-sm w-full"
                />
              </div>
            </div>
            {/* Cuatrimestre */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <Label htmlFor="sem-filter" className="text-xs font-medium">Cuatrimestre</Label>
              <Select value={semesterFilter} onValueChange={handleSemesterChange}>
                <SelectTrigger id="sem-filter" className="h-9 text-sm w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1C">1° cuatrimestre</SelectItem>
                  <SelectItem value="2C">2° cuatrimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Resuelto */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <Label htmlFor="res-filter" className="text-xs font-medium">Resuelto</Label>
              <Select
                value={
                  resolvedFilter === null
                    ? ""
                    : resolvedFilter === true
                      ? "resueltos"
                      : "no-resueltos"
                }
                onValueChange={handleResolvedChange}
              >
                <SelectTrigger id="res-filter" className="h-9 text-sm w-full">
                  <SelectValue
                    placeholder="Todos"
                    defaultValue={
                      resolvedFilter === null
                        ? "Todos"
                        : resolvedFilter
                          ? "Solo resueltos"
                          : "Solo no resueltos"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resueltos">Solo resueltos</SelectItem>
                  <SelectItem value="no-resueltos">Solo no resueltos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Ordenar por */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <Label htmlFor="sort-by" className="text-xs font-medium">Ordenar por</Label>
              <div className="flex gap-2 w-full">
                <Select value={sortBy} onValueChange={handleSortByChange}>
                  <SelectTrigger id="sort-by" className="h-9 text-sm w-full">
                    <SelectValue placeholder="Ordenar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {/* Flecha y X, siempre a la derecha */}
          <div className="flex flex-row gap-2 justify-end items-end md:flex-col md:justify-end md:items-end">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSortOrderChange}
              className="h-9 w-9 min-w-0 flex-shrink-0 border"
              aria-label={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
              title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
              type="button"
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetFilters}
              disabled={isLoading || isPending}
              className="h-9 w-9 min-w-0"
              aria-label="Limpiar filtros"
              type="button"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>

      {/* --- Cards de Exámenes (NO TOCAR) --- */}
      <div className="relative border rounded-md">
        {(isLoading || isPending) && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10 rounded-md backdrop-blur-sm">
            <RotateCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <div className={(isLoading || isPending) ? 'opacity-50 transition-opacity' : ''}>
          <div className="grid gap-2 p-2">
            {!isLoading && exams.length === 0 ? (
              <div className="h-24 text-center text-muted-foreground flex items-center justify-center">
                No se encontraron exámenes.
              </div>
            ) : (
              exams.map((exam) => (
                <Link
                  key={exam.id}
                  href={`/${universitySlug}/${careerSlug}/${subjectSlug}/${exam.id}`}
                  className={`block p-3 rounded-lg border transition-colors hover:bg-accent/50 ${exam.is_resolved
                    ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                    : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
                    }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-grow">
                      <h3 className="font-medium text-base sm:text-lg">
                        {exam.title || `Examen #${exam.id}`}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                        {exam.professor_name && (
                          <span>Prof: {exam.professor_name}</span>
                        )}
                        {exam.exam_type && (
                          <Badge variant="secondary" className="text-xs">
                            {getExamTypeLabel(exam.exam_type)}
                          </Badge>
                        )}
                        <span>
                          {exam.exam_date
                            ? new Date(exam.exam_date).toLocaleDateString('es-ES')
                            : `${exam.year || ''} ${exam.semester || ''}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={exam.is_resolved ? "default" : "outline"}
                        className={exam.is_resolved
                          ? "border-green-600 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                          : "border-red-600 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                        }
                      >
                        {exam.is_resolved ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <X className="h-3 w-3 mr-1" />
                        )}
                        {exam.is_resolved ? "Resuelto" : "No Resuelto"}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- Controles de Paginación y Conteo --- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-sm text-muted-foreground">
          {paginationMeta && paginationMeta.total > 0
            ? `Mostrando ${paginationMeta.from}-${paginationMeta.to} de ${paginationMeta.total} exámenes.`
            : 'No hay exámenes para mostrar.'
          }
        </div>
        {paginationMeta && paginationMeta.last_page > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} aria-disabled={currentPage <= 1} tabIndex={currentPage <= 1 ? -1 : undefined} className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined} /></PaginationItem>
              {paginationItems}
              <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} aria-disabled={currentPage >= paginationMeta.last_page} tabIndex={currentPage >= paginationMeta.last_page ? -1 : undefined} className={currentPage >= paginationMeta.last_page ? "pointer-events-none opacity-50" : undefined} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
