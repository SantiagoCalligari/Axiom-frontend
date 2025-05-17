import { University, Career, Subject, ApiResponse } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('API_URL no está configurada en las variables de entorno');
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
    next: { revalidate: 3600 }, // Revalidar cada hora
  });

  if (response.status === 404) return null as T;
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const result: ApiResponse<T> = await response.json();
  return result.data;
}

export async function getUniversity(slug: string): Promise<University | null> {
  try {
    return await fetchApi<University>(`/api/university/${slug}`);
  } catch (error) {
    console.error('Error fetching university:', error);
    return null;
  }
}

export async function getCareer(universitySlug: string, careerSlug: string): Promise<Career | null> {
  try {
    return await fetchApi<Career>(`/api/university/${universitySlug}/career/${careerSlug}`);
  } catch (error) {
    console.error('Error fetching career:', error);
    return null;
  }
}

export async function getSubject(
  universitySlug: string, 
  careerSlug: string, 
  subjectSlug: string
): Promise<Subject | null> {
  try {
    return await fetchApi<Subject>(
      `/api/university/${universitySlug}/career/${careerSlug}/subject/${subjectSlug}`
    );
  } catch (error) {
    console.error('Error fetching subject:', error);
    return null;
  }
}

export async function createUniversity(data: { name: string; description?: string }): Promise<University> {
  return fetchApi<University>('/api/universities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createCareer(
  universitySlug: string,
  data: { name: string; description?: string }
): Promise<Career> {
  return fetchApi<Career>(`/api/university/${universitySlug}/careers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createSubject(
  universitySlug: string,
  careerSlug: string,
  data: { name: string; description?: string }
): Promise<Subject> {
  return fetchApi<Subject>(
    `/api/university/${universitySlug}/career/${careerSlug}/subjects`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
} 