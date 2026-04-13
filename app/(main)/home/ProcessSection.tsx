export default function ProcessSection() {
  const steps = [
    {
      number: '01',
      title: 'Creá tu acceso',
      description: 'Entrás con Google y evitás formularios eternos que nadie quiere completar.',
    },
    {
      number: '02',
      title: 'Configurá tu negocio',
      description: 'Definís identidad, catálogo y estructura base con foco en salir rápido.',
    },
    {
      number: '03',
      title: 'Publicá y validá',
      description: 'Mostrás tu tienda, revisás la experiencia y corregís antes de escalar tráfico.',
    },
    {
      number: '04',
      title: 'Operá con confianza',
      description: 'Gestionás pedidos y evolución del negocio sobre una base más ordenada.',
    },
  ];

  return (
    <section className="landing-section" id="proceso">
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">Proceso</span>
          <h2 className="section-title-landing">Menos fricción, más foco en ejecutar</h2>
          <p className="section-description">
            No alcanza con decir “es fácil”. Hay que mostrar el recorrido. Esta sección ahora lo
            hace con pasos concretos y entendibles.
          </p>
        </div>

        <div className="process-grid">
          {steps.map((step) => (
            <article className="process-card" key={step.number}>
              <span className="process-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
