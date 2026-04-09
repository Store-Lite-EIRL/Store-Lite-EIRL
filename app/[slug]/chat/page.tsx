import { db } from '@/core/database/client';
import { businesses } from '@/core/database/schema';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getMemberPermissions } from '@/lib/permissions/checkPermission';
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
    columns: { id: true, name: true, description: true, ownerId: true },
  });

  if (!business) {
    return notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/list-business');
  }

  const { isOwner, permissions } = await getMemberPermissions(business.id, user.id);

  if (!isOwner && !permissions.includes('chat.view')) {
    redirect('/list-business');
  }

  const canRespond = isOwner || permissions.includes('chat.respond');
  const canManage = isOwner || permissions.includes('chat.delete');

  return (
    <ChatClient
      slug={slug}
      storeName={business.name}
      storeDescription={business.description || ''}
      businessId={business.id}
      canRespond={canRespond}
      canManage={canManage}
    />
  );
}
