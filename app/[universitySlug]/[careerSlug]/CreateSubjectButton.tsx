"use client";

import { useState } from "react";
import CreateButton from "@/components/admin/CreateButton";
import CreateSubjectModal from "@/components/admin/CreateSubjectModal";
import { CreateButtonProps } from "@/app/types";

export default function CreateSubjectButton({ universitySlug, careerSlug, onCreated }: CreateButtonProps) {
  const [showCreateSubject, setShowCreateSubject] = useState(false);

  const handleCreated = () => {
    setShowCreateSubject(false);
    onCreated?.();
  };

  return (
    <>
      <CreateButton
        allowedRoles={["admin", "teacher"]}
        onClick={() => setShowCreateSubject(true)}
      >
        Crear Materia
      </CreateButton>
      <CreateSubjectModal
        open={showCreateSubject}
        onOpenChange={setShowCreateSubject}
        universitySlug={universitySlug}
        careerSlug={careerSlug!}
        onCreated={handleCreated}
      />
    </>
  );
} 