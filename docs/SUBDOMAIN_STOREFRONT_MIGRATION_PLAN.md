# Plan incremental: tiendas por subdominio

Fecha: 2026-05-12  
Última revisión: 2026-05-12 — Añadidas estimaciones, dependencias, entorno local, plan de rollback, momento recomendado de ejecución, feature flags y flujo de switching.  
Estado: plan detallado con fases y dependencias. Listo para ejecución secuencial.  
Objetivo: pasar de URLs por path a URLs por subdominio sin reescribir toda la app.

> ⚠️ **Momento recomendado para ejecutar**: Completar primero las features actuales de storefront (carrito, checkout, etc.). Aplicar Fase 1 como refactor independiente entre ciclos de features. El resto de fases solo cuando se tenga dominio de producción con wildcard DNS. Ver "Momento recomendado de ejecución" al final.

## Resumen ejecutivo

Hoy Store Lite publica negocios con este formato:

```txt
store-lite.com/tienda-1
store-lite.com/tienda-1/product/abc
```

La idea es evolucionar hacia:

```txt
tienda-1.store-lite.com
tienda-1.store-lite.com/product/abc
```

La recomendación es hacerlo como **parche incremental sobre la arquitectura actual**, no como una reescritura completa. La app ya tiene una base útil: el negocio se resuelve por `slug` y las rutas viven bajo `app/[slug]`.

La estrategia segura es:

```txt
tienda-1.store-lite.com/product/abc
        ↓ proxy / rewrite interno
store-lite.com/tienda-1/product/abc
        ↓ Next.js App Router
app/[slug]/product/[productId]
```

Es decir: el usuario ve subdominio, pero Next puede seguir renderizando internamente `app/[slug]`.

## Por qué conviene

- Da una identidad más profesional a cada tienda.
- Separa mejor la plataforma del storefront.
- Prepara el camino para dominios custom en el futuro, por ejemplo `mitienda.com`.
- Evita conflictos conceptuales entre páginas de plataforma y páginas de negocio.
- Es un patrón común en SaaS multi-tenant.

## Advertencia importante

Esto NO es solamente cambiar links.

El tenancy por path está distribuido en varios lugares:

- rutas `app/[slug]`;
- `params.slug`;
- `useParams`;
- links tipo `/${slug}/dashboard`;
- redirects tipo `redirect(\`/${slug}\`)`;
- cache invalidation con `revalidatePath(\`/${slug}\`)`;
- metadata SEO con `env.nextPublicAppUrl/${business.slug}`;
- cookies y sesión Supabase;
- detección de storefront público en `src/lib/supabase/proxy.ts`.

Si se hace apurado, vamos a crear URLs duplicadas, sesiones rotas y bugs difíciles de perseguir. Acá hay que avanzar paso a paso.

## Dependencias entre fases

```txt
Fase 1 (helpers + slugs) ─── puede hacerse en cualquier momento
       │
       ▼
Fase 2 (soporte dual) ─── requiere: dominio producción + wildcard DNS + Fase 1
       │
       ├──▶ Fase 4 (cookies) ─── requisito para Fase 2 seguro
       │
       ├──▶ Fase 3 (canonical) ─── después de Fase 2 estable
       │
       ├──▶ Fase 5 (navegación) ─── después de Fase 2+4
       │
       ├──▶ Fase 6 (cache) ─── después de Fase 3
       │
       └──▶ Fase 7 (tests) ─── en paralelo con Fase 2-6
```

**Nota crítica**: Fase 4 (cookies) debería resolverse antes o en paralelo con Fase 2. Si Fase 2 se lanza sin estrategia de cookies, el bug "logueado en plataforma, deslogueado en subdominio" aparece inmediatamente.

## Estimación de tiempos (dev solo)

| Fase                      | Esfuerzo estimado      | Dependencias                       |
| ------------------------- | ---------------------- | ---------------------------------- |
| Fase 1 — Preparación      | 1-2 días               | Ninguna                            |
| Fase 2 — Soporte dual     | 2-4 días               | Fase 1, dominio prod, wildcard DNS |
| Fase 3 — Canonicalización | 1-2 días               | Fase 2                             |
| Fase 4 — Auth y cookies   | 1-3 días               | Idealmente antes/paralelo a Fase 2 |
| Fase 5 — Navegación       | 2-3 días               | Fase 2 + Fase 4                    |
| Fase 6 — Cache            | 1 día                  | Fase 3                             |
| Fase 7 — Testing          | 2-3 días (distribuido) | En paralelo con 2-6                |

