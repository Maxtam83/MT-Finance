import type { ReactNode } from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { IconTile } from "@/components/atoms/icon-tile";

interface CardHeadingProps {
  icon: ReactNode;
  title: string;
  description: string;
}

/** En-tête de carte : icône, titre et description. */
export function CardHeading({ icon, title, description }: CardHeadingProps) {
  return (
    <CardHeader className="flex items-center gap-4">
      <IconTile>{icon}</IconTile>
      <div className="min-w-0">
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
    </CardHeader>
  );
}
