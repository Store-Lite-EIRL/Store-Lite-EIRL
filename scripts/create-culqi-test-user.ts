// =====================================================
// PROVISION: Crear/actualizar el usuario de validación Culqi
//            (+ tienda demo completa con --with-store)
// =====================================================
// Description: Crea (o actualiza si ya existe) UN usuario de prueba
// con email+password para que el equipo de revisión de Culqi pueda
// iniciar sesión en /auth. Idempotente: re-ejecutar converge sin duplicar.
// Las credenciales NUNCA se hardcodean — se pasan por variables de
// entorno CULQI_TEST_EMAIL / CULQI_TEST_PASSWORD o por CLI:
//   --email=... --password=... (los argumentos CLI tienen prioridad).
//
// Con --with-store también provisiona una TIENDA DEMO completa para que el
// revisor entre y tenga un storefront funcional al instante (sin fricción de
// onboarding): negocio + ajustes + suscripción activa (plan basico) + un
// producto demo listo para probar el checkout. Los datos demo (nombre,
// slug, precio) son FIXTURES de prueba, no secretos; solo email/password
// vienen del entorno/CLI. Idempotente: la tienda se busca por
// (owner_id + nombre); si existe se actualiza, si no se crea con slug único.
// =====================================================
// Ejecutar: npx tsx scripts/create-culqi-test-user.ts --email=... --password='...' [--with-store]
// =====================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { and, eq } from 'drizzle-orm';
import {
  createDefaultStorefrontLayout,
  createDefaultStorefrontTheme,
  mergeStorefrontLayoutIntoPreferences,
  mergeStorefrontThemeIntoPreferences,
} from '../src/core/storefront';
import { getUniqueProductSlug } from '../src/shared/utils/productSlug';

// Precedencia de Next.js: .env.local gana sobre .env. dotenv no pisa claves
// ya definidas en process.env, por lo que cargar .env.local primero respeta
// esa precedencia.
dotenv.config({ path: ['.env.local', '.env'] });

// ── Fixtures de la tienda demo (datos de prueba, NO secretos) ──
const DEMO_BUSINESS_NAME = 'Tienda Demo Culqi';
const DEMO_BUSINESS_SLUG_BASE = 'tienda-demo-culqi-store';
const DEMO_BUSINESS_DESCRIPTION =
  'Tienda de demostración para la revisión de validación de Culqi. Contiene un producto listo para probar el checkout de punta a punta.';
const DEMO_PRODUCT_TITLE = 'Curso Demo de Tienda Online';
const DEMO_PRODUCT_DESCRIPTION =
  'Producto de demostración para probar el flujo de compra con Culqi de principio a fin. Incluye acceso completo al curso.';
const DEMO_PRODUCT_PRICE = '49.90'; // PEN (soles)
const DEMO_PRODUCT_STOCK = 25;
const DEMO_PRODUCT_TAGS = ['demo', 'culqi'];
// Límite de negocios por cuenta (espejo de createBusinessAction).
const MAX_BUSINESSES_PER_ACCOUNT = 3;

type Db = typeof import('../src/core/database/client').db;
type SchemaModule = typeof import('../src/core/database/schema');

// Contexto con el cliente Drizzle y las tablas que usan los helpers del demo.
// Se construye dentro de main() (imports dinámicos tras la validación de env)
// y se pasa por parámetro para evitar variables globales.
interface ProvisionCtx {
  db: Db;
  businesses: SchemaModule['businesses'];
  businessSlugAliases: SchemaModule['businessSlugAliases'];
  businessSettings: SchemaModule['businessSettings'];
  businessSubscriptions: SchemaModule['businessSubscriptions'];
  products: SchemaModule['products'];
}

const USAGE = `Uso:
  pnpm culqi:create-test-user [opciones]

Opciones:
  --email=...      Email del usuario de validación (prioridad sobre CULQI_TEST_EMAIL)
  --password=...   Contraseña (prioridad sobre CULQI_TEST_PASSWORD)
  --with-store     Además del usuario, provisiona una tienda demo completa
                   (negocio + ajustes + suscripción activa + producto demo)
  --help           Muestra esta ayuda

Ejemplos:
  pnpm culqi:create-test-user --email=validacion@correo.com --password='...'
  pnpm culqi:create-test-user --email=validacion@correo.com --password='...' --with-store`;