**Total estimado**: ~2-3 semanas de trabajo intermitente para un dev solo, asumiendo que no hay interrupciones de features.

## Consideraciones de entorno local

Probar subdominios en localhost NO es directo. Opciones:

### Opción 1: Editar hosts file (más simple)

Agregar entradas en `C:\Windows\System32\drivers\etc\hosts` (Windows) o `/etc/hosts` (Linux/Mac):

```txt
127.0.0.1 mitienda.store-lite.local
127.0.0.1 otropan.store-lite.local
```

Desventaja: hay que agregar una entrada POR CADA negocio que quieras probar.

### Opción 2: Usar \*.localhost (recomendado para dev)

Los navegadores modernos tratan `*.localhost` como `127.0.0.1`. Podés usar:

```txt
mitienda.localhost:3000
otropan.localhost:3000
```

Esto funciona sin configurar hosts. Pero el proxy de Next.js tiene que detectar el subdominio del hostname correctamente.

### Opción 3: Proxy reverso local (traefik, nginx)

Para más realismo, un proxy local que termine TLS y rutee por hostname. Overkill para esta etapa, pero útil si querés probar cookies cross-domain en serio.

## Estado actual detectado

Archivos relevantes:

- `proxy.ts`  
  Entry point actual del proxy de Next.js 16.

- `src/lib/supabase/proxy.ts`  
  Maneja sesión Supabase, protección de rutas y detección de storefront público.

- `src/core/business/slug.ts`  
  Resuelve negocios por `businesses.slug` y `business_slug_aliases.slug`. También maneja canonical slug.

- `src/shared/utils/slugify.ts`  
  Genera slugs. Ojo: actualmente usa `\w`, lo cual puede permitir `_`. Eso sirve para paths, pero no para subdominios DNS-safe.

- `app/[slug]/layout.tsx`  
  Layout principal de negocio. Carga business, permisos, entitlements, productos y providers.

- `app/[slug]/(home)/page.tsx`  
  Home pública de tienda y metadata SEO.

- `app/[slug]/product/[productId]/page.tsx`  
  Detalle de producto dentro de tienda.

- `app/actions/CreateBusiness.ts`  
  Crea negocio y redirige a `/${finalSlug}`.

- `src/shared/components/navigation/Navbar.tsx`  
  Tiene links administrativos armados como `/${slug}/...`.

- `src/shared/components/layout/AppLayout.tsx`  
  Redirige desde `/list-business` hacia `/${activeSessionSlug}`. También maneja `useBusinessSession` que depende de `localStorage`. Con subdominios, localStorage NO se comparte entre dominios — la sesión de negocio necesita migrarse a cookie con dominio compartido o rediseñarse.

- `src/config/env.ts`  
  Define `nextPublicAppUrl` con fallback a `http://localhost:3000`. Esta variable se usa en JSON-LD y metadata SEO. Cuando se migre a subdominios, la URL base de los storefronts cambia — hay que decidir si `NEXT_PUBLIC_APP_URL` sigue siendo el dominio raíz o pasa a ser dinámico por negocio.

- `next.config.ts`  
  Tiene headers globales, CSP y HSTS con `includeSubDomains`. El CSP actual lista dominios fijos (`.supabase.co`, `.culqi.com`). Con subdominios hay que revisar que no se necesiten cambios en CSP.

## Decisión arquitectónica recomendada

Mantener `app/[slug]` como ruta interna durante la primera etapa.

No mover de entrada a:

```txt
app/(tenant)
app/dashboard
app/product
```

Eso sería más limpio a largo plazo, sí, pero para este momento aumenta mucho el riesgo.

La arquitectura puente recomendada:

```txt
Usuario
  ↓
{slug}.store-lite.com/*
  ↓
proxy detecta hostname
  ↓
rewrite interno a /{slug}/*
  ↓
app/[slug] renderiza normalmente
```

## Fase 1 — Preparación sin cambiar comportamiento público

**Estimación**: 1-2 días  
**Dependencias**: Ninguna  
**Riesgo**: Bajo. No cambia comportamiento público.  
**Rollback**: Revertir el commit. El cambio es puramente mecánico (reemplazar strings por helpers que producen el mismo resultado).

