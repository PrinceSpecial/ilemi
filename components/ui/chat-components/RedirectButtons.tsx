import React from 'react';
import { ExternalLink } from 'lucide-react';

interface RedirectButton {
  id: string;
  label: string;
  link: string;
}

interface RedirectButtonsProps {
  title?: string;
  buttons: RedirectButton[];
}

export function RedirectButtons({ buttons }: RedirectButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((button) => (
        <a
          key={button.id}
          href={button.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-start gap-2 rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 has-[>svg]:px-3 !no-underline"
        >
          <ExternalLink className="h-4 w-4" />
          {button.label}
        </a>
      ))}
    </div>
  );
}