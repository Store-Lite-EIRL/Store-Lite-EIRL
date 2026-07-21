import { resolveBusinessSlug } from '@/core/business/slug';
import { notFound } from 'next/navigation';

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = (await resolveBusinessSlug(slug))?.business;

  if (!business) {
    return notFound();
  }

  return <>{children}</>;
}