Objetivo: limpiar la base para que después el cambio de URL no duela.

### Tareas

1. Crear `src/shared/utils/url.ts` con helpers centralizados de URL.

   ```ts
   // Siempre produce rutas relativas a la raíz
   getBusinessPath(slug, '/dashboard')       // → /{slug}/dashboard
   getBusinessUrl(slug, '/product/123')      // → {base}/{slug}/product/123

   // Para SEO (canonical, Open Graph, JSON-LD)
   getCanonicalBusinessUrl(slug)             // → {base}/{slug}

   // Para detección de subdominio (se completa en Fase 2)
   isTenantHost(hostname): boolean           // ¿este host es un subdominio de negocio?
   extractTenantSlugFromHost(hostname)       // extrae slug del hostname
   ```

2. Reemplazar gradualmente strings `/${...}` manuales por los helpers.

   Archivos a tocar:
   - `app/actions/CreateBusiness.ts` — línea 130: `redirect(\`/${finalSlug}\`)`→`redirect(getBusinessPath(finalSlug))`
   - `src/shared/components/navigation/Navbar.tsx` — líneas 69-84: paths de navegación
   - `src/shared/components/layout/AppLayout.tsx` — línea 68: `router.push(\`/${activeSessionSlug}\`)`
   - `app/[slug]/(home)/page.tsx` — línea 120: JSON-LD `url: \`${env.nextPublicAppUrl}/${business.slug}\``
   - Cualquier otro link construido como `/${slug}/...`

3. Mantener el resultado igual por ahora:

   ```txt
   store-lite.com/tienda-1/dashboard     ← mismo output
   ```

4. Endurecer validación de slugs para que sean compatibles con subdominios.

   **Archivo**: `src/shared/utils/slugify.ts`

   **Problema actual**: la regex `[^\w-]` permite underscore (`_`), que NO es válido en subdominios DNS.

   **Fix**: cambiar a `[^a-z0-9-]`:

   ```ts
   .replace(/[^a-z0-9-]/g, '-')
   ```

   Reglas recomendadas:

   ```txt
   - solo minúsculas, números y guiones;
   - no puede empezar con guion;
   - no puede terminar con guion;
   - no debe permitir underscore;
   - largo máximo recomendado: 63 caracteres por DNS label;
   - idealmente entre 3 y 50 caracteres para UX.
   ```

   > ⚠️ **Compatibilidad hacia atrás**: Si ya existen slugs con underscore en la BD, hay que manejarlos en `proxy.ts` (Fase 2) o migrarlos con un script one-off. No romper slugs existentes.

5. Crear lista de subdominios reservados en una constante compartida.

   ```ts
   // src/shared/utils/url.ts
   export const RESERVED_SUBDOMAINS = [
     'www',
     'app',
     'api',
     'admin',
     'auth',
     'dashboard',
     'mail',
     'support',
     'static',
     'assets',
     'cdn',
     'docs',
     'blog',
     'status',
   ] as const;
   ```

### Resultado esperado

La app sigue funcionando igual, pero ya no depende tanto de concatenar paths manualmente. Con esto, el salto a subdominios duele mucho menos.

### Verificación post-Fase 1

- Todos los links internos siguen funcionando (navegar por la app manualmente)
- JSON-LD sigue generando URLs correctas
- Creación de negocio sigue redirigiendo correctamente
- Los slugs nuevos ya no contienen underscore
- Los slugs existentes con underscore siguen funcionando (no se rompe nada)

## Fase 2 — Soporte dual: path + subdominio

**Estimación**: 2-4 días  
**Dependencias**:

- ✅ Fase 1 completada (helpers de URL + slug validation + reserved subdomains)
- ✅ Dominio real de producción definido
- ✅ Wildcard DNS configurado en el hosting
- ⚠️ Idealmente Fase 4 resuelta o al menos diseñada (cookies cross-domain)

**Riesgo**: ALTO. Toca el proxy, el routing y potencialmente las sesiones.

**Rollback rápido**:

- Si el rewrite rompe: comentar el bloque de detección de subdominio en `proxy.ts` y redeploy. Las URLs por path siguen funcionando porque nunca dejaron de existir.
- Más seguro aún: usar un feature flag (env var `FEATURE_SUBDOMAIN_STOREFRONT`) para activar/desactivar el rewrite sin deploy.

