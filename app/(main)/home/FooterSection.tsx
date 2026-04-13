import Link from 'next/link';

export default function FooterSection() {
  return (
    <footer className="landing-footer" id="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="section-eyebrow">Store.Lite</span>
          <strong>Una base más seria para vender online</strong>
          <p>
            Si la primera impresión se ve improvisada, el producto pierde confianza. Este footer
            ahora cierra la historia con claridad y CTA reales.
          </p>
        </div>
        <div className="footer-links-grid">
          <div>
            <h4>Producto</h4>
            <Link href="/pricing">Planes</Link>
            <Link href="/auth">Acceder</Link>
          </div>
          <div>
            <h4>Recursos</h4>
            <a href="#soluciones">Soluciones</a>
            <a href="#proceso">Proceso</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Store.Lite. Todos los derechos reservados.</p>
          <Link href="/auth">Crear mi tienda</Link>
        </div>
      </div>
    </footer>
  );
}
