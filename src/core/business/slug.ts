import { db } from '@/core/database/client';
import { businessSlugAliases, businesses } from '@/core/database/schema';
import { and, eq, ne } from 'drizzle-orm';

export interface ResolvedBusinessSlug {
  business: typeof businesses.$inferSelect;
  canonicalSlug: string;
  requestedSlug: string;
  matchedAlias: boolean;
}

export async function resolveBusinessSlug(slug: string): Promise<ResolvedBusinessSlug | null> {
  const directBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
  });

  if (directBusiness) {
    return {
      business: directBusiness,
      canonicalSlug: directBusiness.slug,
      requestedSlug: slug,
      matchedAlias: false,
    };
  }

  const alias = await db.query.businessSlugAliases.findFirst({
    where: eq(businessSlugAliases.slug, slug),
    with: {
      business: true,
    },
  });

  if (!alias?.business) {
    return null;
  }

  return {
    business: alias.business,
    canonicalSlug: alias.business.slug,
    requestedSlug: slug,
    matchedAlias: true,
  };
}

export async function isBusinessSlugTaken(
  slug: string,
  options?: { excludeBusinessId?: string },
): Promise<boolean> {
  const businessConflict = await db.query.businesses.findFirst({
    where: options?.excludeBusinessId
      ? and(eq(businesses.slug, slug), ne(businesses.id, options.excludeBusinessId))
      : eq(businesses.slug, slug),
    columns: { id: true },
  });

  if (businessConflict) {
    return true;
  }

  const aliasConflict = await db.query.businessSlugAliases.findFirst({
    where: eq(businessSlugAliases.slug, slug),
    columns: { id: true, businessId: true },
  });

  if (!aliasConflict) {
    return false;
  }

  if (options?.excludeBusinessId && aliasConflict.businessId === options.excludeBusinessId) {
    return false;
  }

  return true;
}

export async function generateAvailableBusinessSlug(
  generator: () => string,
  options?: { excludeBusinessId?: string; maxAttempts?: number },
): Promise<string> {
  const maxAttempts = options?.maxAttempts ?? 10;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const slug = generator();
    if (!(await isBusinessSlugTaken(slug, options))) {
      return slug;
    }
  }

  throw new Error('No se pudo generar un slug disponible.');
}

export function replaceSlugInPath(pathname: string, requestedSlug: string, canonicalSlug: string) {
  if (requestedSlug === canonicalSlug) {
    return pathname;
  }

  const requestedPrefix = `/${requestedSlug}`;
  if (pathname === requestedPrefix) {
    return `/${canonicalSlug}`;
  }

  if (pathname.startsWith(`${requestedPrefix}/`)) {
    return `/${canonicalSlug}${pathname.slice(requestedPrefix.length)}`;
  }

  return pathname;
}
