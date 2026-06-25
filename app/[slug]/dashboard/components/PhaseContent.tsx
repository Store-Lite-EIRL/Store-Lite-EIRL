'use client';

import type { OrderItem } from '@/lib/types/orderStatus';
import { Button } from '@/shared/components/ui/buttons/Button';
import { RefreshCw, Store } from 'lucide-react';
import PhaseCompletionSection from './PhaseCompletionSection';
import PhaseReadySection from './PhaseReadySection';
import PhaseShippingSection from './PhaseShippingSection';
import PhaseTicketSection from './PhaseTicketSection';

interface PhaseContentProps {
  order: OrderItem;
  selectedPhase: number;
  businessSlug: string;
  onNotifyDelivery: () => void;
  onFinalizeOrder: () => void;
  notifyingDelivery: boolean;
  finalizingOrder: boolean;
  ticketFile: File | null;
  ticketPreview: string | null;
  uploading: boolean;
  uploadResult: any;
  isEditingTicket: boolean;
  onTicketFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadTicket: () => void;
  onCancelUpload: () => void;
  onEditTicket: () => void;
  shippingType?: string | null;
  onMarkReadyForPickup?: () => void;
  onConfirmPickedUp?: () => void;
  markingReady?: boolean;
  confirmingPickup?: boolean;
  pickupCodeInput?: string;
  onPickupCodeChange?: (value: string) => void;
  codeError?: string | null;
}

export default function PhaseContent({
  order,
  selectedPhase,
  businessSlug,
  onNotifyDelivery,
  onFinalizeOrder,
  notifyingDelivery,
  finalizingOrder,
  ticketFile,
  ticketPreview,
  uploading,
  uploadResult,
  isEditingTicket,
  onTicketFileSelect,
  onUploadTicket,
  onCancelUpload,
  onEditTicket,
  shippingType,
  onMarkReadyForPickup,
  onConfirmPickedUp,
  markingReady,
  confirmingPickup,
  pickupCodeInput,
  onPickupCodeChange,
  codeError,
}: PhaseContentProps) {
  const isPickup = shippingType?.toLowerCase() === 'recojo';
  const orderStatus = String(order.status);

  return (
    <>
      {selectedPhase === 0 && (
        <>
          <PhaseReadySection order={order} businessSlug={businessSlug} />

          {/* Pickup action button in Phase 0 — RECOJO phase is locked until status advances */}
          {isPickup &&
            (orderStatus === 'PREPARING_ORDER' ||
              orderStatus === 'paid' ||
              orderStatus === 'PAID') &&
            onMarkReadyForPickup && (
              <div style={{ marginTop: '1rem', padding: '0 1rem' }}>
                <Button variant="filled" onClick={onMarkReadyForPickup} disabled={markingReady}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {markingReady ? <RefreshCw size={18} /> : <Store size={18} />}
                    {markingReady ? 'Preparando...' : 'Marcar como listo para recojo'}
                  </span>
                </Button>
              </div>
            )}
        </>
      )}

      {/* Phase 1: Delivery → TicketSection, Pickup → ShippingSection */}
      {!isPickup && selectedPhase === 1 && (
        <PhaseTicketSection
          order={order}
          ticketFile={ticketFile}
          ticketPreview={ticketPreview}
          uploading={uploading}
          uploadResult={uploadResult}
          isEditingTicket={isEditingTicket}
          onFileSelect={onTicketFileSelect}
          onUpload={onUploadTicket}
          onCancel={onCancelUpload}
          onEdit={onEditTicket}
        />
      )}
      {isPickup && selectedPhase === 1 && (
        <PhaseShippingSection
          order={order}
          onNotifyDelivery={onNotifyDelivery}
          onFinalizeOrder={onFinalizeOrder}
          notifyingDelivery={notifyingDelivery}
          finalizingOrder={finalizingOrder}
          onMarkReadyForPickup={onMarkReadyForPickup}
          onConfirmPickedUp={onConfirmPickedUp}
          markingReady={markingReady}
          confirmingPickup={confirmingPickup}
          pickupCodeInput={pickupCodeInput}
          onPickupCodeChange={onPickupCodeChange}
          codeError={codeError}
        />
      )}

      {/* Phase 2: Delivery → ShippingSection, Pickup → CompletionSection */}
      {!isPickup && selectedPhase === 2 && (
        <PhaseShippingSection
          order={order}
          onNotifyDelivery={onNotifyDelivery}
          onFinalizeOrder={onFinalizeOrder}
          notifyingDelivery={notifyingDelivery}
          finalizingOrder={finalizingOrder}
        />
      )}
      {isPickup && selectedPhase === 2 && <PhaseCompletionSection order={order} />}

      {/* Phase 3: Delivery only → CompletionSection */}
      {!isPickup && selectedPhase === 3 && <PhaseCompletionSection order={order} />}
    </>
  );
}
