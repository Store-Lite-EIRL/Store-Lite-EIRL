// =====================================================
// DRIZZLE ORM SCHEMA - Virtual Stores Platform
// =====================================================
// Description: Complete TypeScript schema for all tables
// Usage: Import from '@/database/schema' in your application
// =====================================================

import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// =====================================================
// ENUMS
// =====================================================

export const themeModeEnum = pgEnum('theme_mode', ['light', 'dark']);
export const contrastLevelEnum = pgEnum('contrast_level', ['standard', 'medium', 'high']);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'validando',
  'not_delivered',
  'delivered',
  'en_reparto',
  // @deprecated — legacy status, kept for backward compatibility with existing DB records
  'esperando_confirmacion',
  'completed',
  'failed',
  'disputed',
  'refund_requested',
  'refunded',
]);
export const paymentMethodEnum = pgEnum('payment_method', ['card', 'yape', 'plin']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'basico',
  'emprendedor',
  'business_pro',
  'enterprise_ai',
]);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'inactive',
  'past_due',
  'canceled',
  'expired',
  'trialing',
]);
export const shippingTypeEnum = pgEnum('shipping_type', ['agencia', 'domicilio', 'recojo']);
export const planPaymentStatusEnum = pgEnum('plan_payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
  'disputed',
]);

// =====================================================
// NOTIFICATION ENUMS
// =====================================================

// Tipos de notificación - acción específica que ocurrió
export const notificationTypeEnum = pgEnum('notification_type', [
  // Chat
  'message_new',
  'message_unread',
  // Almacén (stock)
  'stock_low',
  'stock_out',
  // Plan
  'plan_expiring',
  'plan_expired',
  'plan_upgraded',
  // Pedidos
  'order_created',
  'order_status_changed',
  'order_shipped',
  'order_finalization_requested',
  'order_finalization_confirmed',
  'order_finalization_rejected',
  'order_auto_finalized',
  // Sistema
  'system',
]);

// Categorías de notificación - para filtrado en UI
export const notificationCategoryEnum = pgEnum('notification_category', [
  'chat',
  'almacen',
  'plan',
  'pedidos',
  'sistema',
]);

// =====================================================
// TABLE: profiles
// =====================================================

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(), // Removed .references(() => authUsers.id) to fix drizzle-kit hangs
    email: text('email').notNull().unique(),
    fullName: text('full_name').notNull(),
    avatarUrl: text('avatar_url'),
    providerId: text('provider_id'), // 'google', 'github', etc.
    age: integer('age'),
    address: text('address'),
    phone: text('phone'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // ageCheck: check('age_check', sql`${table.age} >= 13 AND ${table.age} <= 120`),
    emailIdx: index('idx_profiles_email').on(table.email),
    fullNameIdx: index('idx_profiles_full_name').on(table.fullName),
  }),
);

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
    logoUrl: text('logo_url'),
    address: text('address'),
    storeType: text('store_type'),
    description: text('description'),
    whatsappNumber: text('whatsapp_number'),
    taxId: text('tax_id'),
    personType: text('person_type'),
    country: text('country'),
    city: text('city'),
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
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
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
// TABLE: product_categories
// =====================================================

export const productCategories = pgTable(
  'product_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    imageUrl: text('image_url'),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueBusinessCategory: unique('unique_business_category').on(table.businessId, table.slug),
    // nameCheck: check(
    //   'category_name_check',
    //   sql`char_length(${table.name}) >= 2 AND char_length(${table.name}) <= 50`,
    // ),
    businessIdIdx: index('idx_categories_business_id').on(table.businessId),
    businessSlugIdx: index('idx_categories_slug').on(table.businessId, table.slug),
    displayOrderIdx: index('idx_categories_display_order').on(table.businessId, table.displayOrder),
  }),
);

