import { describe, expect, test } from 'vitest';

// =====================================================
// PAYMENT ORDERS SCHEMA — Unit tests
// =====================================================

describe('paymentMethodEnum', () => {
  test('includes all 6 payment methods', async () => {
    const { paymentMethodEnum } = await import('@/core/database/schema');

    const values = paymentMethodEnum.enumValues;
    expect(values).toContain('card');
    expect(values).toContain('yape');
    expect(values).toContain('plin');
    expect(values).toContain('pago_efectivo');
    expect(values).toContain('billetera_movil');
    expect(values).toContain('cuotealo');
    expect(values).toHaveLength(6);
  });
});

describe('orderStatusEnum', () => {
  test('includes all 4 order statuses', async () => {
    const { orderStatusEnum } = await import('@/core/database/schema');

    const values = orderStatusEnum.enumValues;
    expect(values).toContain('pending');
    expect(values).toContain('paid');
    expect(values).toContain('expired');
    expect(values).toContain('cancelled');
    expect(values).toHaveLength(4);
  });
});

describe('paymentOrders table', () => {
  const expectedColumns = [
    { jsName: 'id', dbName: 'id', notNull: true },
    { jsName: 'businessId', dbName: 'business_id', notNull: true },
    { jsName: 'culqiOrderId', dbName: 'culqi_order_id', notNull: true },
    { jsName: 'amount', dbName: 'amount', notNull: true },
    { jsName: 'currency', dbName: 'currency', notNull: true },
    { jsName: 'status', dbName: 'status', notNull: true },
    { jsName: 'paymentMethod', dbName: 'payment_method', notNull: true },
    { jsName: 'paymentCode', dbName: 'payment_code', notNull: false },
    { jsName: 'qrUrl', dbName: 'qr_url', notNull: false },
    { jsName: 'buyerEmail', dbName: 'buyer_email', notNull: true },
    { jsName: 'buyerPhone', dbName: 'buyer_phone', notNull: false },
    { jsName: 'expirationDate', dbName: 'expiration_date', notNull: true },
    { jsName: 'metadata', dbName: 'metadata', notNull: false },
    { jsName: 'createdAt', dbName: 'created_at', notNull: true },
    { jsName: 'updatedAt', dbName: 'updated_at', notNull: true },
  ];

  test('table name is payment_orders', async () => {
    const { paymentOrders } = await import('@/core/database/schema');
    const { getTableConfig } = await import('drizzle-orm/pg-core');

    const config = getTableConfig(paymentOrders);
    expect(config.name).toBe('payment_orders');
  });

  test('defines all expected columns', async () => {
    const { paymentOrders } = await import('@/core/database/schema');
    const { getTableConfig } = await import('drizzle-orm/pg-core');

    const config = getTableConfig(paymentOrders);
    const columns = config.columns;

    // Verify column count
    expect(columns).toHaveLength(expectedColumns.length);

    // Verify each column exists with correct DB name
    for (const expected of expectedColumns) {
      const col = columns.find((c) => c.name === expected.dbName);
      expect(col).toBeDefined();
      expect(col.notNull).toBe(expected.notNull);
    }
  });

  test('has unique constraint on culqiOrderId (DB: culqi_order_id)', async () => {
    const { paymentOrders } = await import('@/core/database/schema');
    const { getTableConfig } = await import('drizzle-orm/pg-core');

    const config = getTableConfig(paymentOrders);
    const culqiCol = config.columns.find((c) => c.name === 'culqi_order_id');

    expect(culqiCol).toBeDefined();
    expect(culqiCol.isUnique).toBe(true);
    expect(culqiCol.uniqueName).toBe('payment_orders_culqi_order_id_unique');
  });

  test('has foreign key constraint referencing businesses', async () => {
    const { paymentOrders } = await import('@/core/database/schema');
    const { getTableConfig } = await import('drizzle-orm/pg-core');

    const config = getTableConfig(paymentOrders);
    // Verify at least one FK exists (the business_id reference).
    expect(config.foreignKeys.length).toBeGreaterThanOrEqual(1);

    const fk = config.foreignKeys[0];
    expect(fk.onDelete).toBe('restrict');
  });

  test('has indexes on culqiOrderId, businessId, and status', async () => {
    const { paymentOrders } = await import('@/core/database/schema');
    const { getTableConfig } = await import('drizzle-orm/pg-core');

    const config = getTableConfig(paymentOrders);
    const indexNames = config.indexes.map((idx) => idx.config.name);

    expect(indexNames).toContain('idx_payment_orders_culqi_order_id');
    expect(indexNames).toContain('idx_payment_orders_business_id');
    expect(indexNames).toContain('idx_payment_orders_status');
    expect(indexNames).toHaveLength(3);
  });
});

describe('paymentOrdersRelations', () => {
  test('defines a belongs-to-business relation', async () => {
    const { paymentOrdersRelations } = await import('@/core/database/schema');

    expect(paymentOrdersRelations).toBeDefined();
  });
});

describe('PaymentOrder types', () => {
  test('paymentOrders table is exported', async () => {
    const mod = await import('@/core/database/schema');

    // Verify the table is exported (types like PaymentOrder are compile-time only)
    expect(mod.paymentOrders).toBeDefined();
  });
});
