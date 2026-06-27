// =====================================================
// DRIZZLE ORM SCHEMA - Virtual Stores Platform
// TABLES: businesses, business_slug_aliases, form_messages,
//         business_subscriptions, business_settings,
//         business_invitations, business_team_members,
//         business_team_roles, saas_issuer_config
// =====================================================

import { sql } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { subscriptionPlanEnum, subscriptionStatusEnum } from './enums';
import { profiles } from './profiles';

// =====================================================
// TABLE: businesses
// =====================================================

export const businesses = pgTable(
  'businesses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    coverImageUrl: text('cover_image_url'),
    heroImages: text('hero_images').array(),
    logoUrl: text('logo_url'),
    address: text('address'),
    storeType: text('store_type'),
    description: text('description'),
    whatsappNumber: text('whatsapp_number'),
    taxId: text('tax_id'),
    personType: text('person_type'),
    country: text('country'),
    city: text('city'),
    departamento: text('departamento'),
    provincia: text('provincia'),
    distrito: text('distrito'),
    email: text('email'),
    legalRepName: text('legal_rep_name'),
    legalRepRole: text('legal_rep_role'),
    legalRepPhone: text('legal_rep_phone'),
    legalRepEmail: text('legal_rep_email'),
    paymentFlow: text('payment_flow').array(),
    // SEO & Geolocation
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    geoRegion: text('geo_region'),
    geoPlacename: text('geo_placename'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    seoKeywords: text('seo_keywords').array(),
    // KYB Verification Fields
    verificationStatus: text('verification_status', {
      enum: ['unverified', 'pending', 'verified', 'rejected'],
    })
      .notNull()
      .default('unverified'),
    verificationData: jsonb('verification_data').default({}),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

    // ── Penalty System ──
    culqiBlocked: boolean('culqi_blocked').notNull().default(false),
    penaltyDebt: decimal('penalty_debt', { precision: 10, scale: 2 }).notNull().default('0'),
    penaltyCount: integer('penalty_count').notNull().default(0),
    blacklisted: boolean('blacklisted').notNull().default(false),
    blacklistedAt: timestamp('blacklisted_at', { withTimezone: true }),
  },
  (table) => ({
    // nameCheck: check(
    //   'name_length_check',
    //   sql`char_length(${table.name}) >= 3 AND char_length(${table.name}) <= 100`,
    // ),
    // slugCheck: check(
    //   'slug_format_check',
    //   sql`char_length(${table.slug}) >= 3 AND char_length(${table.slug}) <= 50 AND ${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    // ),
    // descriptionCheck: check(
    //   'description_length_check',
    //   sql`char_length(${table.description}) <= 1000`,
    // ),
    // whatsappCheck: check(
    //   'whatsapp_format_check',
    //   sql`${table.whatsappNumber} ~ '^\\+?[1-9]\\d{1,14}$'`,
    // ),
    // paymentFlowCheck: check(
    //   'payment_flow_length_check',
    //   sql`coalesce(array_length(${table.paymentFlow}, 1), 0) <= 5`,
    // ),
    ownerIdIdx: index('idx_businesses_owner_id').on(table.ownerId),
    slugIdx: index('idx_businesses_slug').on(table.slug),
    isActiveIdx: index('idx_businesses_is_active')
      .on(table.isActive)
      .where(sql`${table.isActive} = true`),
    createdAtIdx: index('idx_businesses_created_at').on(table.createdAt.desc()),
  }),
);

// =====================================================
// TABLE: business_slug_aliases
// =====================================================

export const businessSlugAliases = pgTable(
  'business_slug_aliases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // slugCheck: check(
    //   'business_slug_aliases_slug_format_check',
    //   sql`char_length(${table.slug}) >= 3 AND char_length(${table.slug}) <= 50 AND ${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    // ),
    businessIdIdx: index('idx_business_slug_aliases_business_id').on(table.businessId),
    slugIdx: index('idx_business_slug_aliases_slug').on(table.slug),
    createdAtIdx: index('idx_business_slug_aliases_created_at').on(table.createdAt.desc()),
  }),
);

// =====================================================
// TABLE: form_messages (Contact Form)
// =====================================================

export const formMessages = pgTable(
  'form_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    senderName: text('sender_name').notNull(),
    senderEmail: text('sender_email').notNull(),
    senderPhone: text('sender_phone'),
    messageText: text('message_text').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // senderNameCheck: check('sender_name_check', sql`char_length(${table.senderName}) >= 2`),
    // senderEmailCheck: check(
    //   'sender_email_check',
    //   sql`${table.senderEmail} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$'`,
    // ),
    // messageTextCheck: check(
    //   'message_text_check',
    //   sql`char_length(${table.messageText}) >= 10 AND char_length(${table.messageText}) <= 1000`,
    // ),
    businessIdIdx: index('idx_form_messages_business_id').on(table.businessId),
    isReadIdx: index('idx_form_messages_is_read')
      .on(table.businessId, table.isRead)
      .where(sql`${table.isRead} = false`),
    createdAtIdx: index('idx_form_messages_created_at').on(
      table.businessId,
      table.createdAt.desc(),
    ),
  }),
);

// =====================================================
// TABLE: business_subscriptions
// =====================================================