// =====================================================
// TABLE: products
// =====================================================

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => productCategories.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    secondPrice: decimal('second_price', { precision: 10, scale: 2 }),
    stock: integer('stock').notNull().default(0),
    currency: text('currency').notNull().default('PEN'),
    isAvailable: boolean('is_available').notNull().default(true),
    tags: text('tags').array(),
    stars: integer('stars').default(0),
    saleStatus: text('sale_status', { enum: ['MAS_VENDIDO', 'NUEVO_PRODUCTO', 'NORMAL'] })
      .notNull()
      .default('NORMAL'),
    brand: text('brand'),
    slug: text('slug'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    shippingInfo: text('shipping_info'),
    displayOrder: integer('display_order').default(0),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // titleCheck: check(
    //   'title_length_check',
    //   sql`char_length(${table.title}) >= 3 AND char_length(${table.title}) <= 200`,
    // ),
    // descriptionCheck: check(
    //   'description_length_check',
    //   sql`char_length(${table.description}) <= 2000`,
    // ),
    // priceCheck: check('price_check', sql`${table.price} >= 0`),
    // stockCheck: check('stock_check', sql`${table.stock} >= 0`),
    // currencyCheck: check('currency_check', sql`char_length(${table.currency}) = 3`),
    businessIdIdx: index('idx_products_business_id').on(table.businessId),
    categoryIdIdx: index('idx_products_category_id').on(table.categoryId),
    isAvailableIdx: index('idx_products_is_available')
      .on(table.isAvailable)
      .where(sql`${table.isAvailable} = true`),
    displayOrderIdx: index('idx_products_display_order').on(table.businessId, table.displayOrder),
    createdAtIdx: index('idx_products_created_at').on(table.createdAt.desc()),
    titleSearchIdx: index('idx_products_title_search').on(table.title),
    uniqueBusinessProductSlug: unique('unique_business_product_slug').on(
      table.businessId,
      table.slug,
    ),
    slugIdx: index('idx_products_slug').on(table.businessId, table.slug),
  }),
);

// =====================================================
// TABLE: product_media
// =====================================================

export const productMedia = pgTable(
  'product_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    mediaUrl: text('media_url').notNull(),
    mediaType: text('media_type', { enum: ['image', 'video'] })
      .notNull()
      .default('image'),
    displayOrder: integer('display_order').notNull().default(0),
    altText: text('alt_text'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    productIdIdx: index('idx_product_media_product_id').on(table.productId),
    displayOrderIdx: index('idx_product_media_display_order').on(
      table.productId,
      table.displayOrder,
    ),
  }),
);

// =====================================================
// TABLE: product_likes
// =====================================================

export const productLikes = pgTable(
  'product_likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    ipAddress: text('ip_address').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueProductLike: unique('unique_product_like').on(table.productId, table.ipAddress),
    productIdIdx: index('idx_product_likes_product_id').on(table.productId),
  }),
);

// =====================================================
// TABLE: chat_sessions
// =====================================================

export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'set null' }),
    guestId: text('guest_id').notNull(),
    guestName: text('guest_name').notNull(),
    guestGender: text('guest_gender').notNull(),
    status: text('status', { enum: ['active', 'closed'] }).default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    guestIdIdx: index('idx_chat_sessions_guest_id').on(table.guestId),
    businessIdIdx: index('idx_chat_sessions_business_id').on(table.businessId),
    paymentIdIdx: index('idx_chat_sessions_payment_id').on(table.paymentId),
  }),
);

// =====================================================
// TABLE: messages
// =====================================================

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    isFromStore: boolean('is_from_store').default(false),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    sessionIdIdx: index('idx_messages_session_id').on(table.sessionId),
    createdAtIdx: index('idx_messages_created_at').on(table.createdAt),
  }),
);

