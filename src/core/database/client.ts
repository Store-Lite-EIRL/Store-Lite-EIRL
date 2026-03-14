// =====================================================
// DRIZZLE DATABASE CLIENT
// =====================================================
// Description: Configured Drizzle client for database operations
// Usage: Import { db } from '@/database/client' in your app
// =====================================================

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection pooling configuration for Supabase
// Uses transaction mode pooler for serverless compatibility
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL or POSTGRES_URL environment variable is not set. Please check your production configuration.',
  );
}

// Create postgres client with connection pooling
const client = postgres(connectionString, {
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // Connection timeout 10s
  onnotice: (notice) => {
    if (notice.severity === 'FATAL' || notice.severity === 'ERROR') {
      console.error('[DB NOTICE]:', notice.message);
    }
  },
});

// Initialize Drizzle with schema
export const db = drizzle(client, { schema });

// Export schema for use in queries
export { schema };
