/**
 * La place de la page pendant que son contenu arrive du serveur : un écran vide, pour que le pied de page reste en bas
 * au lieu de s'afficher sous l'en-tête puis de sauter quand la page apparaît.
 */
export function PageEnAttente() {
  return <div className="page-en-attente" />;
}