interface CliArgs {
  email?: string;
  password?: string;
  withStore: boolean;
  help: boolean;
}

function parseCliArgs(argv: string[]): CliArgs {
  const args: CliArgs = { withStore: false, help: false };
  for (const arg of argv) {
    if (arg.startsWith('--email=')) args.email = arg.slice('--email='.length);
    else if (arg.startsWith('--password=')) args.password = arg.slice('--password='.length);
    else if (arg === '--with-store') args.withStore = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
  }
  return args;
}

function randomSuffix(length = 4): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Genera un slug único para la tienda demo verificando contra la tabla
 * businesses y business_slug_aliases (espejo de generateAvailableBusinessSlug).
 */
async function generateUniqueBusinessSlug(ctx: ProvisionCtx): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `${DEMO_BUSINESS_SLUG_BASE}-${randomSuffix(4)}`;

    const businessConflict = await ctx.db.query.businesses.findFirst({
      where: eq(ctx.businesses.slug, candidate),
      columns: { id: true },
    });
    if (businessConflict) continue;

    const aliasConflict = await ctx.db.query.businessSlugAliases.findFirst({
      where: eq(ctx.businessSlugAliases.slug, candidate),
      columns: { id: true },
    });
    if (!aliasConflict) return candidate;
  }

  throw new Error('No se pudo generar un slug disponible para la tienda demo.');
}

/**
 * Busca la tienda demo por (owner_id + nombre). Si existe, la actualiza
 * (converge a los fixtures); si no, la crea con un slug único. Respeta el
 * límite de 3 negocios por cuenta (espejo de createBusinessAction).
 */
async function getOrCreateDemoBusiness(
  ctx: ProvisionCtx,
  userId: string,
  email: string,
): Promise<{ id: string; slug: string; action: 'created' | 'updated' } | null> {
  const existing = await ctx.db.query.businesses.findFirst({
    where: and(eq(ctx.businesses.ownerId, userId), eq(ctx.businesses.name, DEMO_BUSINESS_NAME)),
  });

  if (existing) {
    await ctx.db
      .update(ctx.businesses)
      .set({
        name: DEMO_BUSINESS_NAME,
        isActive: true,
        description: DEMO_BUSINESS_DESCRIPTION,
        email,
        updatedAt: new Date(),
      })
      .where(eq(ctx.businesses.id, existing.id));
    return { id: existing.id, slug: existing.slug, action: 'updated' };
  }

  const owned = await ctx.db.query.businesses.findMany({
    where: eq(ctx.businesses.ownerId, userId),
    columns: { id: true },
  });
  if (owned.length >= MAX_BUSINESSES_PER_ACCOUNT) {
    console.warn(
      `⚠️ El usuario ya tiene ${owned.length} negocios (límite: ${MAX_BUSINESSES_PER_ACCOUNT}). ` +
        'No se creó la tienda demo.',
    );
    return null;
  }

  const slug = await generateUniqueBusinessSlug(ctx);
  const [created] = await ctx.db
    .insert(ctx.businesses)
    .values({
      ownerId: userId,
      name: DEMO_BUSINESS_NAME,
      slug,
      isActive: true,
      storeType: 'store',
      description: DEMO_BUSINESS_DESCRIPTION,
      country: 'PE',
      city: 'Lima',
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: 'Lima',
      email,
    })
    .returning({ id: ctx.businesses.id, slug: ctx.businesses.slug });

  return { id: created.id, slug: created.slug, action: 'created' };
}

/**
 * Crea/actualiza la fila de business_settings (única por negocio) con el
 * theme y layout por defecto del storefront (espejo de createBusinessAction).
 */
