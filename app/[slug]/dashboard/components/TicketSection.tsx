'use client';

import type { UploadTicketResult } from '@/features/dashboard/actions/ticketActions';
import type { OrderItem } from '@/lib/types/orderStatus';
import { URBANO_STATUS_MAP } from '@/lib/types/orderStatus';
import { Button } from '@/shared/components/ui/buttons/Button';
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  RefreshCw,
  Send,
  Truck,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';
import styles from './RecentOrders.module.css';

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
  ticketFile,
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
    return (
      <span className={`${styles.statusBadge} ${styles[statusInfo.className || '']}`}>
        {isDisputed ? (
          <>
            <X size={14} /> Rechazado
          </>
        ) : isInValidando ? (
          <>
            <RefreshCw size={14} /> VALIDANDO
          </>
        ) : isEnReparto ? (
          <>
            <Truck size={14} /> En Reparto
          </>
        ) : (
          <>
            <CheckCircle size={14} /> Confirmado
          </>
        )}
      </span>
    );
  };

  const handleLocalCancel = () => {
    if (isEditingTicket) onEdit();
    onCancel();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderUploadForm = (isEditing = false) => (
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
              className={`${styles.ticketImage} ${styles.ticketBlurred} ${styles.ticketImageFit}`}
            />
            <div className={styles.ticketOverlay}>Click para confirmar</div>
          </div>
          <div className={styles.ticketActions}>
            <Button variant="filled" onClick={onUpload} disabled={uploading}>
              <span className={styles.ticketButtonInner}>
                {uploading ? <RefreshCw size={18} /> : <Send size={18} />}
                {uploading ? 'Subiendo...' : isEditing ? 'Actualizar Ticket' : 'Enviar Ticket'}
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

  return (
    <section className={styles.ticketSection}>
      <div className={styles.ticketHeader}>
        <h3 className={styles.sectionTitle}>
          <FileText size={16} /> Comprobante de Envío
        </h3>
        {hasTicket && renderStatusBadge()}
      </div>

      {isEditingTicket ? (
        renderUploadForm(true)
      ) : hasTicket ? (
        <div className={styles.ticketCard}>
          <div className={styles.ticketImageContainer}>
            <Image
              src={order.ticketImageUrl || ''}
              alt="Comprobante de envío"
              fill
              className={`${styles.ticketImage} ${styles.ticketImageFit} ${isInValidando ? styles.ticketBlurred : ''}`}
            />
          </div>

          <div className={styles.ticketInfo}>
            {isDisputed ? (
              <span className={styles.ticketStatusInfo}>
                El cliente rechazó este ticket — subí uno nuevo
              </span>
            ) : isInValidando ? (
              <span className={styles.ticketStatusInfo}>Esperando validación del cliente</span>
            ) : isEnReparto ? (
              <span className={styles.ticketStatusInfo}>
                Pedido en reparto — el cliente confirmará recepción
              </span>
            ) : isDelivered ? (
              <span className={styles.ticketStatusInfo}>
                Cliente confirmó el ticket — pedido listo para enviar
              </span>
            ) : (
              <span className={styles.ticketStatusInfo}>Ticket subido correctamente</span>
            )}
          </div>

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
      ) : (
        renderUploadForm()
      )}
      {uploadResult && !uploadResult.success && (
        <div className={styles.ticketError}>
          <AlertTriangle size={16} />
          <span>{uploadResult.error || 'Error al subir el comprobante'}</span>
        </div>
      )}
    </section>
  );
}