// =====================================================
// TABLE: payments
// =====================================================

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'restrict' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    sellerUserId: uuid('seller_user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'restrict' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('PEN'),
    paymentMethod: text('payment_method', { enum: ['card', 'yape', 'plin'] }).notNull(),
    culqiChargeId: text('culqi_charge_id').unique(),
    culqiReferenceCode: text('culqi_reference_code'),
    culqiTrackingId: text('culqi_tracking_id'),
    buyerEmail: text('buyer_email').notNull(),
    buyerPhone: text('buyer_phone'),
    buyerDni: text('buyer_dni'),
    trackingToken: text('tracking_token').notNull().unique(),
    status: text('status', {
      enum: [
        'pending',
        'paid',
        'validando',
        'not_delivered',
        'delivered',
        'completed',
        'failed',
        'disputed',
        'refund_requested',
        'refunded',
      ],
    })
      .notNull()
      .default('pending'),
    deliveryCodeHash: text('delivery_code_hash'),
    deliveryCodeExpiresAt: timestamp('delivery_code_expires_at', { withTimezone: true }),
    // Logistics & Shipping
    orderNumber: text('order_number'),
    shippingType: shippingTypeEnum('shipping_type'),
    shippingDepartment: text('shipping_department'),
    shippingProvince: text('shipping_province'),
    shippingDistrict: text('shipping_district'),
    shippingAddress: text('shipping_address'),
    shippingAgency: text('shipping_agency'),
    shippingReference: text('shipping_reference'),
    shippingPhone: text('shipping_phone'),
    shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }),
    ticketUrl: text('ticket_url'),
    ticketImageUrl: text('ticket_image_url'),
    rejectionReason: text('rejection_reason'),
    rejectionImage: text('rejection_image'),
    finalizationDeadline: timestamp('finalization_deadline', { withTimezone: true }),
    finalizationRequestedAt: timestamp('finalization_requested_at', { withTimezone: true }),
    finalizationConfirmedAt: timestamp('finalization_confirmed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    // Optimistic locking counter — incremented on every status change
    version: integer('version').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    businessIdIdx: index('idx_payments_business_id').on(table.businessId),
    productIdIdx: index('idx_payments_product_id').on(table.productId),
    sellerUserIdIdx: index('idx_payments_seller_user_id').on(table.sellerUserId),
    statusIdx: index('idx_payments_status').on(table.status),
    culqiChargeIdIdx: index('idx_payments_culqi_charge_id').on(table.culqiChargeId),
    createdAtIdx: index('idx_payments_created_at').on(table.createdAt.desc()),
  }),
);

// =====================================================
// TABLE: order_events — Audit trail for payment status changes
// =====================================================

export const orderEvents = pgTable(
  'order_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status'),
    toStatus: text('to_status').notNull(),
    // Who triggered the change: 'customer', 'seller', 'system'
    triggeredBy: text('triggered_by'),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    paymentIdIdx: index('idx_order_events_payment_id').on(table.paymentId),
    createdAtIdx: index('idx_order_events_created_at').on(table.createdAt.desc()),
  }),
);

// =====================================================
// TABLE: seller_payout_accounts
// =====================================================

export const sellerPayoutAccounts = pgTable(
  'seller_payout_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerUserId: uuid('seller_user_id')
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    documentType: text('document_type').notNull().default('DNI'),
    documentNumber: text('document_number').notNull(),
    bankName: text('bank_name').notNull(),
    bankAccountNumber: text('bank_account_number').notNull(),
    bankCci: text('bank_cci'),
    country: text('country').notNull().default('PE'),
    verified: boolean('verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sellerUserIdIdx: index('idx_payout_accounts_seller_user_id').on(table.sellerUserId),
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
  (table) => ({
    // singleton: check('saas_issuer_singleton', sql`${table.id} = 1`),
  }),
);

// =====================================================
// TABLE: plan_payments
// =====================================================

/**
 * Pagos de planes SaaS — completamente separado de payments (productos).
 * Incluye campos SUNAT: serie B001, correlativo secuencial, montos con/sin IGV.
 * Los precios base son SIN IGV. El IGV (18%) se calcula y almacena por separado.
 */
export const planPayments = pgTable(
  'plan_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'restrict' }),

    // Plan comprado
    planType: subscriptionPlanEnum('plan_type').notNull(),
    period: text('period', { enum: ['monthly', 'annual'] })
      .notNull()
      .default('monthly'),

    // Montos — SIN IGV base, IGV calculado encima
    amountSubtotal: decimal('amount_subtotal', { precision: 10, scale: 2 }).notNull(),
    amountIgv: decimal('amount_igv', { precision: 10, scale: 2 }).notNull(),
    amountTotal: decimal('amount_total', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('PEN'),

    // Pasarela de pago
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    culqiChargeId: text('culqi_charge_id').unique(),
    culqiReferenceCode: text('culqi_reference_code'),
    status: planPaymentStatusEnum('status').notNull().default('pending'),

    // Datos del comprador (merchant) para SUNAT
    buyerEmail: text('buyer_email').notNull(),
    buyerFullName: text('buyer_full_name'),
    buyerDocumentType: text('buyer_document_type'), // 'DNI' | 'RUC'
    buyerDocumentNumber: text('buyer_document_number'),
    buyerAddress: text('buyer_address'),

    // Comprobante SUNAT — serie B001 + correlativo secuencial
    ticketSeries: text('ticket_series').notNull().default('B001'),
    // ticketCorrelative: integer('ticket_correlative')
    //   .notNull()
    //   .default(sql`nextval('seq_plan_payment_b001')`),
    ticketCorrelative: integer('ticket_correlative').notNull(),

    // ticket_number se computa en query: ticketSeries || '-' || LPAD(ticketCorrelative, 8, '0')
    ticketUrl: text('ticket_url'),
    ticketIssuedAt: timestamp('ticket_issued_at', { withTimezone: true }),

    // Período de suscripción activado
    planStartDate: timestamp('plan_start_date', { withTimezone: true }),
    planEndDate: timestamp('plan_end_date', { withTimezone: true }),

    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    businessIdIdx: index('idx_plan_payments_business_id').on(table.businessId),
    statusIdx: index('idx_plan_payments_status').on(table.status),
    culqiChargeIdIdx: index('idx_plan_payments_culqi_charge').on(table.culqiChargeId),
    ticketIssuedAtIdx: index('idx_plan_payments_ticket_issued').on(table.ticketIssuedAt.desc()),
    createdAtIdx: index('idx_plan_payments_created_at').on(table.createdAt.desc()),
    uniqueCorrelative: unique('unique_plan_payment_correlative').on(
      table.ticketSeries,
      table.ticketCorrelative,
    ),
  }),
);

