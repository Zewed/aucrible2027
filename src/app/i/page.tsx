import { Importer } from "@/components/Importer";
import "@/app/appareil/appareil.css";

/** L'adresse d'un transfert (`/i#…`) : les réponses sont après le #, que le serveur ne reçoit jamais. */
export default function PageImport() {
  return <Importer />;
}
