// app/[universitySlug]/ClientUniversityPage.tsx

"use client";

import { useState } from "react";
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BackButton } from '@/components/ui/BackButton';
import { UniversityAdminActions } from '@/components/university/UniversityAdminActions';
import { UniversityAdministrators } from '@/components/university/UniversityAdministrators';
import { CareerList } from '@/components/lists/CareerList';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";


interface ClientUniversityPageProps {
  universityData: any;
  breadcrumbItems: { label: string; href: string }[];
}

export default function ClientUniversityPage({
  universityData,
  breadcrumbItems,
}: ClientUniversityPageProps) {
  const [careers, setCareers] = useState(universityData.careers || []);

  const handleCareerAdded = (career: any) => {
    setCareers((prev: any) => [...prev, career]);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* ...igual que antes... */}
      <div className="mb-6 flex items-start justify-between">
        <div className='flex-grow pr-4'>
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-3xl md:text-4xl font-bold mt-1">{universityData.name}</h1>
        </div>
        <div className="flex-shrink-0">
          <BackButton />
        </div>
      </div>

      <UniversityAdminActions
        universityId={universityData.id}
        universitySlug={universityData.slug}
        universityName={universityData.name}
        universityDescription={universityData.description}
        administrators={universityData.administrators || []}
        onCareerAdded={handleCareerAdded}
      />

      {universityData.description && (
        <Card className="mb-8 bg-muted/30 border">
          <CardHeader>
            <CardTitle className="text-lg">Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{universityData.description}</p>
          </CardContent>
        </Card>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold border-b pb-2">Carreras Ofrecidas</h2>
        </div>
        <CareerList
          careers={careers}
          universitySlug={universityData.slug}
        />
      </section>

      <UniversityAdministrators administrators={universityData.administrators || []} />
    </div>
  );
}
