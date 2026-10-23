import { dateLisible } from "@/lib/date";

/** « Question n° 24 », suivi de la date sur grand écran. */
export function NumeroQuestion({ numero, date, avecJour }: { numero: number; date: string; avecJour: boolean }) {
  return (
    <span className="qnum">
      Question n° {numero}
      <span className="wide"> · {dateLisible(date, avecJour)}</span>
    </span>
  );
}
