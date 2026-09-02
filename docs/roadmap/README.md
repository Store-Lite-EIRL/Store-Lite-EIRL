# Roadmap de Negocio — Planes Futuros

> Carpeta que centraliza las ideas de **modelo de negocio y features premium** para
> evaluar a futuro. No son compromisos de implementación: son oportunidades
> registradas para no olvidarlas. Cada archivo describe el _qué_, el _por qué_,
> el _costo/viabilidad_ y el _plan sugerido_.

## Índice

| Archivo                                                  | Feature                                                                               | Estado | Prioridad            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------ | -------------------- |
| [custom-domains-premium.md](./custom-domains-premium.md) | Dominio propio por seller (`mitienda.com`) como tier premium                          | Idea   | Alta (diferenciador) |
| [seo-competitivo.md](./seo-competitivo.md)               | SEO competitivo / de crecimiento como add-on pago                                     | Idea   | Alta                 |
| —                                                        | Otros (ver `docs/ROADMAP_FINANCIERO.md` para Split Payments, Facturación SUNAT, etc.) | —      | —                    |

---

## Cómo se relaciona con el modelo actual

El SaaS de Store Lite vende **"tené tu negocio"** (gestión, catálogo, ventas,
órdenes), **no SEO**. El SEO aparece en dos capas distintas que **no deben
confundirse**:

1. **Higiene técnica SEO** (canonical, sitemap, JSON-LD, OG images, SSR):
   piso de calidad que beneficia a **todos** los sellers. **No se cobra**,
   se hace bien en el core — si no, la plataforma se ve rota y Google castiga
   la reputación del dominio.

2. **SEO competitivo / de crecimiento**: herramienta para que un seller
   _supere_ a su competencia local (dominio propio, analytics, SEO avanzado,
   "aparecer en Maps"). **Este es el upsell pago.**

**Regla de oro:** la higiene es gratis para todos; la competitividad se vende.

---

## Registro de decisiones (log)

- **2026-08-31** — Se definió el modelo SEO por plan: **la higiene técnica SEO
  (auto metadata, canonical, sitemap, JSON-LD, OG image) es GRATIS para TODOS
  los planes, incluyendo el free** — es piso de calidad, no se cobra. El **SEO
  avanzado** (SERP preview, "SEO avanzado" plegado, override manual, sugerencias
  IA) es **solo plan pago** (Emprendedor+). Implementación: flag nuevo
  `seoAdvancedEnabled`, manteniendo `seoEnabled` para indexación.
- **2026-08-31** — Se registró `custom-domains-premium.md`: dominio propio por
  seller como tier premium. Decisión técnica relevante: **una sola app en
  Vercel con custom domains** (NO un Vercel por tienda). El costo operativo
  (verificación DNS, SSL, soporte) justifica el precio premium.
- **2026-08-31** — Se registró `seo-competitivo.md`: la capa de crecimiento
  como add-on pago, separada de la higiene técnica.
- **2026-08-31** — Se detectó un texto ENG AÑOSO en `app/pricing/page.tsx`:
  el plan Emprendedor prometía "Dominio personalizado + SEO" (que no existe —
  es subdominio, no dominio propio). Queda registrado como tarea de corrección
  en `tasks-pendient/seo-storefront-plan.md`.