async function upsertDemoBusinessSettings(
  ctx: ProvisionCtx,
  businessId: string,
): Promise<'created' | 'updated'> {
  const preferencesWithLayout = mergeStorefrontLayoutIntoPreferences(
    {},
    createDefaultStorefrontLayout(),
  );
  const initialPreferences = mergeStorefrontThemeIntoPreferences(
    preferencesWithLayout,
    createDefaultStorefrontTheme(),
  );

  const existing = await ctx.db.query.businessSettings.findFirst({
    where: eq(ctx.businessSettings.businessId, businessId),
    columns: { id: true },
  });

  if (existing) {
    await ctx.db
      .update(ctx.businessSettings)
      .set({
        contrastLevel: 'standard',
        preferences: initialPreferences,
        updatedAt: new Date(),
      })
      .where(eq(ctx.businessSettings.businessId, businessId));
    return 'updated';
  }

  await ctx.db.insert(ctx.businessSettings).values({
    businessId,
    contrastLevel: 'standard',
    preferences: initialPreferences,
  });
  return 'created';
}

/**
 * Crea la suscripción basico/active si falta. Si ya existe y está activa,
 * NO se toca (el revisor pudo upgradear el plan). Si existe pero quedó
 * inactiva/vencida, se reactiva (auto-curación).
 */
