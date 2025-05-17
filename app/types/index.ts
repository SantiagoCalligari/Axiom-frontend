// Tipos base
export interface BaseEntity {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Tipos de entidades
export interface University extends BaseEntity {
  careers: Career[];
}

export interface Career extends BaseEntity {
  university_id: number;
  subjects: Subject[];
  university?: University;
}

export interface Subject extends BaseEntity {
  career_id: number;
  pivot?: {
    user_id: number;
    subject_id: number;
  };
  career?: Career;
}

// Tipos de respuesta de la API
export interface ApiResponse<T> {
  data: T;
}

// Tipos para breadcrumbs
export interface BreadcrumbItem {
  label: string;
  href: string;
}

// Tipos para props de componentes
export interface CreateButtonProps {
  universitySlug: string;
  careerSlug?: string;
  onCreated?: () => void;
} 