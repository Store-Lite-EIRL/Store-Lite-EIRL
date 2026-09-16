// =====================================================
// FAKE DRIZZLE CLIENT — in-memory relational store (test-only)
// =====================================================
// An in-memory fake of the drizzle `db` client used to exercise the REAL
// query-building + row-filtering logic of DB-layer functions (e.g.
// complaintScoring.ts, incompleteOrderRate.ts) without a live Postgres.
//
// The repo has no DB-integration harness (the client in
// src/core/database/client.ts is a real postgres-js connection), so unit
// tests follow the existing convention of mocking '@/core/database/client'
// — but with REAL filtering semantics over seeded rows instead of canned
// return values.
//
// Usage in a test file:
//   const state = vi.hoisted(() => ({ seed: null as any, db: null as any }));
//   vi.mock('@/core/database/client', async () => {
//     const { createFakeDb } = await import('./helpers/fakeDrizzle');
//     const inst = createFakeDb();
//     state.seed = inst.seed;
//     state.db = inst.db;
//     return { db: inst.db };
//   });
//
// The '@/core/database/schema' mock must expose string columns and string
// operators (eq/and/gte/lt) that render predicates like
// `businessId=biz-1 AND createdAt>=<date>`; each table object must carry an
// `__tableName` marker ('complaints' | 'payments') so select().from() can
// resolve the target table.
// =====================================================

interface WhereOptions {
  where?: string;
  limit?: number;
  columns?: Record<string, boolean>;
}

export interface FakeDbInstance {
  db: {
    query: {
      complaintBookRecords: {
        findFirst: (opts: WhereOptions) => Promise<Record<string, unknown> | undefined>;
        findMany: (opts: WhereOptions) => Promise<Record<string, unknown>[]>;
      };
      payments: {
        findFirst: (opts: WhereOptions) => Promise<Record<string, unknown> | undefined>;
      };
    };
    select: (columns: Record<string, unknown>) => {
      from: (table: { __tableName?: string }) => {
        where: (whereExpr: string) => Promise<Record<string, unknown>[]>;
      };
    };
  };
  tables: { complaints: Record<string, unknown>[]; payments: Record<string, unknown>[] };
  seed: (data: {
    complaints?: Record<string, unknown>[];
    payments?: Record<string, unknown>[];
  }) => void;
}

/**
 * Evaluate a mocked-drizzle predicate string (`businessId=biz-1 AND ...`)
 * against an in-memory row. Lenient for unknown shapes (keeps the row).
 */
export function matchesWhere(row: Record<string, unknown>, whereExpr?: string): boolean {
  if (!whereExpr) return true;
  const predicateRe = /^([a-zA-Z_]\w*)\s*(>=|<=|>|<|=)\s*(.+)$/;
  return whereExpr.split(' AND ').every((part) => {
    const match = part.trim().match(predicateRe);
    if (!match) return true; // unknown predicate shape — keep the row
    const [, col, op, raw] = match;
    return compare(row[col], op, raw.trim());
  });
}

function compare(rowVal: unknown, op: string, rawVal: string): boolean {
  const rowAsDate = rowVal instanceof Date ? rowVal.getTime() : NaN;
  const rawAsNumber = rawVal === '' ? NaN : Number(rawVal);
  const rawAsDate = Number.isNaN(rawAsNumber) ? new Date(rawVal).getTime() : NaN;

  let a: number | string;
  let b: number | string;
  if (!Number.isNaN(rowAsDate)) {
    // Date column: numeric comparison against a parseable raw date/number
    a = rowAsDate;
    b = Number.isNaN(rawAsDate) ? rawAsNumber : rawAsDate;
  } else if (!Number.isNaN(rawAsNumber)) {
    a = Number(rowVal);
    b = rawAsNumber;
  } else {
    a = String(rowVal);
    b = rawVal;
  }

  switch (op) {
    case '=':
      return a === b;
    case '>':
      return a > b;
    case '>=':
      return a >= b;
    case '<':
      return a < b;
    case '<=':
      return a <= b;
    default:
      return true;
  }
}

export function createFakeDb(): FakeDbInstance {
  const tables: FakeDbInstance['tables'] = {
    complaints: [],
    payments: [],
  };

  const filterRows = (
    tableName: keyof FakeDbInstance['tables'],
    whereExpr?: string,
  ): Record<string, unknown>[] => tables[tableName].filter((row) => matchesWhere(row, whereExpr));

  const db: FakeDbInstance['db'] = {
    query: {
      complaintBookRecords: {
        findFirst: (opts) => Promise.resolve(filterRows('complaints', opts?.where)[0]),
        findMany: (opts) => {
          const rows = filterRows('complaints', opts?.where);
          return Promise.resolve(
            typeof opts?.limit === 'number' ? rows.slice(0, opts.limit) : rows,
          );
        },
      },
      payments: {
        findFirst: (opts) => Promise.resolve(filterRows('payments', opts?.where)[0]),
      },
    },
    select: () => ({
      from: (table) => ({
        where: (whereExpr: string) => {
          const tableName: keyof FakeDbInstance['tables'] =
            table.__tableName === 'payments' ? 'payments' : 'complaints';
          return Promise.resolve(filterRows(tableName, whereExpr));
        },
      }),
    }),
  };

  const seed: FakeDbInstance['seed'] = (data) => {
    tables.complaints.length = 0;
    tables.payments.length = 0;
    tables.complaints.push(...(data.complaints ?? []));
    tables.payments.push(...(data.payments ?? []));
  };

  return { db, tables, seed };
}