// =====================================================
// TABLE: notifications
// =====================================================

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),

    // Tipo de notificación (acción específica)
    type: notificationTypeEnum('type').notNull(),
    // Categoría para filtrado en UI
    category: notificationCategoryEnum('category').notNull(),

    // Contenido
    title: text('title').notNull(),
    message: text('message').notNull(),
    // Datos adicionales (orderId, productId, etc)
    data: jsonb('data').default({}),

    // Estado
    isRead: boolean('is_read').default(false).notNull(),
    isDismissed: boolean('is_dismissed').default(false).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp('read_at', { withTimezone: true }),
  },
  (table) => ({
    businessIdIdx: index('idx_notifications_business_id').on(table.businessId),
    businessIdCreatedAtIdx: index('idx_notifications_business_created').on(
      table.businessId,
      table.createdAt.desc(),
    ),
    unreadIdx: index('idx_notifications_unread')
      .on(table.businessId, table.isRead)
      .where(sql`${table.isRead} = false AND ${table.isDismissed} = false`),
    categoryIdx: index('idx_notifications_category').on(table.businessId, table.category),
  }),
);

// =====================================================
// RELATIONS
// =====================================================

export const profilesRelations = relations(profiles, ({ many }) => ({
  businesses: many(businesses),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [businesses.ownerId],
    references: [profiles.id],
  }),
  slugAliases: many(businessSlugAliases),
  settings: one(businessSettings, {
    fields: [businesses.id],
    references: [businessSettings.businessId],
  }),
  categories: many(productCategories),
  products: many(products),
  chatSessions: many(chatSessions),
  subscriptions: many(businessSubscriptions),
  invitations: many(businessInvitations),
  teamMembers: many(businessTeamMembers),
  teamRoles: many(businessTeamRoles),
  notifications: many(notifications),
}));

export const businessSlugAliasesRelations = relations(businessSlugAliases, ({ one }) => ({
  business: one(businesses, {
    fields: [businessSlugAliases.businessId],
    references: [businesses.id],
  }),
}));

export const businessSettingsRelations = relations(businessSettings, ({ one }) => ({
  business: one(businesses, {
    fields: [businessSettings.businessId],
    references: [businesses.id],
  }),
}));

export const businessSubscriptionsRelations = relations(businessSubscriptions, ({ one }) => ({
  business: one(businesses, {
    fields: [businessSubscriptions.businessId],
    references: [businesses.id],
  }),
}));

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  business: one(businesses, {
    fields: [productCategories.businessId],
    references: [businesses.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  business: one(businesses, {
    fields: [products.businessId],
    references: [businesses.id],
  }),
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  media: many(productMedia),
  likes: many(productLikes),
}));

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, {
    fields: [productMedia.productId],
    references: [products.id],
  }),
}));

