// components/comments/FileCard.tsx

import { Button } from "@/components/ui/button";
import { Paperclip, X } from "lucide-react";

interface FileCardProps {
  file: File;
  onRemove: () => void;
}

export function FileCard({ file, onRemove }: FileCardProps) {
  return (
    <div className="flex items-center gap-2 bg-muted border rounded px-3 py-2 shadow-sm">
      <Paperclip className="h-4 w-4 text-muted-foreground" />
      <span className="truncate max-w-[120px] text-xs">{file.name}</span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={onRemove}
        aria-label="Quitar archivo"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
