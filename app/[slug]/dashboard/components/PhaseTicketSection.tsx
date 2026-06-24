'use client';

import { AlertCircle, Receipt } from 'lucide-react';
import styles from './PhaseTicketSection.module.css';
import TicketSection from './TicketSection';

const PHASE_GUIDANCE: Record<number, string> = {
  1: 'Subí una foto clara del comprobante/ticket de envío para que el comprador pueda validar y aceptar el envío.',
};

function GuidanceBanner({ phase }: { phase: number }) {
  const text = PHASE_GUIDANCE[phase];
  if (!text) return null;
  return (
    <div className={styles.guidanceBanner}>
      <AlertCircle size={16} className={styles.guidanceIcon} />
      <p className={styles.guidanceText}>{text}</p>
    </div>
  );
}

interface PhaseTicketSectionProps {
  order: { id: string; status: string; ticketImageUrl: string | null };
  ticketFile: File | null;
  ticketPreview: string | null;
  uploading: boolean;
  uploadResult: any;
  isEditingTicket: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onCancel: () => void;
  onEdit: () => void;
}

export default function PhaseTicketSection({
  order,
  ticketFile,
  ticketPreview,
  uploading,
  uploadResult,
  isEditingTicket,
  onFileSelect,
  onUpload,
  onCancel,
  onEdit,
}: PhaseTicketSectionProps) {
  return (
    <>
      <GuidanceBanner phase={1} />
      <section className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>
          <Receipt size={18} /> Validación de Ticket
        </h3>
        <TicketSection
          order={order}
          ticketFile={ticketFile}
          ticketPreview={ticketPreview}
          uploading={uploading}
          uploadResult={uploadResult}
          isEditingTicket={isEditingTicket}
          onFileSelect={onFileSelect}
          onUpload={onUpload}
          onCancel={onCancel}
          onEdit={onEdit}
        />
      </section>
    </>
  );
}
