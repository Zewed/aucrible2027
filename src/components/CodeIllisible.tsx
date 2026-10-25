/** L'encadré « si le code n'est pas valide » de maquettes/appareil.html : rien n'est importé, rien n'est remplacé. */
export function CodeIllisible() {
  return (
    <div className="case">
      <div className="case-box bad theme-sante" role="alert">
        <div className="case-head">
          <span className="case-ico" aria-hidden="true">
            <svg className="ic" viewBox="0 0 24 24">
              <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14l6 6M20 14l-6 6" />
            </svg>
          </span>
          <p className="case-msg">Ce code n&apos;est pas lisible. Réessaie ou colle le lien.</p>
        </div>
      </div>
    </div>
  );
}
