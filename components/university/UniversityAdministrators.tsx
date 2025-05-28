"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UniversityAdministratorsProps {
  administrators: { id: number; name: string; email: string }[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UniversityAdministrators({ administrators }: UniversityAdministratorsProps) {
  if (!administrators.length) return null;

  return (
    <div className="mt-12 flex flex-col items-center">
      <div className="mb-2 text-sm font-semibold text-muted-foreground tracking-wide">
        Administradores
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {administrators.map((admin) => (
          <div
            key={admin.id}
            className="flex flex-col items-center px-2"
            style={{ minWidth: 70 }}
          >
            <Avatar className="w-8 h-8 mb-1">
              <AvatarFallback>
                {getInitials(admin.name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs font-medium text-blue-900 text-center max-w-[6rem] truncate" title={admin.name}>
              {admin.name}
            </div>
            <a
              href={`mailto:${admin.email}`}
              className="text-[10px] text-blue-700 text-center max-w-[6rem] truncate underline hover:text-blue-900"
              title={admin.email}
            >
              {admin.email}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