Objetivo: permitir ambos formatos durante un tiempo.

```txt
store-lite.com/tienda-1
tienda-1.store-lite.com
```

### Pre-requisitos de infraestructura

1. Configurar wildcard DNS:

   ```txt
   *.store-lite.com    →    A/CNAME al servidor
   ```

2. Configurar wildcard domain en el hosting (Vercel, Railway, etc.).

   En Vercel: projects → Settings → Domains → Add `*.store-lite.com`

3. Verificar que el hosting soporta TLS automático para wildcard domains (Vercel sí, otros puede que requieran certificado wildcard manual).

### Tareas de implementación

1. Implementar detección de subdominio en `proxy.ts`.

   Pseudocódigo:

   ```ts
   const host = request.headers.get('host') ?? '';
   const tenantSlug = extractTenantSlugFromHost(host);
   const isSubdomainRequest = Boolean(tenantSlug && !isReservedSubdomain(tenantSlug));

   if (isSubdomainRequest) {
     const url = request.nextUrl.clone();
     url.pathname = `/${tenantSlug}${url.pathname}`;
     return NextResponse.rewrite(url);
   }
   ```

2. Asegurar que el rewrite NO duplique el slug:

   ```txt
   ❌ tienda-1.store-lite.com/tienda-1/dashboard   ← si no se cuida
   ✅ tienda-1.store-lite.com/dashboard             ← correcto
   ```

3. Mantener `/tienda-1` funcionando como legacy sin cambios.

4. Agregar feature flag:

   ```env
   # .env.production
   NEXT_PUBLIC_SUBDOMAIN_STOREFRONT_ENABLED=true
   ```

### Consideraciones específicas del proxy (`proxy.ts` + `src/lib/supabase/proxy.ts`)

- El rewrite debe ejecutarse ANTES de la lógica de sesión, porque la ruta interna cambia.
- Si el rewrite se hace después de la verificación de auth, las rutas protegidas no van a detectar correctamente el storefront público.
- Hay que mantener el `request.nextUrl.clone()` para no mutar el objeto original.

### Resultado esperado

Estas URLs deberían renderizar exactamente el mismo contenido:

```txt
store-lite.com/tienda-1
tienda-1.store-lite.com
```

Y:

```txt
store-lite.com/tienda-1/product/abc
tienda-1.store-lite.com/product/abc
```

### Verificación post-Fase 2

- [ ] `store-lite.com/tienda-1` → renderiza tienda
- [ ] `tienda-1.store-lite.com` → renderiza la MISMA tienda
- [ ] Subdominio reservado (`api.store-lite.com`) → NO intenta resolver negocio
- [ ] Slug con alias → funciona por ambos formatos
- [ ] Negocio inactivo → bloqueado en ambos formatos
- [ ] Session mantiene login entre dominio principal y subdominio (si ya aplicó Fase 4)

## Fase 3 — Canonicalización y redirects

**Estimación**: 1-2 días  
**Dependencias**: Fase 2 completada y estable  
**Riesgo**: Medio. Si los redirects están mal, contenido duplicado o pérdida de tráfico SEO.

Objetivo: definir cuál URL es la “oficial”.

Recomendación:

```txt
tienda-1.store-lite.com
```

como canonical público.

### Tareas

1. Si alguien entra por:

   ```txt
   store-lite.com/tienda-1
   ```

   redirigir (301/308) a:

   ```txt
   tienda-1.store-lite.com
   ```

2. Si alguien entra por alias viejo:

   ```txt
   alias-viejo.store-lite.com
   ```

   redirigir a:

   ```txt
   slug-canonico.store-lite.com
   ```

3. Actualizar metadata SEO:
   - canonical URL → `{subdominio}/{path}`;
   - Open Graph URL → `{subdominio}/{path}`;
   - structured data → `{subdominio}`;
   - JSON-LD → actualizar `url` en `app/[slug]/(home)/page.tsx`;
   - sitemap futuro si se implementa.

