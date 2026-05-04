export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  // Only available server-side — never expose to the client
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  // Factiliza API Configuration (Server-side only)
  factilizaToken: process.env.FACTILIZA_TOKEN!,
  factilizaWspInstance: process.env.FACTILIZA_WSP_INSTANCE!,
} as const;

// Optional: Add validation here to throw early if vars are missing
if (!env.supabaseUrl || !env.supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Some features may not work.');
}

// Factiliza validation
if (!env.factilizaToken || !env.factilizaWspInstance) {
  console.warn('Factiliza environment variables are missing. KYB verification will not work.');
}
