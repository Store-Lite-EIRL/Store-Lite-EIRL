'use client';

import TicketSection from './TicketSection';

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

export default function PhaseTicketSection(props: PhaseTicketSectionProps) {
  return <TicketSection {...props} />;
}
