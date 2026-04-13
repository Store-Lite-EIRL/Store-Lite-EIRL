import Link from 'next/link';

export default function SolutionsSection() {
  const solutions = [
    {
      icon: 'storefront',
      title: 'Tu tienda lista para mostrar',
      description:
        'Una presencia visual consistente para que tu marca se vea seria, moderna y confiable.',
    },
    {
      icon: 'inventory_2',
      title: 'Gestión sin fricción',
      description: 'Organizá productos, catálogo y operación diaria sin saltar entre herramientas.',
    },
    {
      icon: 'monitoring',
      title: 'Decisiones con contexto',
      description: 'Leé señales del negocio y enfocate en vender mejor, no en adivinar qué pasa.',
    },
  ];

  return (
    <section className="landing-section" id="soluciones">
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">Soluciones</span>
          <h2 className="section-title-landing">Lo importante: vender, ordenar y crecer</h2>
          <p className="section-description">
            La landing anterior había quedado en modo placeholder. Eso mata credibilidad. Acá la
            volvemos a una narrativa clara, con propuesta de valor real y jerarquía visual fuerte.
          </p>
        </div>

        <div className="feature-grid">
          {solutions.map((solution) => (
            <article className="feature-card" key={solution.title}>
              <div className="feature-icon">
                <span className="material-symbols-outlined">{solution.icon}</span>
              </div>
              <h3>{solution.title}</h3>
              <p>{solution.description}</p>
            </article>
          ))}
        </div>

        <div className="spotlight-card">
          <div>
            <span className="spotlight-label">Diseñado para negocios que quieren verse pro</span>
            <h3>Una experiencia más consistente entre la landing y auth</h3>
            <p>
              Mismo lenguaje visual, mismos contrastes, misma sensación de producto cuidado. Así se
              construye marca, hermano.
            </p>
          </div>
          <Link href="/auth" className="btn-secondary-ghost">
            Probar acceso
          </Link>
        </div>
      </div>
    </section>
  );
}
