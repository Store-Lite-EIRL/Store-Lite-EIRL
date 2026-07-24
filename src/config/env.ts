export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  // Only available server-side — never expose to the client
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  // Feature flags
  // Order Flow V2 — nuevo ciclo de vida de 12 estados con state machine, timeline, attachments
  orderFlowV2: process.env.ORDER_FLOW_V2 === 'true',
  // Habilita el rewrite de subdominios en proxy.ts (Fase 2 de la migración a subdominios)
  featureSubdomainRewrite: process.env.FEATURE_SUBDOMAIN_REWRITE === 'true',
  // Dominio compartido para cookies cross-subdominio (Fase 4).
  //   Producción: `.store-lite.com`
  //   Desarrollo: `.localhost`
  //   null/empty → cookies host-only (comportamiento default, no cross-subdominio)
  sharedCookieDomain: process.env.SHARED_COOKIE_DOMAIN || null,
  // Factiliza API Configuration (Server-side only)
  jsonToken: process.env.JSON_TOKEN!,
  jsonWspInstance: process.env.JSON_WSP_INSTANCE!,
  // Twilio WhatsApp OTP Configuration (Server-side only)
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
  twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER!,
  // JSON.pe SMS — order notifications to customers
  jsonpeSmsToken: process.env.JSONPE_SMS_TOKEN!,
  // Culqi — al activar esta flag, solo se aceptan llaves _live (producción).
  //   false/omit → acepta cualquier key pk_/sk_ (desarrollo).
  //   true       → fuerza pk_live_ / sk_live_ al guardar credenciales.
  enforceLiveCulqiKeys: process.env.CULQI_ENFORCE_LIVE_KEYS === 'true',
  // Resend — transactional emails (Server-side only)
  resendApiKey: process.env.RESEND_API_KEY!,
  resendFromEmail: process.env.RESEND_FROM_EMAIL!,
  // OTP Hashing (Server-side only)
  // Usado como HMAC secret para hashear OTPs antes de almacenarlos en DB.
  // En producción, debe ser un string aleatorio fuerte. Si no se configura,
  // se usa un fallback para dev — pero OJO, no es seguro para producción.
  otpHashSecret: process.env.OTP_HASH_SECRET || 'dev-fallback-otp-secret-not-for-production',
} as const;

// Optional: Add validation here to throw early if vars are missing
if (!env.supabaseUrl || !env.supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Some features may not work.');
}

// Twilio validation
if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioWhatsAppNumber) {
  console.warn('Twilio environment variables are missing. WhatsApp OTP will not work.');
}

// Resend validation
if (!env.resendApiKey || !env.resendFromEmail) {
  console.warn('Resend environment variables are missing. Email notifications will not work.');
}

// OTP hash secret: warn if using dev fallback
if (!process.env.OTP_HASH_SECRET) {
  console.warn(
    '[OTP] OTP_HASH_SECRET not set. Using DEV FALLBACK — DO NOT USE IN PRODUCTION. ' +
      'Set a strong random string in production.',
  );
}
