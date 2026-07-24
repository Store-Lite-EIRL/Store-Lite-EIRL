// =====================================================
// DRIZZLE KIT CONFIGURATION
// =====================================================
// Description: Configuration for Drizzle Kit migrations
// Usage: Used by drizzle-kit commands (generate, push, migrate)
// =====================================================

import * as dotenv from 'dotenv';
import type { Config } from 'drizzle-kit';

dotenv.config();

export default {
  schema: './src/core/database/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  schemaFilter: ['public'], // 🔥 Fix: Only look at public tables to avoid timeouts
} satisfies Config;
