import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChatClient } from './components/ChatClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
  });

  if (!business) {
    return {
      title: 'Negocio No Encontrado | Store Lite',
    };
  }

  return {
    title: `Mensajes - ${business.name} | Store Lite`,
    description: `Centro de mensajes para ${business.name}`,
  };
}

export default async function ChatPage({ params }: Props) {
  const { slug } = await params;
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
  });

  if (!business) {
    return notFound();
  }

  return (
    <ChatClient
      slug={slug}
      storeName={business.name}
      storeDescription={business.description || ''}
    />
  );
}
