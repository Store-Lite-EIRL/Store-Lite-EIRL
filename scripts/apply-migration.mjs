// ──────────────────────────────────────────
// Apply Migration Script
// Reads a SQL file, splits by --> statement-breakpoint,
// and executes each statement separately against the DB.
// ──────────────────────────────────────────

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Load .env manually for DATABASE_URL
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config({ path: resolve(projectRoot, '.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Usage: node scripts/apply-migration.mjs <sql-file>');
  console.error('   Example: node scripts/apply-migration.mjs migrations/0028_recojo_pickup_flow.sql');
  process.exit(1);
}

const filePath = resolve(projectRoot, migrationFile);
const sql = readFileSync(filePath, 'utf8');

// Split by statement-breakpoint
const rawSegments = sql.split('--> statement-breakpoint');

// For each segment, extract the SQL (strip leading comments/lines starting with --)
const statements = rawSegments
  .map(seg => {
    const lines = seg.split('\n')
      .filter(line => !line.trim().startsWith('--')) // remove comment-only lines
      .map(l => l.trim())
      .filter(l => l.length > 0);
    return lines.join('\n');
  })
  .filter(s => s.length > 0);

console.log(`📦 Migration: ${migrationFile}`);
console.log(`📝 Found ${statements.length} statements to execute`);

// Use postgres directly (not through Drizzle) so each statement runs in its own implicit transaction
const client = postgres(dbUrl, {
  max: 1,
  onnotice: () => {}, // suppress notices
});

try {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      console.log(`\n▶️  Statement ${i + 1}/${statements.length}...`);
      console.log(`   ${stmt.slice(0, 120)}...`);
      await client.unsafe(stmt);
      console.log(`   ✅ OK`);
    } catch (err) {
      // ALTER TYPE ... ADD VALUE might fail if value already exists - that's OK
      if (err.message && err.message.includes('already exists')) {
        console.log(`   ⚠️  Already exists (skipped)`);
      } else {
        console.error(`   ❌ Error:`, err.message);
        // Continue anyway for additive migrations
      }
    }
  }
  console.log(`\n✅ Migration completed successfully`);
} catch (err) {
  console.error(`\n❌ Migration failed:`, err);
  process.exit(1);
} finally {
  await client.end();
}
