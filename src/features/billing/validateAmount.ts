// =====================================================
// validateAmount — authoritative server-side price check
// =====================================================
// Computes the authoritative amount (in cents) from the DB
// for a product or cart, and compares it against the
// client-supplied amount to prevent price tampering.
// =====================================================

import { db } from '@/core/database/client';
import { products } from '@/core/database/schema';
import { and, eq, inArray } from 'drizzle-orm';

export interface ValidateAmountParams {
  productId: string;
  businessId: string;
  /** Amount in cents as sent by the client */
  clientAmount: number;
  cartItems?: { id: string; quantity: number }[];
}

export interface ValidateAmountResult {
  ok: boolean;
  /** Authoritative amount in cents (present when ok) */
  serverAmount?: number;
  error?: string;
}

/**
 * Validates that the client-supplied amount (in cents) matches the
 * authoritative price computed from the database.
 *
 * Uses `secondPrice` when present, falling back to `price`.
 * Computes a single query for all items (no N+1).
 */
export async function validateAmount({
  productId,
  businessId,
  clientAmount,
  cartItems,
}: ValidateAmountParams): Promise<ValidateAmountResult> {
  const items = cartItems && cartItems.length > 0 ? cartItems : [{ id: productId, quantity: 1 }];
  const productIds = items.map((item) => item.id);

  const rows = await db
    .select({ id: products.id, price: products.price, secondPrice: products.secondPrice })
    .from(products)
    .where(and(eq(products.businessId, businessId), inArray(products.id, productIds)));

  const rowsByProduct = new Map(rows.map((row) => [row.id, row]));

  let serverAmount = 0;
  for (const item of items) {
    const product = rowsByProduct.get(item.id);
    if (!product) {
      return { ok: false, error: 'Producto no encontrado' };
    }

    const price = Number(product.secondPrice ?? product.price);
    if (price <= 0) {
      return { ok: false, error: 'Precio de producto inválido' };
    }

    serverAmount += price * 100 * item.quantity;
  }

  if (serverAmount !== clientAmount) {
    return { ok: false, error: 'El monto no coincide con el precio del producto' };
  }

  return { ok: true, serverAmount };
}
