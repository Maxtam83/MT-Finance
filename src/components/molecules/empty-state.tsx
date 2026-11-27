/** Message affiché quand une section n'a encore rien à montrer. */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass rounded-3xl px-6 py-16 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
