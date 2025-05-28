// components/university/UniversityAdminActions.tsx

"use client";

import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddCareerModal from "./AddCareerModal";
import EditUniversityModal from "./EditUniversityModal";

interface UniversityAdminActionsProps {
  universityId: number;
  universitySlug: string;
  universityName: string;
  universityDescription: string | null;
  administrators: { id: number; name: string; email: string }[];
  onCareerAdded: (career: { id: number; name: string; slug: string }) => void;
}

export function UniversityAdminActions({
  universityId,
  universitySlug,
  universityName,
  universityDescription,
  administrators,
  onCareerAdded,
}: UniversityAdminActionsProps) {
  const { user, token } = useAuth();
  const [showAddCareer, setShowAddCareer] = useState(false);
  const [showEditUniversity, setShowEditUniversity] = useState(false);

  // Check if the current user is an admin of this university
  const isAdmin = !!user?.admin_universities?.some(
    (u) => u.id === universityId
  );

  return (
    <>
      {isAdmin && (
        <div className="flex gap-2 mb-8">
          <Button variant="default" onClick={() => setShowAddCareer(true)}>
            Agregar Carrera
          </Button>
          <Button variant="outline" onClick={() => setShowEditUniversity(true)}>
            Editar Universidad
          </Button>
        </div>
      )}
      <AddCareerModal
        open={showAddCareer}
        onOpenChange={setShowAddCareer}
        universitySlug={universitySlug}
        token={token}
        onCareerAdded={onCareerAdded}
      />
      <EditUniversityModal
        open={showEditUniversity}
        onOpenChange={setShowEditUniversity}
        universitySlug={universitySlug}
        universityName={universityName}
        universityDescription={universityDescription}
        token={token}
      />
    </>
  );
}