4. **Impacto en `NEXT_PUBLIC_APP_URL`**: Hoy `env.nextPublicAppUrl` se usa como base para URLs canónicas y JSON-LD. Con subdominios, esta variable de entorno necesita SER DINÁMICA porque cada negocio tiene su propio hostname. Opciones:
   - Opción A (simple): detectar el hostname de la request en server components y construir la URL base dinámicamente
   - Opción B (avanzada): eliminar el uso de `env.nextPublicAppUrl` para storefronts y reemplazar con un helper `getCanonicalBusinessUrl(slug)` que ya resuelve el hostname correcto según contexto

5. Evitar contenido duplicado entre path y subdominio (canonical tag + redirects).

### Nota

Durante la transición se puede mantener el path legacy sin indexar o con redirect 301/308. Para SEO, lo correcto es tener una sola URL canónica.

### Decisión: tipo de redirect

| Código  | Uso                                                 |
| ------- | --------------------------------------------------- |
| 301     | Redirect permanente (SEO estable, browsers cachean) |
| 302     | Redirect temporal (para periodo de transición)      |
| 307/308 | Mantiene método HTTP (si hay POSTs)                 |

Recomendación: usar 302 durante la transición, después migrar a 301 cuando se decida la canonical final.

## Fase 4 — Auth y cookies

**Estimación**: 1-3 días  
**Dependencias**: Idealmente antes o en paralelo con Fase 2  
**Riesgo**: MUY ALTO. Si falla, el usuario aparece deslogueado en subdominios. Es el bug más frustrante y difícil de debuggear.

**Rollback**: Volver a configurar cookies sin `Domain=.store-lite.com` (dominio por defecto = host-only). Esto es inmediato porque es configuración del lado del servidor.

Objetivo: que la sesión funcione entre dominio principal y subdominios.

Este es uno de los puntos más delicados.

Si el usuario inicia sesión en:

```txt
store-lite.com
```

pero luego entra a:

```txt
tienda-1.store-lite.com/dashboard
```

la sesión puede no existir si las cookies son host-only.

### Tareas

1. Revisar cómo `@supabase/ssr` está seteando cookies.

   Archivos a mirar:
   - `src/lib/supabase/proxy.ts`
   - `src/lib/supabase/server.ts`
   - `src/lib/supabase/client.ts`

2. Evaluar setear dominio compartido:

   ```txt
   Domain=.store-lite.com
   ```

3. Validar OAuth callback.

   Ojo con Google/GitHub/etc. porque los redirects autorizados pueden requerir URLs explícitas.

4. Validar logout cross-subdomain.

5. Validar navegación:

   ```txt
   store-lite.com/list-business
   → tienda-1.store-lite.com/dashboard
   ```

### Riesgo

Si esto se ignora, vamos a tener el bug clásico:

> “Estoy logueado en la plataforma, pero en el subdominio aparezco deslogueado”.

Ese bug es una pérdida de tiempo brutal. Mejor diseñarlo bien desde el principio.

## Fase 5 — Navegación interna y UX

Objetivo: que las rutas internas funcionen naturalmente en subdominio.

En subdominio, estos links:

```txt
/dashboard
/storage
/settings
/product/abc
```

son preferibles a:

```txt
/tienda-1/dashboard
/tienda-1/storage
/tienda-1/settings
/tienda-1/product/abc
```

### Tareas

1. `Navbar.tsx` debería usar helpers.

   Hoy usa patrones como:

   ```ts
   `/${slug}/dashboard`;
   ```

   En contexto de subdominio debería poder producir:

   ```ts
   `/dashboard`;
   ```

2. `AppLayout.tsx` debería redirigir a la URL correcta según contexto.

   Hoy:

   ```ts
   router.push(`/${activeSessionSlug}`);
   ```

   Futuro:

   ```ts
   router.push(getBusinessUrl(activeSessionSlug));
   ```

3. Botones, cards y acciones de negocio deben usar el helper central.

4. Evitar que aparezcan URLs dobles:

   ```txt
   tienda-1.store-lite.com/tienda-1/dashboard
   ```

   Esa URL es síntoma de que seguimos pensando en path cuando ya estamos en host-based tenancy.

## Fase 6 — Cache invalidation y server actions

Objetivo: que `revalidatePath` siga funcionando correctamente.

Hoy hay acciones que invalidan:

```ts
revalidatePath(`/${slug}`);
```

Con rewrite interno puede seguir funcionando, pero hay que validar caso por caso.

### Tareas

