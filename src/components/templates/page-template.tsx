import type { ReactNode } from "react";
import { PageHeader } from "@/components/molecules/page-header";
import type { PageHeaderProps } from "@/components/molecules/page-header";

/** Structure commune d'une page : en-tête puis contenu. */
export function PageTemplate({ children, ...header }: PageHeaderProps & { children: ReactNode }) {
  return (
    <>
      <PageHeader {...header} />
      {children}
    </>
  );
}
