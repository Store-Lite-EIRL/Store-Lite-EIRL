// =====================================================
// DRIZZLE ORM SCHEMA - Virtual Stores Platform
// TABLES: product_categories, products, product_media, product_likes
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

import { businesses } from './businesses';

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
    externalCode: text('external_code'),
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
// TYPE EXPORTS
// =====================================================

export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductMedia = typeof productMedia.$inferSelect;
export type NewProductMedia = typeof productMedia.$inferInsert;

export type ProductLike = typeof productLikes.$inferSelect;
export type NewProductLike = typeof productLikes.$inferInsert;
