'use client';

import { requestFinalization } from '@/features/dashboard/actions/finalizationActions';
import {
  notifyDelivery,
  uploadTicketAndUpdatePayment,
  type UploadTicketResult,
} from '@/features/dashboard/actions/ticketActions';
import type { OrderItem } from '@/lib/types/orderStatus';
import { URBANO_STATUS_MAP } from '@/lib/types/orderStatus';
import { Icon } from '@/shared';
import { Button } from '@/shared/components/ui/buttons/Button';
import { IconButton } from '@/shared/components/ui/buttons/IconButton';
import { Calendar, HelpCircle, RefreshCw, ShoppingBag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import HelpPanel from './HelpPanel';
import PhaseContent from './PhaseContent';
import styles from './RecentOrders.module.css';
import SellerPhaseGuide, { getSellerPhase } from './SellerPhaseGuide';

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [ticketPreview, setTicketPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadTicketResult | null>(null);
  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [notifyingDelivery, setNotifyingDelivery] = useState(false);
  const [finalizingOrder, setFinalizingOrder] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>({ open: false, action: null });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusInfo = URBANO_STATUS_MAP[order.status] || {
    label: order.status,
    className: '',
    lucideIcon: RefreshCw,
  };

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
    setActiveTab('detalles');
    setSelectedPhase(getSellerPhase(order.status).currentPhase);
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
        onOrderUpdate({ ...order, status: 'en_reparto' as any });
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
        onOrderUpdate({ ...order, status: 'DELIVERED' as any });
      } else {
        alert(result.error || 'Error al solicitar la finalización');
      }
    } catch {
      alert('Error inesperado al finalizar el pedido');
    } finally {
      setFinalizingOrder(false);
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
        <SellerPhaseGuide
          phases={getSellerPhase(String(order.status))}
          selectedPhase={selectedPhase}
          onSelect={(i) => {
            setSelectedPhase(i);
            if (activeTab === 'ayuda') setActiveTab('detalles');
          }}
        />
        <div className={styles.modalTabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'detalles' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('detalles')}
          >
            <Icon slot="icon" size={21}>
              box_edit
            </Icon>
            Detalles
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'ayuda' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('ayuda')}
          >
            <HelpCircle size={16} /> Ayuda
          </button>
        </div>
        {activeTab === 'detalles' && (
          <PhaseContent
            order={order}
            selectedPhase={selectedPhase}
            businessSlug={businessSlug}
            onNotifyDelivery={wrappedNotifyDelivery}
            onFinalizeOrder={wrappedFinalizeOrder}
            notifyingDelivery={notifyingDelivery}
            finalizingOrder={finalizingOrder}
            ticketFile={ticketFile}
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
        {activeTab === 'ayuda' && <HelpPanel selectedPhase={selectedPhase} />}
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
