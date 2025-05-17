"use client";

import { useState } from "react";
import CreateButton from "@/components/admin/CreateButton";
import CreateCareerModal from "@/components/admin/CreateCareerModal";
import { CreateButtonProps } from "@/app/types";

export default function CreateCareerButton({ universitySlug, onCreated }: CreateButtonProps) {
  const [showCreateCareer, setShowCreateCareer] = useState(false);

  const handleCreated = () => {
    setShowCreateCareer(false);
    onCreated?.();
  };

  return (
    <>
      <CreateButton
        allowedRoles={["admin"]}
        onClick={() => setShowCreateCareer(true)}
      >
        Crear Carrera
      </CreateButton>
      <CreateCareerModal
        open={showCreateCareer}
        onOpenChange={setShowCreateCareer}
        universitySlug={universitySlug}
        onCreated={handleCreated}
      />
    </>
  );
} 