// Fuseau fixé : le rendu est identique sur le serveur et dans le navigateur.
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

/** Date longue en français, par exemple « 27 novembre 2026 ». */
export function formatDate(date: Date): string {
  return DATE_FORMAT.format(date);
}