1. Revisar server actions que hacen `revalidatePath`.
2. Mantener invalidación sobre ruta interna si seguimos usando `app/[slug]`.
3. Si se agregan tags, considerar `revalidateTag` por negocio:

   ```txt
   business:{businessId}
   business-slug:{slug}
   ```

### Consejo

No mezclar este cambio con una refactorización grande de caché. Primero subdominios estables, después optimización de cache. Una obra se hace por etapas, no tirando todas las paredes al mismo tiempo.

## Fase 7 — Testing mínimo

Objetivo: cubrir los flujos que se pueden romper.

### Casos recomendados

1. Landing principal:

   ```txt
   store-lite.com
   ```

2. Home de tienda por path legacy:

   ```txt
   store-lite.com/tienda-1
   ```

3. Home de tienda por subdominio:

   ```txt
   tienda-1.store-lite.com
   ```

4. Producto por subdominio:

   ```txt
   tienda-1.store-lite.com/product/abc
   ```

5. Dashboard con usuario autorizado:

   ```txt
   tienda-1.store-lite.com/dashboard
   ```

6. Dashboard con usuario no autorizado.

7. Negocio inactivo:
   - owner/team puede verlo;
   - público no puede verlo.

8. Alias de slug:

   ```txt
   alias-viejo.store-lite.com
   → slug-canonico.store-lite.com
   ```

9. Subdominio reservado:

   ```txt
   api.store-lite.com
   ```

   no debe intentar resolver negocio `api`.

10. Logout y cambio de negocio entre tabs.

## Tradeoffs

### Opción A — Parche incremental con rewrite interno

```txt
{slug}.store-lite.com/* → /{slug}/*
```

Ventajas:

- menor riesgo;
- menos cambios iniciales;
- aprovecha `app/[slug]`;
- permite soporte dual;
- ideal para migración paso a paso.

Desventajas:

- mantiene una capa de compatibilidad;
- puede confundir si no se centralizan helpers;
- hay que cuidar canonical URLs.

### Opción B — Reestructurar toda la app a host-based routing real

Ventajas:

- arquitectura más limpia a largo plazo;
- rutas internas sin `slug`;
- mental model más simple una vez terminado.

Desventajas:

- mucho más trabajo;
- más riesgo de romper dashboard, pagos, pedidos y storage;
- no conviene hacerlo antes de tener helpers y tests.

### Recomendación

Empezar con Opción A.

Después, cuando esté estable, evaluar si vale la pena migrar a Opción B. No antes.

## Checklist antes de implementar

### Fase 1 (preparación, independiente)

- [ ] Crear helper centralizado de URLs (`src/shared/utils/url.ts`)
- [ ] Crear helper de host/subdomain parsing (esqueleto, se completa en Fase 2)
- [ ] Crear lista de subdominios reservados
- [ ] Endurecer slug validation (`slugify.ts`: `[^\w-]` → `[^a-z0-9-]`)
- [ ] Reemplazar TODAS las concatenaciones `/${slug}` por helpers
- [ ] Agregar tests unitarios para helpers

### Fase 2 (soporte dual, requiere infra)

- [ ] Definir dominio real de producción
- [ ] Confirmar soporte de wildcard subdomains en hosting
- [ ] Configurar wildcard DNS (`*.store-lite.com`)
- [ ] Configurar wildcard domain en hosting
- [ ] Agregar feature flag (`FEATURE_SUBDOMAIN_REWRITE`)
- [ ] Implementar rewrite en proxy.ts
- [ ] Verificar que subdominios reservados no se resuelven como negocio

### Fase 3-7 (dependen de Fase 2)

- [ ] Confirmar estrategia de cookies con Supabase (Fase 4)
- [ ] Decidir redirect legacy: 301, 302, 307 o 308
- [ ] Definir canonical URL para SEO
- [ ] Manejar `NEXT_PUBLIC_APP_URL` dinámico por negocio
- [ ] Agregar tests e2e mínimos para subdominio
- [ ] Revisar server actions que usan `revalidatePath`

## Consejos prácticos

1. **No concatenar URLs a mano.**  
   Si aparece `/${slug}` por todos lados, la arquitectura se vuelve frágil. Centralizar esto es obligatorio.