async function upsertDemoSubscription(
  ctx: ProvisionCtx,
  businessId: string,
): Promise<'created' | 'healed' | 'active'> {
  const existing = await ctx.db.query.businessSubscriptions.findFirst({
    where: eq(ctx.businessSubscriptions.businessId, businessId),
  });

  if (!existing) {
    await ctx.db.insert(ctx.businessSubscriptions).values({
      businessId,
      planType: 'basico',
      planStatus: 'active',
      planStartDate: new Date(),
      planEndDate: null,
      cancelAtPeriodEnd: false,
    });
    return 'created';
  }

  if (existing.planStatus === 'active') {
    return 'active';
  }

  await ctx.db
    .update(ctx.businessSubscriptions)
    .set({
      planType: 'basico',
      planStatus: 'active',
      planStartDate: existing.planStartDate ?? new Date(),
      planEndDate: null,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(ctx.businessSubscriptions.businessId, businessId));
  return 'healed';
}

/**
 * Crea/actualiza el producto demo (único por business_id + título).
 * En re-ejecución converge precio/stock/disponibilidad a los fixtures.
 */
async function upsertDemoProduct(
  ctx: ProvisionCtx,
  businessId: string,
): Promise<'created' | 'updated'> {
  const existing = await ctx.db.query.products.findFirst({
    where: and(eq(ctx.products.businessId, businessId), eq(ctx.products.title, DEMO_PRODUCT_TITLE)),
    columns: { id: true },
  });

  if (existing) {
    await ctx.db
      .update(ctx.products)
      .set({
        description: DEMO_PRODUCT_DESCRIPTION,
        price: DEMO_PRODUCT_PRICE,
        currency: 'PEN',
        stock: DEMO_PRODUCT_STOCK,
        isAvailable: true,
        saleStatus: 'NORMAL',
        tags: DEMO_PRODUCT_TAGS,
        updatedAt: new Date(),
      })
      .where(eq(ctx.products.id, existing.id));
    return 'updated';
  }

  const siblingProducts = await ctx.db.query.products.findMany({
    where: eq(ctx.products.businessId, businessId),
    columns: { slug: true },
  });
  const usedSlugs = new Set(siblingProducts.map((p) => p.slug).filter(Boolean) as string[]);
  const slug = getUniqueProductSlug(DEMO_PRODUCT_TITLE, usedSlugs);

  await ctx.db.insert(ctx.products).values({
    businessId,
    title: DEMO_PRODUCT_TITLE,
    slug,
    description: DEMO_PRODUCT_DESCRIPTION,
    price: DEMO_PRODUCT_PRICE,
    currency: 'PEN',
    stock: DEMO_PRODUCT_STOCK,
    isAvailable: true,
    saleStatus: 'NORMAL',
    tags: DEMO_PRODUCT_TAGS,
    seoTitle: DEMO_PRODUCT_TITLE,
  });
  return 'created';
}

async function provisionDemoStore(ctx: ProvisionCtx, userId: string, email: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const business = await getOrCreateDemoBusiness(ctx, userId, email);
  if (!business) return;

  const businessLabel = business.action === 'created' ? 'creado' : 'actualizado';
  console.log(`🏪 Negocio ${businessLabel}: ${DEMO_BUSINESS_NAME} (slug: ${business.slug})`);
  console.log(`🔗 Tienda: ${appUrl}/${business.slug}`);

  const settingsAction = await upsertDemoBusinessSettings(ctx, business.id);
  console.log(
    `⚙️ Ajustes de tienda ${settingsAction === 'created' ? 'creados' : 'actualizados'} (theme por defecto)`,
  );

  const subAction = await upsertDemoSubscription(ctx, business.id);
  if (subAction === 'created') {
    console.log('📦 Suscripción creada (basico / active)');
  } else if (subAction === 'healed') {
    console.log('📦 Suscripción reactivada (basico / active)');
  } else {
    console.log('📦 Suscripción ya activa (se respeta el plan actual)');
  }

  const productAction = await upsertDemoProduct(ctx, business.id);
  console.log(
    `🛍️ Producto ${productAction === 'created' ? 'creado' : 'actualizado'}: ${DEMO_PRODUCT_TITLE} (S/ ${DEMO_PRODUCT_PRICE})`,
  );
}

async function main() {
  try {
    const cliArgs = parseCliArgs(process.argv.slice(2));

    if (cliArgs.help) {
      console.log(USAGE);
      process.exit(0);
    }

    const email = cliArgs.email ?? process.env.CULQI_TEST_EMAIL;
    const password = cliArgs.password ?? process.env.CULQI_TEST_PASSWORD;

    if (!email || !password) {
      console.error(
        '❌ Faltan credenciales. Pasalas con --email=... --password=... o con las variables ' +
          'de entorno CULQI_TEST_EMAIL / CULQI_TEST_PASSWORD.',
      );
      process.exit(1);
    }

    if (!email.includes('@')) {
      console.error(`❌ Email invalido: "${email}".`);
      process.exit(1);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        '❌ Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno ' +
          '(.env.local o .env).',
      );
      process.exit(1);
    }

    // Imports dinamicos para que dotenv se ejecute ANTES de que el cliente de
    // Drizzle lea DATABASE_URL. Se usa ../src/... porque tsx no resuelve @/.
    const { db } = await import('../src/core/database/client');
    const schema = await import('../src/core/database/schema');

    const ctx: ProvisionCtx = {
      db,
      businesses: schema.businesses,
      businessSlugAliases: schema.businessSlugAliases,
      businessSettings: schema.businessSettings,
      businessSubscriptions: schema.businessSubscriptions,
      products: schema.products,
    };

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const fullName = email.split('@')[0] || 'Culqi Test User';

    // Buscar usuario existente (version-safe: getUserByEmail no forma parte de
    // la superficie publica documentada de GoTrueAdminApi).
    const { data: listResult, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listError) throw listError;

    const existing = listResult.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    let userId: string;

    if (existing) {
      // Actualiza password + confirma email; la re-ejecucion converge (auto-cura
      // derivas de password) sin crear duplicados.
      const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(
        existing.id,
        { password, email_confirm: true },
      );
      if (updateError) throw updateError;
      userId = updated.user.id;

      await db
        .insert(schema.profiles)
        .values({ id: updated.user.id, email, fullName, providerId: 'email' })
        .onConflictDoUpdate({
          target: schema.profiles.id,
          set: { email, fullName, providerId: 'email' },
        });

      console.log(`✅ Usuario actualizado (id: ${updated.user.id})`);
    } else {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createError) throw createError;
      userId = created.user.id;

      await db
        .insert(schema.profiles)
        .values({ id: created.user.id, email, fullName, providerId: 'email' })
        .onConflictDoNothing({ target: schema.profiles.id });

      console.log(`✅ Usuario creado (id: ${created.user.id})`);
    }

    console.log(`📧 ${email}`);

    if (cliArgs.withStore) {
      await provisionDemoStore(ctx, userId, email);
    }

    console.log(
      cliArgs.withStore
        ? '🎉 Listo — el usuario tiene una tienda demo lista para probar el checkout.'
        : '🎉 Listo — el usuario puede iniciar sesion en /auth.',
    );
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
