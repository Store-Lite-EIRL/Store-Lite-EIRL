/**
 * Shared WhatsApp channel upsert with a cross-tenant ownership guard.
 *
 * `whatsapp_channels.ycloud_phone_number_id` is UNIQUE. Both onboarding
 * routes (init adopt + complete bind) may encounter a stale INACTIVE row
 * that already owns the number. Reactivating it is only safe when the row
 * belongs to the SAME authenticated business — otherwise the upsert refuses
 * and returns `conflict`, leaving the foreign tenant's channel untouched.
 *
 * The caller decides the target state (isActive, connectionStatus):
 *   - init (adopt an already-CONNECTED number) → connected / isActive true
 *   - complete (bind a fresh onboarding number) → pending / isActive false
 * The webhook/poll flips the channel to connected afterwards.
 */

import { db } from '@/core/database/client';
import { whatsappChannels } from '@/core/database/schema';
import { eq } from 'drizzle-orm';

import type { PhoneChannelStatus } from './phoneChannelStatus';

export type ChannelUpsertOutcome =
  | { outcome: 'inserted' }
  | { outcome: 'reactivated' }
  | { outcome: 'conflict'; reason: 'phone_number_belongs_to_another_business' };

export interface ChannelUpsertInput {
  businessId: string;
  ycloudPhoneNumberId: string;
  wabaId: string;
  displayPhoneNumber: string | null;
  connectionStatus: PhoneChannelStatus;
  isActive: boolean;
  connectedAt: Date | null;
}

export async function upsertWhatsappChannel(
  input: ChannelUpsertInput,
): Promise<ChannelUpsertOutcome> {
  const owner = await db.query.whatsappChannels.findFirst({
    where: eq(whatsappChannels.ycloudPhoneNumberId, input.ycloudPhoneNumberId),
    columns: { id: true, businessId: true },
  });

  if (owner) {
    // Cross-tenant guard: never adopt or reactivate a channel that belongs
    // to another businessId, even if it is stale/INACTIVE.
    if (owner.businessId !== input.businessId) {
      return { outcome: 'conflict', reason: 'phone_number_belongs_to_another_business' };
    }

    await db
      .update(whatsappChannels)
      .set({
        wabaId: input.wabaId,
        isActive: input.isActive,
        displayPhoneNumber: input.displayPhoneNumber,
        connectionStatus: input.connectionStatus,
        connectedAt: input.connectedAt,
        updatedAt: new Date(),
      })
      .where(eq(whatsappChannels.id, owner.id));

    return { outcome: 'reactivated' };
  }

  await db.insert(whatsappChannels).values({
    businessId: input.businessId,
    ycloudPhoneNumberId: input.ycloudPhoneNumberId,
    wabaId: input.wabaId,
    isActive: input.isActive,
    displayPhoneNumber: input.displayPhoneNumber,
    connectionStatus: input.connectionStatus,
    connectedAt: input.connectedAt,
  });

  return { outcome: 'inserted' };
}
