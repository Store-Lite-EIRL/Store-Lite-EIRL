'use client';

import type { UploadTicketResult } from '@/features/dashboard/actions/ticketActions';
import type { OrderItem } from '@/lib/types/orderStatus';
import { URBANO_STATUS_MAP } from '@/lib/types/orderStatus';
import { Button } from '@/shared/components/ui/buttons/Button';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  Send,
  Truck,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';
import styles from './TicketSection.module.css';

type TicketOrderItem = Pick<OrderItem, 'id' | 'status' | 'ticketImageUrl'>;

interface TicketSectionProps {
  order: TicketOrderItem;
  ticketFile: File | null;
  ticketPreview: string | null;
  uploading: boolean;
  uploadResult: UploadTicketResult | null;
  isEditingTicket: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onCancel: () => void;
  onEdit: () => void;
}

export default function TicketSection({
  order,
  ticketFile, // eslint-disable-line @typescript-eslint/no-unused-vars
  ticketPreview,
  uploading,
  uploadResult,
  isEditingTicket,
  onFileSelect,
  onUpload,
  onCancel,
  onEdit,
}: TicketSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasTicket = !!order.ticketImageUrl;
  const isInValidando = order.status === 'validando';
  const rawStatus = String(order.status);
  const isDelivered = order.status === 'delivered' || rawStatus === 'READY_TO_SHIP';
  const isEnReparto = rawStatus === 'en_reparto' || rawStatus === 'IN_TRANSIT';
  const isInTransitV2 = rawStatus === 'IN_TRANSIT';
  const isDisputed = order.status === 'disputed';
  const canEditTicket = isInValidando || isDisputed;

  const renderStatusBadge = () => {
    const statusInfo = URBANO_STATUS_MAP[order.status] || {};
    let badgeContent: React.ReactNode;
    if (isDisputed) {
      badgeContent = (
        <>
          <X size={14} /> Rechazado
        </>
      );
    } else if (isInValidando) {
      badgeContent = (
        <>
          <RefreshCw size={14} /> VALIDANDO
        </>
      );
    } else if (isEnReparto) {
      badgeContent = (
        <>
          <Truck size={14} /> En Reparto
        </>
      );
    } else {
      badgeContent = (
        <>
          <CheckCircle size={14} /> Confirmado
        </>
      );
    }
    return (
      <span className={`${styles.statusBadge} ${styles[statusInfo.className || '']}`}>
        {badgeContent}
      </span>
    );
  };

  const handleLocalCancel = () => {
    if (isEditingTicket) onEdit();
    onCancel();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderUploadForm = (isEditing = false) => {
    let buttonLabel = 'Enviar Ticket';
    if (uploading) buttonLabel = 'Subiendo...';
    else if (isEditing) buttonLabel = 'Actualizar Ticket';

    return (
      <div className={styles.ticketUploadCard}>
        {!ticketPreview ? (
          <>
            <div className={styles.ticketUploadIcon}>
              <Upload size={32} />
            </div>
            <p className={styles.ticketUploadTitle}>
              {isEditing ? 'Editar comprobante de envío' : 'Subir comprobante de envío'}
            </p>
            <p className={styles.ticketUploadHint}>
              {isEditing
                ? 'Seleccioná la nueva imagen del ticket de courier'
                : 'Adjuntá la foto del ticket de courier para que el cliente pueda seguir su pedido'}
            </p>
            <label className={styles.uploadLabel}>
              <Upload size={18} /> Seleccionar Imagen
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={onFileSelect}
              />
            </label>
            <p className={styles.hint}>Formatos: JPG, PNG, WebP</p>
          </>
        ) : (
          <div className={styles.ticketPreview}>
            <div className={styles.ticketImageWrapper}>
              <Image
                src={ticketPreview}
                alt="Preview"
                fill
                className={`${styles.ticketImage} ${styles.ticketImageFit}`}
              />
              <div className={styles.ticketOverlay}>Click para confirmar</div>
            </div>
            <div className={styles.ticketActions}>
              <Button variant="filled" onClick={onUpload} disabled={uploading}>
                <span className={styles.ticketButtonInner}>
                  {uploading ? <RefreshCw size={18} /> : <Send size={18} />}
                  {buttonLabel}
                </span>
              </Button>
              <Button variant="outlined" onClick={handleLocalCancel}>
                <span className={styles.ticketButtonInner}>
                  <X size={18} /> Cancelar
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className={styles.ticketSection}>
      <div className={styles.ticketHeader}>
        <h3 className={styles.sectionTitle}>
          <FileText size={16} /> Comprobante de Envío
        </h3>
        {hasTicket && renderStatusBadge()}
      </div>

      {(() => {
        if (isEditingTicket) return renderUploadForm(true);
        if (!hasTicket) return renderUploadForm();

        let confirmModifier = styles.confirmDone;
        if (isDisputed) confirmModifier = styles.confirmRejected;
        else if (isInValidando) confirmModifier = styles.confirmPending;

        let confirmContent: React.ReactNode;
        if (isDisputed) {
          confirmContent = (
            <>
              <XCircle size={20} />
              <span>Rechazado por el comprador</span>
            </>
          );
        } else if (isInValidando) {
          confirmContent = (
            <>
              <Clock size={20} />
              <span>Pendiente de confirmación del comprador</span>
            </>
          );
        } else {
          confirmContent = (
            <>
              <CheckCircle size={20} />
              <span>Confirmado por el comprador</span>
            </>
          );
        }

        return (
          <div className={styles.ticketCard}>
            <div className={styles.ticketImageContainer}>
              <Image
                src={order.ticketImageUrl || ''}
                alt="Comprobante de envío"
                fill
                className={`${styles.ticketImage} ${styles.ticketImageFit} ${isInValidando ? styles.ticketBlurred : ''}`}
              />
            </div>

            <div className={`${styles.confirmStatus} ${confirmModifier}`}>{confirmContent}</div>

            <div className={styles.ticketActionsCentered}>
              {canEditTicket && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    onEdit();
                  }}
                >
                  <Upload size={14} /> {isDisputed ? 'Re-subir Ticket' : 'Editar Ticket'}
                </Button>
              )}
              {(isDelivered || isInTransitV2) && (
                <span className={styles.ticketStatusInfoBlock}>
                  ¿Querés notificar la entrega? Andá a la fase Envío.
                </span>
              )}
            </div>
          </div>
        );
      })()}
      {uploadResult && !uploadResult.success && (
        <div className={styles.ticketError}>
          <AlertTriangle size={16} />
          <span>{uploadResult.error || 'Error al subir el comprobante'}</span>
        </div>
      )}
    </section>
  );
}
