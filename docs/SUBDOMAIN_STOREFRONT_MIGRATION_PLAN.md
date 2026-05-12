# Plan incremental: tiendas por subdominio

Fecha: 2026-05-12  
Estado: idea técnica / plan de parche incremental  
Objetivo: pasar de URLs por path a URLs por subdominio sin reescribir toda la app.

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
  Redirige desde `/list-business` hacia `/${activeSessionSlug}`.

- `next.config.ts`  
  Tiene headers globales, CSP y HSTS con `includeSubDomains`.

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

Objetivo: limpiar la base para que después el cambio de URL no duela.

### Tareas

1. Crear helpers centralizados de URL.

   Ejemplos conceptuales:

   ```ts
   getBusinessPath(slug, '/dashboard');
   getBusinessUrl(slug, '/product/123');
   getCanonicalBusinessUrl(slug);
   isTenantHost(hostname);
   extractTenantSlugFromHost(hostname);
   ```

2. Reemplazar gradualmente strings manuales:

   ```ts
   `/${slug}``/${slug}/dashboard``/${slug}/storage``/${slug}/product/${productId}`;
   ```

   por helpers.

3. Mantener el resultado igual por ahora:

   ```txt
   store-lite.com/tienda-1/dashboard
   ```

4. Endurecer validación de slugs para que sean compatibles con subdominios.

   Reglas recomendadas:

   ```txt
   - solo minúsculas, números y guiones;
   - no puede empezar con guion;
   - no puede terminar con guion;
   - no debe permitir underscore;
   - largo máximo recomendado: 63 caracteres por DNS label;
   - idealmente entre 3 y 50 caracteres para UX.
   ```

5. Crear lista de subdominios reservados.

   Ejemplos:

   ```txt
   www
   app
   api
   admin
   auth
   dashboard
   mail
   support
   static
   assets
   cdn
   docs
   blog
   status
   ```

### Resultado esperado

La app sigue funcionando igual, pero ya no depende tanto de concatenar paths manualmente.

## Fase 2 — Soporte dual: path + subdominio

Objetivo: permitir ambos formatos durante un tiempo.

```txt
store-lite.com/tienda-1
tienda-1.store-lite.com
```

### Tareas

1. Configurar wildcard DNS:

   ```txt
   *.store-lite.com
   ```

2. Configurar wildcard domain en el hosting.

3. Implementar detección de subdominio en `proxy.ts` o `src/lib/supabase/proxy.ts`.

   Pseudocódigo:

   ```ts
   const host = request.headers.get('host');
   const tenantSlug = extractTenantSlugFromHost(host);

   if (tenantSlug && !isReservedSubdomain(tenantSlug)) {
     const url = request.nextUrl.clone();
     url.pathname = `/${tenantSlug}${url.pathname}`;
     return NextResponse.rewrite(url);
   }
   ```

4. Mantener `/tienda-1` funcionando como legacy.

### Resultado esperado

Estas URLs deberían renderizar lo mismo:

```txt
store-lite.com/tienda-1
tienda-1.store-lite.com
```

Y:

```txt
store-lite.com/tienda-1/product/abc
tienda-1.store-lite.com/product/abc
```

## Fase 3 — Canonicalización y redirects

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

   redirigir a:

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
   - canonical URL;
   - Open Graph URL;
   - structured data;
   - JSON-LD si aplica;
   - sitemap futuro si se implementa.

4. Evitar contenido duplicado entre path y subdominio.

### Nota

Durante la transición se puede mantener el path legacy sin indexar o con redirect 301/308. Para SEO, lo correcto es tener una sola URL canónica.

## Fase 4 — Auth y cookies

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

- [ ] Definir dominio real de producción.
- [ ] Confirmar soporte de wildcard subdomains en hosting.
- [ ] Confirmar estrategia de cookies con Supabase.
- [ ] Crear helper centralizado de URLs.
- [ ] Crear helper de host/subdomain parsing.
- [ ] Crear lista de subdominios reservados.
- [ ] Endurecer slug validation.
- [ ] Decidir redirect legacy: 301, 302, 307 o 308.
- [ ] Definir canonical URL para SEO.
- [ ] Agregar tests unitarios para helpers.
- [ ] Agregar tests e2e mínimos para subdominio.

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
