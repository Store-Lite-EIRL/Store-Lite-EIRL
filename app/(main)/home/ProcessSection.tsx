export default function ProcessSection() {
  const steps = [
    {
      number: '01',
      icon: 'bolt',
      eyebrow: 'ARRANCÁ',
      title: 'Tu cuenta en 30 segundos',
      description:
        'Entrá con Google. Sin formularios largos ni verificación complicate. Listo para usar.',
      highlight: 'fast',
    },
    {
      number: '02',
      icon: 'storefront',
      eyebrow: 'TU MARCA',
      title: 'Tu tienda, tu estilo',
      description:
        'Subí tu logo, elegí colores y cargá tu catálogo. Tus productos online en minutos.',
      highlight: 'style',
    },
    {
      number: '03',
      icon: 'campaign',
      eyebrow: 'VENDÉ',
      title: 'Compartí y empezá a vender',
      description:
        'Tu link listo. Integralo con Instagram o compartilo directo. Tus clientes compran sin fricción.',
      highlight: 'sell',
    },
    {
      number: '04',
      icon: 'account_balance_wallet',
      eyebrow: 'COBRÁ',
      title: 'Pagos seguros con Culqi',
      description:
        'El comprador paga. El dinero se retiene seguro. Entregamos al vendedor. Vos cobrás tu comisión.',
      highlight: 'money',
    },
  ];

  return (
    <section className="landing-section" id="proceso">
      <div className="section-container">
        <div className="section-heading">
          <span className="section-eyebrow">Proceso</span>
          <h2 className="section-title-landing">Tu tienda online en 4 pasos</h2>
          <p className="section-description">
            Arrancá minutos. Olvidate dePapers. Vos vendé, que nosotros nos encargamos del resto.
          </p>
        </div>

        <div className="process-steps-flow">
          {steps.map((step, index) => (
            <article className={`process-step-card ${step.highlight}`} key={step.number}>
              <div className="process-step-connector">
                <span className="process-step-number">{step.number}</span>
                {index < steps.length - 1 && <div className="process-step-line" />}
              </div>

              <div className="process-step-content">
                <span className="process-step-eyebrow">{step.eyebrow}</span>
                <div className="process-step-icon-wrapper">
                  <span className="material-symbols-outlined process-step-icon">{step.icon}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="process-bottom-cta">
          <p className="process-trust-note">
            <span className="material-symbols-outlined">verified</span>
            Pagos protegidos con Culqi · Configuración gratis · Sin permanence
          </p>
        </div>
      </div>
    </section>
  );
}
