// components/ui/Breadcrumbs.tsx
import Link from 'next/link';
import { Fragment } from 'react'; // Para el separador
import { ChevronRight } from 'lucide-react'; // Icono separador
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-2 sm:mb-4">
      <ol className="flex items-center space-x-1 text-xs sm:text-sm text-muted-foreground overflow-x-auto whitespace-nowrap pb-1 scrollbar-none">
        {items.map((item, index) => (
          <Fragment key={item.href}>
            <li className="flex-shrink-0">
              {index < items.length - 1 ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {index === 0 ? item.label : truncateText(item.label, 15)}
                </Link>
              ) : (
                // Último item (página actual), no es un enlace
                <span 
                  className="font-medium text-foreground" 
                  aria-current="page"
                >
                  {truncateText(item.label, 25)}
                </span>
              )}
            </li>
            {/* Añadir separador si no es el último item */}
            {index < items.length - 1 && (
              <li aria-hidden="true" className="flex-shrink-0">
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

