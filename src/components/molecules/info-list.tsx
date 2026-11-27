import type { ReactNode } from "react";

export interface InfoItem {
  term: string;
  value: ReactNode;
}

/** Liste de couples « libellé / valeur ». */
export function InfoList({ items }: { items: readonly InfoItem[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
      {items.map(({ term, value }) => (
        <div key={term} className="contents">
          <dt className="text-muted-foreground">{term}</dt>
          <dd className="min-w-0 truncate font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
