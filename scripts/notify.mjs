#!/usr/bin/env node

/**
 * CLI helper para enviar notificaciones SASS → sellers.
 *
 * Uso:
 *   node scripts/notify.mjs "Título" "Mensaje" [--target all] [--category sistema]
 *
 * Ejemplos:
 *   node scripts/notify.mjs "Novedad" "Ahora podés personalizar tu tienda"
 *   node scripts/notify.mjs "Oferta" "Plan Pro 50% OFF" --target all --category plan
 *
 * Variables de entorno:
 *   SASS_API_KEY        — clave configurada en el servidor
 *   SASS_API_URL        — URL base (default: http://localhost:3000)
 */

const API_URL = process.env.SASS_API_URL || 'http://localhost:3000';
const API_KEY = process.env.SASS_API_KEY;

if (!API_KEY) {
  console.error('❌ SASS_API_KEY no configurada');
  console.error('   export SASS_API_KEY=tu-clave');
  process.exit(1);
}

const [title, message] = process.argv.slice(2);

if (!title || !message) {
  console.error('❌ Uso: node scripts/notify.mjs "Título" "Mensaje" [--target all]');
  console.error('');
  console.error('   --target all                 (default)');
  console.error('   --target id1,id2,id3         business IDs separados por coma');
  console.error('   --category sistema           (default: sistema)');
  console.error('   --type system                (default: system)');
  process.exit(1);
}

// Parsear flags
const args = process.argv.slice(4);
const flags = {};
for (let i = 0; i < args.length; i += 2) {
  if (args[i].startsWith('--')) {
    flags[args[i].slice(2)] = args[i + 1];
  }
}

const target = flags.target || 'all';
const category = flags.category || 'sistema';
const type = flags.type || 'system';

const body = {
  title,
  message,
  category,
  type,
  target: target === 'all' ? 'all' : target.split(','),
};

console.log(`📨 Enviando notificación...`);
console.log(`   Título:   ${title}`);
console.log(`   Target:   ${target}`);
console.log(`   API:      ${API_URL}/api/sass/notifications/broadcast`);

try {
  const res = await fetch(`${API_URL}/api/sass/notifications/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-sass-key': API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`❌ Error (${res.status}):`, data.error || JSON.stringify(data));
    process.exit(1);
  }

  console.log(`✅ Enviadas: ${data.sent} / ${data.total}`);
  if (data.errors > 0) {
    console.warn(`⚠️  Fallos: ${data.errors}`);
  }
} catch (error) {
  console.error('❌ Error de conexión:', error.message);
  process.exit(1);
}
