'use client';

import type { OrderItem } from '@/lib/types/orderStatus';
import styles from './RecentOrders.module.css';
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
}: PhaseContentProps) {
  return (
    <div className={styles.modalBodyNew}>
      {selectedPhase === 0 && (
        <PhaseReadySection order={order} businessSlug={businessSlug} />
      )}
      {selectedPhase === 1 && (
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
      {selectedPhase === 2 && (
        <PhaseShippingSection
          order={order}
          onNotifyDelivery={onNotifyDelivery}
          onFinalizeOrder={onFinalizeOrder}
          notifyingDelivery={notifyingDelivery}
          finalizingOrder={finalizingOrder}
        />
      )}
      {selectedPhase === 3 && (
        <PhaseCompletionSection order={order} />
      )}
    </div>
  );
}
