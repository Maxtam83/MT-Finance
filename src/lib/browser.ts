/**
 * Navigation avec rechargement complet : le cache de navigation côté client est
 * vidé, ce qui est nécessaire quand la session change.
 */
export function reloadTo(path: string): void {
  window.location.assign(path);
}
