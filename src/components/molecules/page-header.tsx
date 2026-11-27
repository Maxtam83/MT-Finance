export interface PageHeaderProps {
  title: string;
  description: string;
}

/** Titre principal d'une page et sa phrase d'introduction. */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-8 md:mb-10">
      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
      <p className="mt-2 text-base text-muted-foreground md:text-lg">{description}</p>
    </header>
  );
}
