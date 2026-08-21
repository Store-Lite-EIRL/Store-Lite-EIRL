export default function TrustSection() {
  const badges = [
    {
      icon: 'lock',
      title: 'Datos seguros',
      description: 'Encriptación SSL y almacenamiento seguro',
    },
    {
      icon: 'gavel',
      title: 'Legalizado',
      description: 'Cumple con normativas SUNAT',
    },
    {
      icon: 'credit_card',
      title: 'Pagos seguros',
      description: 'Procesado por Culqi (PCI DSS)',
    },
    {
      icon: 'restore',
      title: 'Sin permanencia',
      description: 'Cancela cuando quieras',
    },
  ];

  return (
    <section className="landing-section" id="trust">
      <div className="section-container">
        <div className="trust-content">
          <div className="trust-text">
            <h3>Confía tranquilo</h3>
            <p>
              Tu negocio y tus clientes están protegidos. Usamos estándares de seguridad bancarios y
              cumplimos con la ley.
            </p>
          </div>

          <div className="trust-badges">
            {badges.map((badge) => (
              <div className="trust-badge" key={badge.title}>
                <span className="material-symbols-outlined trust-icon">{badge.icon}</span>
                <div className="trust-info">
                  <strong>{badge.title}</strong>
                  <span>{badge.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