export const businessSubscriptions = pgTable(
  'business_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    planType: subscriptionPlanEnum('plan_type').notNull().default('basico'),
    planStatus: subscriptionStatusEnum('plan_status').notNull().default('inactive'),
    planStartDate: timestamp('plan_start_date', { withTimezone: true }),
    planEndDate: timestamp('plan_end_date', { withTimezone: true }),
    planUpdatedAt: timestamp('plan_updated_at', { withTimezone: true }).notNull().defaultNow(),
    gatewaySubscriptionId: text('gateway_subscription_id').unique(),
    gatewayCustomerId: text('gateway_customer_id'),
    gatewayPlanId: text('gateway_plan_id'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueBusinessSubscription: unique('unique_business_subscription').on(table.businessId),
    businessIdIdx: index('idx_business_subscriptions_business_id').on(table.businessId),
    gatewaySubIdIdx: index('idx_business_subscriptions_gateway_sub_id').on(
      table.gatewaySubscriptionId,
    ),
    createdAtIdx: index('idx_business_subscriptions_created_at').on(table.createdAt.desc()),
  }),
);

// =====================================================
// TABLE: business_settings
// =====================================================

export const businessSettings = pgTable(
  'business_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    themeMode: text('theme_mode', { enum: ['light', 'dark'] })
      .notNull()
      .default('light'),
    contrastLevel: text('contrast_level', { enum: ['standard', 'medium', 'high'] })
      .notNull()
      .default('standard'),
    customColors: jsonb('custom_colors').default({}),
    preferences: jsonb('preferences').default({}),
    culqiPublicKey: text('culqi_public_key'),
    culqiSecretKey: text('culqi_secret_key'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueBusinessSettings: unique('unique_business_settings').on(table.businessId),
    businessIdIdx: index('idx_business_settings_business_id').on(table.businessId),
  }),
);

// =====================================================
// TABLE: business_invitations
// =====================================================

export const businessInvitations = pgTable(
  'business_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    code: text('code').notNull().unique(),
    codeHash: text('code_hash').notNull(),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  },
  (table) => ({
    codeIdx: index('idx_business_invitations_code').on(table.code),
    businessIdIdx: index('idx_business_invitations_business_id').on(table.businessId),
    expiresIdx: index('idx_business_invitations_expires').on(table.expiresAt),
  }),
);

// =====================================================
// TABLE: business_team_members
// =====================================================

export const businessTeamMembers = pgTable(
  'business_team_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    customPermissions: jsonb('custom_permissions').$type<string[]>(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    invitationId: uuid('invitation_id').references(() => businessInvitations.id, {
      onDelete: 'set null',
    }),
  },
  (table) => ({
    uniqueBusinessUser: unique('unique_business_user').on(table.businessId, table.userId),
    businessIdIdx: index('idx_business_team_members_business_id').on(table.businessId),
    userIdIdx: index('idx_business_team_members_user_id').on(table.userId),
  }),
);

// =====================================================
// TABLE: business_team_roles
// =====================================================

export const businessTeamRoles = pgTable(
  'business_team_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    permissions: jsonb('permissions').$type<string[]>().default([]),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueBusinessRole: unique('unique_business_role').on(table.businessId, table.role),
    businessIdIdx: index('idx_business_team_roles_business_id').on(table.businessId),
  }),
);

// =====================================================
// TABLE: saas_issuer_config
// =====================================================

/**
 * Singleton con los datos fiscales del emisor SaaS (PN con Negocio).
 * Siempre tiene 1 sola fila con id = 1.
 * Actualizar directamente en BD cuando cambien datos fiscales.
 */
export const saasIssuerConfig = pgTable(
  'saas_issuer_config',
  {
    id: integer('id').primaryKey().default(1),
    ruc: text('ruc').notNull(),
    razonSocial: text('razon_social').notNull(),
    direccion: text('direccion').notNull(),
    distrito: text('distrito').notNull(),
    provincia: text('provincia').notNull(),
    departamento: text('departamento').notNull(),
    ubigeo: text('ubigeo'),
    logoUrl: text('logo_url'),
    igvRate: decimal('igv_rate', { precision: 5, scale: 4 }).notNull().default('0.18'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (_table) => ({
    // singleton: check('saas_issuer_singleton', sql`${_table.id} = 1`),
  }),
);

// =====================================================
// TYPE EXPORTS
// =====================================================

export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;

export type BusinessSubscription = typeof businessSubscriptions.$inferSelect;
export type NewBusinessSubscription = typeof businessSubscriptions.$inferInsert;

export type BusinessSettings = typeof businessSettings.$inferSelect;
export type NewBusinessSettings = typeof businessSettings.$inferInsert;

export type BusinessInvitation = typeof businessInvitations.$inferSelect;
export type NewBusinessInvitation = typeof businessInvitations.$inferInsert;

export type BusinessTeamMember = typeof businessTeamMembers.$inferSelect;
export type NewBusinessTeamMember = typeof businessTeamMembers.$inferInsert;

export type BusinessTeamRole = typeof businessTeamRoles.$inferSelect;
export type NewBusinessTeamRole = typeof businessTeamRoles.$inferInsert;

export type SaasIssuerConfig = typeof saasIssuerConfig.$inferSelect;
export type NewSaasIssuerConfig = typeof saasIssuerConfig.$inferInsert;
