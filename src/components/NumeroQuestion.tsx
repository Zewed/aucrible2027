/** « Question n° 24 ». Sa date de parution n'est plus affichée : toutes les questions se jouent d'un coup. */
export function NumeroQuestion({ numero }: { numero: number }) {
  return <span className="qnum">Question n° {numero}</span>;
}