export const productLikesRelations = relations(productLikes, ({ one }) => ({
  product: one(products, {
    fields: [productLikes.productId],
    references: [products.id],
  }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  business: one(businesses, {
    fields: [chatSessions.businessId],
    references: [businesses.id],
  }),
  payment: one(payments, {
    fields: [chatSessions.paymentId],
    references: [payments.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [messages.sessionId],
    references: [chatSessions.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  business: one(businesses, {
    fields: [payments.businessId],
    references: [businesses.id],
  }),
  product: one(products, {
    fields: [payments.productId],
    references: [products.id],
  }),
  seller: one(profiles, {
    fields: [payments.sellerUserId],
    references: [profiles.id],
  }),
  chatSessions: many(chatSessions),
}));

export const sellerPayoutAccountsRelations = relations(sellerPayoutAccounts, ({ one }) => ({
  seller: one(profiles, {
    fields: [sellerPayoutAccounts.sellerUserId],
    references: [profiles.id],
  }),
}));

// =====================================================
// RELATIONS: Team Collaboration
// =====================================================

export const businessInvitationsRelations = relations(businessInvitations, ({ one }) => ({
  business: one(businesses, {
    fields: [businessInvitations.businessId],
    references: [businesses.id],
  }),
  creator: one(profiles, {
    fields: [businessInvitations.createdBy],
    references: [profiles.id],
  }),
}));

export const businessTeamMembersRelations = relations(businessTeamMembers, ({ one }) => ({
  business: one(businesses, {
    fields: [businessTeamMembers.businessId],
    references: [businesses.id],
  }),
  user: one(profiles, {
    fields: [businessTeamMembers.userId],
    references: [profiles.id],
  }),
  invitation: one(businessInvitations, {
    fields: [businessTeamMembers.invitationId],
    references: [businessInvitations.id],
  }),
}));

export const businessTeamRolesRelations = relations(businessTeamRoles, ({ one }) => ({
  business: one(businesses, {
    fields: [businessTeamRoles.businessId],
    references: [businesses.id],
  }),
}));

export const planPaymentsRelations = relations(planPayments, ({ one }) => ({
  business: one(businesses, {
    fields: [planPayments.businessId],
    references: [businesses.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  business: one(businesses, {
    fields: [notifications.businessId],
    references: [businesses.id],
  }),
}));

// =====================================================
// TYPE EXPORTS
// =====================================================

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;

export type BusinessSubscription = typeof businessSubscriptions.$inferSelect;
export type NewBusinessSubscription = typeof businessSubscriptions.$inferInsert;

export type BusinessSettings = typeof businessSettings.$inferSelect;
export type NewBusinessSettings = typeof businessSettings.$inferInsert;

export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductMedia = typeof productMedia.$inferSelect;
export type NewProductMedia = typeof productMedia.$inferInsert;

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type ProductLike = typeof productLikes.$inferSelect;
export type NewProductLike = typeof productLikes.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type SellerPayoutAccount = typeof sellerPayoutAccounts.$inferSelect;
export type NewSellerPayoutAccount = typeof sellerPayoutAccounts.$inferInsert;

// Team collaboration types
export type BusinessInvitation = typeof businessInvitations.$inferSelect;
export type NewBusinessInvitation = typeof businessInvitations.$inferInsert;

export type BusinessTeamMember = typeof businessTeamMembers.$inferSelect;
export type NewBusinessTeamMember = typeof businessTeamMembers.$inferInsert;

export type BusinessTeamRole = typeof businessTeamRoles.$inferSelect;
export type NewBusinessTeamRole = typeof businessTeamRoles.$inferInsert;

export type SubscriptionPlan = (typeof subscriptionPlanEnum.enumValues)[number];
export type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number];

// Plan payments types
export type SaasIssuerConfig = typeof saasIssuerConfig.$inferSelect;
export type NewSaasIssuerConfig = typeof saasIssuerConfig.$inferInsert;

export type PlanPayment = typeof planPayments.$inferSelect;
export type NewPlanPayment = typeof planPayments.$inferInsert;

// Notification types
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];
export type NotificationCategory = (typeof notificationCategoryEnum.enumValues)[number];

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Helper: ticket number formatter (usar donde se necesite mostrar el número)
export function formatTicketNumber(series: string, correlative: number): string {
  return `${series}-${String(correlative).padStart(8, '0')}`;
}
