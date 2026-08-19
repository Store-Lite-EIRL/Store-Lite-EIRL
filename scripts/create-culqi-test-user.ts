// =====================================================
// PROVISION: Crear/actualizar el usuario de validación Culqi
// =====================================================
// Description: Crea (o actualiza si ya existe) UN usuario de prueba
// con email+password para que el equipo de revisión de Culqi pueda
// iniciar sesión en /auth. Idempotente: re-ejecutar converge sin duplicar.
// Las credenciales NUNCA se hardcodean — se pasan por variables de
// entorno CULQI_TEST_EMAIL / CULQI_TEST_PASSWORD o por CLI:
//   --email=... --password=... (los argumentos CLI tienen prioridad).
// =====================================================
// Ejecutar: npx tsx scripts/create-culqi-test-user.ts --email=... --password='...'
// =====================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Precedencia de Next.js: .env.local gana sobre .env. dotenv no pisa claves
// ya definidas en process.env, por lo que cargar .env.local primero respeta
// esa precedencia.
dotenv.config({ path: ['.env.local', '.env'] });

function parseCliArgs(argv: string[]): { email?: string; password?: string } {
  const args: Record<string, string> = {};
  for (const arg of argv) {
    if (arg.startsWith('--email=')) args.email = arg.slice('--email='.length);
    else if (arg.startsWith('--password=')) args.password = arg.slice('--password='.length);
  }
  return args;
}

async function main() {
  try {
    const cliArgs = parseCliArgs(process.argv.slice(2));
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
    const { profiles } = await import('../src/core/database/schema');

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

    if (existing) {
      // Actualiza password + confirma email; la re-ejecucion converge (auto-cura
      // derivas de password) sin crear duplicados.
      const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(
        existing.id,
        { password, email_confirm: true },
      );
      if (updateError) throw updateError;

      await db
        .insert(profiles)
        .values({ id: updated.user.id, email, fullName, providerId: 'email' })
        .onConflictDoUpdate({
          target: profiles.id,
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

      await db
        .insert(profiles)
        .values({ id: created.user.id, email, fullName, providerId: 'email' })
        .onConflictDoNothing({ target: profiles.id });

      console.log(`✅ Usuario creado (id: ${created.user.id})`);
    }

    console.log(`📧 ${email}`);
    console.log('🎉 Listo — el usuario puede iniciar sesion en /auth.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
