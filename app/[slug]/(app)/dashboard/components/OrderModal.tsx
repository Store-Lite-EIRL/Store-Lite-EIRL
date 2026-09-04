'use client';

import { PENALTY_A_PERCENTAGE, SELLER_TIMEOUT_DAYS } from '@/core/penalties/penaltyTypes';
import { requestFinalization } from '@/features/dashboard/actions/finalizationActions';
import {
  confirmPickedUp,
  markReadyForPickup,
  notifyDelivery,
  prepareOrder,
  uploadTicketAndUpdatePayment,
  type UploadTicketResult,
} from '@/features/dashboard/actions/ticketActions';
import type { OrderItem } from '@/lib/types/orderStatus';
import { URBANO_STATUS_MAP } from '@/lib/types/orderStatus';
import { Button } from '@/shared/components/ui/buttons/Button';
import { IconButton } from '@/shared/components/ui/buttons/IconButton';
import { Calendar, HelpCircle, Info, RefreshCw, ShoppingBag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import HelpPanel from './HelpPanel';
import styles from './OrderModal.module.css';
import PhaseContent from './PhaseContent';
import SellerPhaseGuide, {
  getSellerPhase,
  PICKUP_SELLER_PHASES,
  SELLER_PHASES,
} from './SellerPhaseGuide';

interface ConfirmAction {
  open: boolean;
  action: (() => void) | null;
  title?: string;
  description?: string;
}

type ModalTab = 'detalles' | 'ayuda';

interface OrderModalProps {
  order: OrderItem;
  businessSlug: string;
  onClose: () => void;
  onOrderUpdate: (updatedOrder: OrderItem) => void;
}

export default function OrderModal({
  order,
  businessSlug,
  onClose,
  onOrderUpdate,
}: OrderModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('detalles');
  const [selectedPhase, setSelectedPhase] = useState(0);
  const [_helpOpen, _setHelpOpen] = useState(false);
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [ticketPreview, setTicketPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadTicketResult | null>(null);
  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [notifyingDelivery, setNotifyingDelivery] = useState(false);
  const [finalizingOrder, setFinalizingOrder] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>({ open: false, action: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const isPreparing = order.status === 'PREPARING_ORDER';

  useEffect(() => {
    if (!isPreparing) {
      setTimeRemaining(null);
      return;
    }

    let deadlineMs: number | null = null;

    if (order.finalizationDeadline) {
      deadlineMs = new Date(order.finalizationDeadline).getTime();
    } else if (order.createdAt) {
      deadlineMs = new Date(order.createdAt).getTime() + SELLER_TIMEOUT_DAYS * 24 * 60 * 60 * 1000;
    }

    if (!deadlineMs || isNaN(deadlineMs)) {
      setTimeRemaining(null);
      return;
    }

    const updateRemaining = () => {
      setTimeRemaining(deadlineMs! - Date.now());
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60 * 1000);

    return () => clearInterval(interval);
  }, [isPreparing, order.finalizationDeadline, order.createdAt]);

  const statusInfo = URBANO_STATUS_MAP[order.status] || {
    label: order.status,
    className: '',
    lucideIcon: RefreshCw,
  };

  const isStorePickup = order.shippingType?.toLowerCase() === 'recojo';
  const phaseConfig = isStorePickup ? PICKUP_SELLER_PHASES : SELLER_PHASES;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    setTicketFile(null);
    setTicketPreview(null);
    setUploadResult(null);
    setUploading(false);
    setIsEditingTicket(false);
    setNotifyingDelivery(false);
    setMarkingReady(false);
    setConfirmingPickup(false);
    setPreparing(false);
    setPickupCodeInput('');
    setCodeError(null);
    setActiveTab('detalles');
    setSelectedPhase(getSellerPhase(order.status, order.shippingType).currentPhase);
  }, [order.id, order.status]);

  const handleTicketFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTicketFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTicketPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadTicket = async () => {
    if (!ticketPreview || !order) return;
    setUploading(true);
    try {
      const result = await uploadTicketAndUpdatePayment(order.id, ticketPreview, order.businessId);
      setUploadResult(result);
      if (result.success) {
        onOrderUpdate({
          ...order,
          ticketImageUrl: result.ticketImageUrl || '',
          status: 'validando',
        });
        setTicketFile(null);
        setTicketPreview(null);
        setUploadResult(null);
      }
    } catch {
      setUploadResult({ success: false, error: 'Error inesperado al subir el ticket' });
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setTicketFile(null);
    setTicketPreview(null);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNotifyDelivery = async () => {
    setNotifyingDelivery(true);
    try {
      const result = await notifyDelivery(order.id, order.businessId);
      if (result.success) {
        onOrderUpdate({ ...order, status: 'en_reparto' });
      } else {
        alert(result.error || 'Error al notificar la entrega');
      }
    } catch {
      alert('Error inesperado al notificar la entrega');
    } finally {
      setNotifyingDelivery(false);
    }
  };

  const handleFinalizeOrder = async () => {
    setFinalizingOrder(true);
    try {
      const result = await requestFinalization(order.id, order.businessId);
      if (result.success) {
        onOrderUpdate({ ...order, status: 'DELIVERED' });
      } else {
        alert(result.error || 'Error al solicitar la finalización');
      }
    } catch {
      alert('Error inesperado al finalizar el pedido');
    } finally {
      setFinalizingOrder(false);
    }
  };

  const handleMarkReadyForPickup = async () => {
    setMarkingReady(true);
    try {
      const result = await markReadyForPickup(order.id, order.businessId);
      if (result.success) {
        onOrderUpdate({ ...order, status: 'READY_FOR_PICKUP' });
      } else {
        alert(result.error || 'Error al marcar como listo para recojo');
      }
    } catch {
      alert('Error inesperado');
    } finally {
      setMarkingReady(false);
    }
  };

  const handlePrepareOrder = async () => {
    setPreparing(true);
    try {
      const result = await prepareOrder(order.id, order.businessId);
      if (result.success) {
        onOrderUpdate({ ...order, status: 'PREPARING_ORDER' });
      } else {
        alert(result.error || 'Error al preparar el pedido');
      }
    } catch {
      alert('Error inesperado');
    } finally {
      setPreparing(false);
    }
  };

  const handleConfirmPickedUp = async () => {
    if (!pickupCodeInput.trim()) return;
    setConfirmingPickup(true);
    setCodeError(null);
    try {
      const result = await confirmPickedUp(order.id, order.businessId, pickupCodeInput);
      if (result.success) {
        // If auto-complete succeeded, show COMPLETED; otherwise show PICKED_UP (auto-complete pending via cron)
        const newStatus = result.autoCompletePending ? 'PICKED_UP' : 'COMPLETED';
        onOrderUpdate({ ...order, status: newStatus });
        setPickupCodeInput('');
        if (result.autoCompletePending) {
          setCodeError(
            'El pedido pasó a Recogido. La finalización automática está pendiente (se completa en segundo plano).',
          );
        }
      } else {
        setCodeError(result.error || 'Error al confirmar el recojo');
      }
    } catch {
      setCodeError('Error inesperado');
    } finally {
      setConfirmingPickup(false);
    }
  };

  const wrappedNotifyDelivery = () => {
    setConfirmAction({
      open: true,
      action: handleNotifyDelivery,
      title: '¿Notificar entrega?',
      description:
        'Se enviará al cliente una notificación de que su pedido llegó. Esta acción no se puede deshacer.',
    });
  };

  const wrappedFinalizeOrder = () => {
    setConfirmAction({
      open: true,
      action: handleFinalizeOrder,
      title: '¿Notificar llegada?',
      description:
        'Confirmá que el producto ya llegó a su destino. Esta acción no se puede deshacer.',
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHero}>
          <IconButton
            variant="filled-tonal"
            onClick={onClose}
            aria-label="Cerrar"
            className={styles.modalHeroClose}
          >
            <X size={24} />
          </IconButton>
          <div className={styles.modalHeroOrderNumber}>
            <div className={`${styles.statusHeroBadge} ${styles[statusInfo.className] || ''}`}>
              {statusInfo.lucideIcon && (
                <statusInfo.lucideIcon size={16} className={styles.statusIcon} />
              )}
              {statusInfo.label}
            </div>
            <h2>{order.orderNumber || order.id.slice(0, 8).toUpperCase()}</h2>
          </div>

          <div className={styles.productNameInHeader}>
            <ShoppingBag size={16} />
            <span>{order.productTitle}</span>
          </div>
          <div className={styles.modalHeroMeta}>
            <Calendar size={16} />
            {new Date(order.createdAt).toLocaleString('es-PE', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </div>
        </div>
        {isPreparing &&
          timeRemaining !== null &&
          (timeRemaining > 0 ? (
            <div className={styles.countdownIndicator}>
              ⏱️ Te quedan {Math.floor(timeRemaining / (1000 * 60 * 60 * 24))}{' '}
              {Math.floor(timeRemaining / (1000 * 60 * 60 * 24)) === 1 ? 'día' : 'días'} y{' '}
              {Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}{' '}
              {Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) === 1
                ? 'hora'
                : 'horas'}
            </div>
          ) : (
            <div className={styles.overdueIndicator}>
              🔴 ATRASADO — Multa de S/
              {((parseFloat(order.amount) * PENALTY_A_PERCENTAGE) / 100).toFixed(2)}
            </div>
          ))}
        <SellerPhaseGuide
          phases={getSellerPhase(String(order.status), order.shippingType)}
          selectedPhase={selectedPhase}
          onSelect={(i) => {
            setSelectedPhase(i);
            if (activeTab === 'ayuda') setActiveTab('detalles');
          }}
          phasesConfig={phaseConfig}
        />
        <div className={styles.modalTabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'detalles' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('detalles')}
          >
            <Info size={16} />
            Detalles
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'ayuda' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('ayuda')}
          >
            <HelpCircle size={16} />
            Ayuda
          </button>
        </div>
        <div className={styles.modalBody}>
          {activeTab === 'detalles' && (
            <PhaseContent
              order={order}
              selectedPhase={selectedPhase}
              businessSlug={businessSlug}
              shippingType={order.shippingType}
              onNotifyDelivery={wrappedNotifyDelivery}
              onFinalizeOrder={wrappedFinalizeOrder}
              notifyingDelivery={notifyingDelivery}
              finalizingOrder={finalizingOrder}
              onMarkReadyForPickup={handleMarkReadyForPickup}
              onConfirmPickedUp={handleConfirmPickedUp}
              markingReady={markingReady}
              confirmingPickup={confirmingPickup}
              onPrepareOrder={handlePrepareOrder}
              preparing={preparing}
              pickupCodeInput={pickupCodeInput}
              onPickupCodeChange={setPickupCodeInput}
              ticketFile={ticketFile}
              codeError={codeError}
              ticketPreview={ticketPreview}
              uploading={uploading}
              uploadResult={uploadResult}
              isEditingTicket={isEditingTicket}
              onTicketFileSelect={handleTicketFileSelect}
              onUploadTicket={handleUploadTicket}
              onCancelUpload={handleCancelUpload}
              onEditTicket={() => {
                setIsEditingTicket(true);
                setTicketPreview(null);
                setTicketFile(null);
                setUploadResult(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
          )}
          {activeTab === 'ayuda' && (
            <HelpPanel selectedPhase={selectedPhase} shippingType={order.shippingType} />
          )}
        </div>
        <footer className={styles.modalFooter}>
          <Button variant="filled" onClick={onClose}>
            Cerrar
          </Button>
        </footer>
        {confirmAction.open && (
          <div
            className={styles.confirmOverlay}
            onClick={() =>
              setConfirmAction({
                open: false,
                action: null,
                title: undefined,
                description: undefined,
              })
            }
          >
            <div className={styles.confirmContent} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.confirmTitle}>{confirmAction.title || '¿Estás seguro?'}</h3>
              <p className={styles.confirmDesc}>
                {confirmAction.description || 'Esta acción no se puede deshacer.'}
              </p>
              <div className={styles.confirmActions}>
                <Button
                  variant="outlined"
                  onClick={() =>
                    setConfirmAction({
                      open: false,
                      action: null,
                      title: undefined,
                      description: undefined,
                    })
                  }
                >
                  Cancelar
                </Button>
                <Button
                  variant="filled"
                  onClick={() => {
                    confirmAction.action?.();
                    setConfirmAction({
                      open: false,
                      action: null,
                      title: undefined,
                      description: undefined,
                    });
                  }}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