2. **No matar el path legacy de golpe.**  
   Hay links existentes, usuarios, posibles QR, mensajes de WhatsApp y productos compartidos. Primero soportar ambos.

3. **No ignorar cookies.**  
   Subdominios sin estrategia de cookies es pedir bugs de sesión.

4. **No mezclar con otros refactors grandes.**  
   Este cambio ya toca routing, SEO y auth. No sumarle rediseño, pagos o storage al mismo lote.

5. **Tratar el slug como identidad pública.**  
   Si va a ser subdominio, tiene que tener reglas más estrictas que un simple path.

6. **Pensar en dominios custom desde ahora.**  
   Si el helper se diseña bien, mañana puede soportar:

   ```txt
   tienda-1.store-lite.com
   mitienda.com
   ```

   sin rehacer media app.

## Momento recomendado de ejecución

Este plan NO debe ejecutarse de golpe ni en medio de desarrollo de features. El flujo recomendado:

```txt
AHORA → Terminar features actuales de storefront
         (carrito, checkout, producto, etc.)
         │
         ▼
Sprint 1 → FASE 1 (Preparación)
         1-2 días. Refactor puro. Sin cambio visual.
         │
         ▼
         EVALUAR: ¿Ya tenemos dominio de producción
         con wildcard DNS y hosting configurado?
         │
         ├── NO → Parar acá. Fase 1 ya dejó el código
         │         más limpio. Esperar a que la
         │         infraestructura esté lista.
         │
         └── SÍ → ¿Las cookies cross-domain están
                   resueltas o diseñadas?
                   │
                   ├── NO → HACER FASE 4 primero
                   │
                   └── SÍ → Seguir con FASE 2
                            │
                            ▼
                           FASE 2 → FASE 3 → FASE 5 → FASE 6
                           (FASE 7 distribuida entre todas)
```

### Consideraciones sobre switching de negocio

Hoy el flujo de cambio de negocio es:

```txt
Usuario en /tienda-1/dashboard
  → cierra sesión de negocio
  → redirige a /list-business
  → selecciona otro negocio
  → redirige a /otro-store/dashboard
```

Con subdominios, este flujo implica cambiar de hostname:

```txt
tienda-1.store-lite.com/dashboard
  → list-business.store-lite.com (o store-lite.com/list-business)
  → selecciona otro negocio
  → router.push(getBusinessUrl('otro-store', '/dashboard'))
  → navega a otro-store.store-lite.com/dashboard
```

Esto requiere que `router.push()` pueda cambiar de hostname (sí puede) pero hay que considerar:

- La sesión debe persistir (Fase 4)
- El localStorage de la pestaña se pierde al cambiar de dominio
- `useBusinessSession` (que usa localStorage) necesita adaptarse
- Alternativa: usar cookies con `Domain=.store-lite.com` para compartir estado entre subdominios

### Feature flags recomendados

Para minimizar riesgo, usar env vars:

```env
# Habilita el rewrite de subdominios en el proxy
FEATURE_SUBDOMAIN_REWRITE=false

# Habilita redirect 301 de path → subdominio (Fase 3)
FEATURE_SUBDOMAIN_CANONICAL=false

# Modifica helpers de URL para producir subdominios vs paths
NEXT_PUBLIC_SUBDOMAIN_STOREFRONT_ENABLED=false
```

Así se puede deployar el código de Fase 2+3 inactivo y activarlo cuando se quiera, sin deploy extra.

### Resumen: ¿cuándo arrancar?

| Situación                              | ¿Arrancar?                         |
| -------------------------------------- | ---------------------------------- |
| En medio de features de storefront     | ❌ NO. Terminar primero            |
| Entre sprints, sin presión de features | ✅ Fase 1 solamente                |
| Después de Fase 1, sin dominio prod    | ⏸️ Parar, esperar infra            |
| Con dominio prod + wildcard DNS        | ✅ Fase 2-7                        |
| Con cookies cross-domain sin resolver  | ⚠️ Resolver Fase 4 antes de Fase 2 |

## Idea final

La integración vale la pena, pero hay que verla como una migración de tenancy:

```txt
path-based tenancy
→ hybrid tenancy
→ host-based tenancy
→ custom-domain tenancy
```

Ese es el camino sano.

Primero puente sólido. Después optimización. Después elegancia.  
Es así de fácil, pero hay que hacerlo con fundamentos.
