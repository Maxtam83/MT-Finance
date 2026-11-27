/** Titre d'une section à l'intérieur d'une page. */
export function SectionTitle({ title }: { title: string }) {
  return <h2 className="mb-4 text-xl font-semibold tracking-tight">{title}</h2>;
}
