'use client';

import { Select, SelectOption } from '@/shared/components/ui/inputs/Select';
import { TextField } from '@/shared/components/ui/inputs/TextField';
import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  Hash,
  HelpCircle,
  Home,
  IdCard,
  MapPin,
  Phone,
  Receipt,
  RefreshCw,
  Send,
  ShoppingBag,
  Store,
  Truck,
  Upload,
  User,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { uploadTicketAndUpdatePayment, notifyDelivery, type UploadTicketResult } from '../actions/ticketActions';
import styles from './RecentOrders.module.css';

interface OrderItem {
  id: string;
  orderNumber: string | null;
  productTitle: string;
  productSlug: string;
  productImage: string | null;
  amount: string;
  shippingCost: string;
  currency: string;
  paymentMethod: 'card' | 'yape' | 'plin';
  status:
    | 'pending'
    | 'paid'
    | 'validando'
    | 'not_delivered'
    | 'delivered'
    | 'completed'
    | 'failed'
    | 'disputed'
    | 'refund_requested'
    | 'refunded'
    | 'shipped'
    | 'processing'
    | 'analizando'
    | 'aceptado'
    | 'esperando_confirmacion'
    | 'finalizado'
    | 'rechazado';
  shippingAddress: string | null;
  shippingDistrict: string | null;
  shippingProvince: string | null;
  shippingDepartment: string | null;
  shippingType: 'agencia' | 'domicilio' | 'recojo' | null;
  shippingAgency: string | null;
  shippingReference: string | null;
  shippingPhone: string | null;
  buyerEmail: string | null;
  maskedDni: string; // DNI enmascarado (****1234) para proteger al customer
  trackingToken?: string | null; // Internal — not exposed to seller, but kept for type safety
  ticketImageUrl: string | null;
  finalizationDeadline: string | null;
  metadata: any;
  createdAt: string;
  businessId: string;
}

interface RecentOrdersProps {
  orders: OrderItem[];
  totalPages: number;
  currentPage: number;
  currentLimit: number;
  currentStatus: string;
  currentSearch: string;
}

const URBANO_STATUS_MAP: Record<
  string,
  { label: string; className: string; progress: number; icon: string }
> = {
  paid: { label: 'Pagado', className: 'statusPaid', progress: 10, icon: 'payments' },
  validando: { label: 'VALIDANDO', className: 'statusValidando', progress: 25, icon: 'fact_check' },
  not_delivered: { label: 'No Entregado', className: 'statusNotDelivered', progress: 30, icon: 'hourglass_top' },
  delivered: { label: 'Entregado al Courier', className: 'statusDelivered', progress: 50, icon: 'local_shipping' },
  en_reparto: { label: 'En Reparto', className: 'statusEnReparto', progress: 75, icon: 'local_shipping' },
  completed: { label: 'Finalizado', className: 'statusCompleted', progress: 100, icon: 'verified' },
  disputed: { label: 'En Disputa', className: 'statusDisputed', progress: 0, icon: 'gavel' },
  failed: { label: 'Fallido', className: 'statusFailed', progress: 0, icon: 'error' },
  refund_requested: { label: 'Reembolso Solicitado', className: 'statusRefunded', progress: 0, icon: 'currency_exchange' },
  refunded: { label: 'Reembolsado', className: 'statusRefunded', progress: 0, icon: 'currency_exchange' },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  card: 'Tarjeta de Crédito/Débito',
  yape: 'Yape',
  plin: 'Plin',
};

type ModalTab = 'detalles' | 'ticket' | 'ayuda';

export function RecentOrders({
  orders,
  totalPages,
  currentPage,
  currentLimit,
  currentStatus,
  currentSearch,
}: RecentOrdersProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>('detalles');
  const [helpOpen, setHelpOpen] = useState(false);
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [ticketPreview, setTicketPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadTicketResult | null>(null);
  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [notifyingDelivery, setNotifyingDelivery] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    action: (() => void) | null;
  }>({ open: false, action: null });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedOrder]);

  useEffect(() => {
    setTicketFile(null);
    setTicketPreview(null);
    setUploadResult(null);
    setUploading(false);
    setIsEditingTicket(false);
    setNotifyingDelivery(false);
    setActiveTab('detalles');
  }, [selectedOrder]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === 'all' || value === '') params.delete(key);
      else params.set(key, value);
    });
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleTicketFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTicketFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setTicketPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadTicket = async () => {
    if (!ticketPreview || !selectedOrder) return;
    setUploading(true);
    try {
      const result = await uploadTicketAndUpdatePayment(
        selectedOrder.id,
        ticketPreview,
        selectedOrder.businessId,
      );
      setUploadResult(result);
      if (result.success) {
        // Actualizar el estado local para mostrar el ticket y cambiar a "VALIDANDO"
        setSelectedOrder({
          ...selectedOrder,
          ticketImageUrl: result.ticketImageUrl || '',
          status: 'validando',
        });
        // Limpiar el formulario de upload
        setTicketFile(null);
        setTicketPreview(null);
        setUploadResult(null);
        // Refrescar en background para sincronizar con servidor
        router.refresh();
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
    if (!selectedOrder) return;
    setNotifyingDelivery(true);
    try {
      const result = await notifyDelivery(selectedOrder.id, selectedOrder.businessId);
      if (result.success) {
        // Actualizar estado local
        setSelectedOrder({ ...selectedOrder, status: 'en_reparto' });
        router.refresh();
      } else {
        alert(result.error || 'Error al notificar la entrega');
      }
    } catch {
      alert('Error inesperado al notificar la entrega');
    } finally {
      setNotifyingDelivery(false);
    }
  };

  const renderDots = (segmentProgress: number) => {
    const thresholds = [25, 50, 75, 100];
    return (
      <div className={styles.dotsWrapper} data-tooltip={`Progreso: ${segmentProgress}%`}>
        {thresholds.map((threshold, idx) => {
          const prevThreshold = idx === 0 ? 0 : thresholds[idx - 1];
          const isActive = segmentProgress >= threshold;
          const isGlowing = segmentProgress > prevThreshold && segmentProgress < threshold;
          return (
            <div
              key={idx}
              className={`${styles.dot} ${isActive ? styles.activeDot : ''} ${isGlowing ? styles.glowingDot : ''}`}
            />
          );
        })}
      </div>
    );
  };

  const renderShippingProgress = (order: OrderItem) => {
    const statusInfo = URBANO_STATUS_MAP[order.status] || { progress: 0 };
    const totalProgress = statusInfo.progress;
    const type = order.shippingType?.toLowerCase();

    return (
      <div className={styles.trackingContainer} onClick={() => setSelectedOrder(order)}>
        <div
          className={`${styles.iconWrapper} ${styles.active}`}
          data-tooltip="ORIGEN: Almacén Central"
        >
          <Store size={18} />
        </div>
        {type === 'recojo' || !type ? (
          <span className={styles.inlineLabel}>Recojo en Tienda</span>
        ) : type === 'agencia' ? (
          <>
            {renderDots(totalProgress)}
            <div
              className={`${styles.iconWrapper} ${totalProgress >= 60 ? styles.active : ''}`}
              data-tooltip={`DISTRIBUCIÓN: ${order.shippingAgency || 'Agencia'}`}
            >
              <Truck size={18} />
            </div>
            <span className={styles.inlineLabel}>
              {totalProgress >= 60 ? 'En Agencia' : 'En camino'}
            </span>
          </>
        ) : (
          <>
            {renderDots(Math.min(totalProgress * 2, 100))}
            <div
              className={`${styles.iconWrapper} ${totalProgress >= 50 ? styles.active : ''}`}
              data-tooltip="DISTRIBUCIÓN: Sucursal"
            >
              <Truck size={18} />
            </div>
            {renderDots(Math.max(0, Math.min((totalProgress - 50) * 2, 100)))}
            <div
              className={`${styles.iconWrapper} ${totalProgress >= 90 ? styles.active : ''}`}
              data-tooltip="DESTINO: Domicilio"
            >
              <Home size={18} />
            </div>
          </>
        )}
      </div>
    );
  };

  const getTimelineSteps = (order: OrderItem) => {
    const statusInfo = URBANO_STATUS_MAP[order.status] || { progress: 0 };
    const progress = statusInfo.progress;
    return [
      {
        label: 'PEDIDO',
        state: progress >= 10 ? (progress >= 20 ? 'completed' : 'current') : 'pending',
      },
      {
        label: 'VALIDANDO',
        state: progress >= 30 ? (progress >= 40 ? 'completed' : 'current') : 'pending',
      },
      {
        label: 'ENVÍO',
        state: progress >= 60 ? (progress >= 80 ? 'completed' : 'current') : 'pending',
      },
      {
        label: 'CERRADO',
        state: progress >= 100 ? 'completed' : progress >= 80 ? 'current' : 'pending',
      },
    ];
  };

  const renderTimeline = (order: OrderItem) => {
    const steps = getTimelineSteps(order);
    return (
      <div className={styles.timelineWrapper}>
        <div className={styles.timeline}>
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <div
                key={i}
                className={`${styles.timelineStep} ${step.state === 'completed' ? styles.stepCompleted : ''} ${step.state === 'current' ? styles.stepCurrent : ''}`}
              >
                {!isLast && (
                  <div
                    className={`${styles.timelineLine} ${step.state === 'completed' ? styles.lineCompleted : ''}`}
                  />
                )}
                <div className={styles.timelineIndicator}>
                  {step.state === 'completed' ? (
                    <CheckCircle size={16} />
                  ) : (
                    <div className={styles.timelineDot} />
                  )}
                </div>
                <span className={styles.timelineLabel}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderShippingPathModal = (order: OrderItem) => {
    const type = order.shippingType?.toLowerCase();
    const statusInfo = URBANO_STATUS_MAP[order.status] || { progress: 0 };
    return (
      <section className={styles.infoSection}>
        <h3 className={styles.sectionTitle}>
          <MapPin size={16} /> Ruta de Entrega
        </h3>
        <div className={styles.shippingPath}>
          <div className={styles.pathItem}>
            <div
              className={`${styles.pathIcon} ${statusInfo.progress >= 10 ? styles.pathIconActive : ''}`}
            >
              <Store size={18} />
            </div>
            <div className={styles.pathContent}>
              <p className={styles.pathLabel}>Inicio</p>
              <p className={styles.pathValue}>Almacén Central (Lima)</p>
            </div>
          </div>
          {type !== 'recojo' && (
            <>
              <div className={styles.pathConnector} />
              <div className={styles.pathItem}>
                <div
                  className={`${styles.pathIcon} ${statusInfo.progress >= 40 ? styles.pathIconActive : ''}`}
                >
                  <Truck size={18} />
                </div>
                <div className={styles.pathContent}>
                  <p className={styles.pathLabel}>Agencia</p>
                  <p className={styles.pathValue}>{order.shippingAgency || 'Distribución local'}</p>
                </div>
              </div>
            </>
          )}
          {type === 'domicilio' && (
            <>
              <div className={styles.pathConnector} />
              <div className={styles.pathItem}>
                <div
                  className={`${styles.pathIcon} ${statusInfo.progress >= 80 ? styles.pathIconActive : ''}`}
                >
                  <Home size={18} />
                </div>
                <div className={styles.pathDetails}>
                  <p className={styles.pathLabel}>Destino</p>
                  <p className={styles.pathValue}>
                    {order.shippingDistrict}, {order.shippingProvince}
                  </p>
                  <p className={styles.pathSubValue}>{order.shippingAddress}</p>
                  {order.shippingReference && (
                    <p className={styles.refText}>Ref: {order.shippingReference}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBarTrack}>
            <div className={styles.progressBarFill} style={{ width: `${statusInfo.progress}%` }} />
          </div>
          <span className={styles.progressText}>{statusInfo.progress}% completado</span>
        </div>
      </section>
    );
  };

  const renderTicketSection = (order: OrderItem) => {
    const hasTicket = !!order.ticketImageUrl;
    const isInValidando = order.status === 'validando';
    const isDelivered = order.status === 'delivered'; // Customer confirmó ticket
    const isEnReparto = order.status === 'en_reparto'; // Seller notificó llegada
    const isDisputed = order.status === 'disputed'; // Ticket rechazado
    // Solo se puede editar cuando está en validando o disputado (necesita re-subir)
    const canEditTicket = isInValidando || isDisputed;
    
    // Función auxiliar para renderizar el formulario de subida
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
                : 'Adjuntá la foto del ticket de courier para que el cliente pueda seguir su pedido'
              }
            </p>
            <label className={styles.uploadLabel}>
              <Upload size={18} /> Seleccionar Imagen
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={handleTicketFileSelect}
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
                className={`${styles.ticketImage} ${styles.ticketBlurred}`}
                style={{ objectFit: 'contain' }}
              />
              <div className={styles.ticketOverlay}>Click para confirmar</div>
            </div>
            <div className={styles.ticketActions}>
              <button
                className={styles.sendButton}
                onClick={handleUploadTicket}
                disabled={uploading}
              >
                {uploading ? <RefreshCw size={18} /> : <Send size={18} />}
                {uploading ? 'Subiendo...' : (isEditing ? 'Actualizar Ticket' : 'Enviar Ticket')}
              </button>
              <button 
                className={styles.cancelButton} 
                onClick={() => {
                  if (isEditing) setIsEditingTicket(false);
                  handleCancelUpload();
                }}
              >
                <X size={18} /> Cancelar
              </button>
            </div>
          </div>
        )}
        {!isEditing && (
          <>
            <button className={styles.helpToggle} onClick={() => setHelpOpen(!helpOpen)}>
              <HelpCircle size={16} />
              {helpOpen ? 'Ocultar instrucciones' : '¿Cómo funciona?'}
            </button>
            {helpOpen && (
              <div className={styles.helpDetails}>
                <details open>
                  <summary className={styles.helpSummary}>Flujo de envío</summary>
                  <div className={styles.helpFlow}>
                    <div className={styles.helpStep}>
                      <div className={styles.helpStepNumber}>1</div>
                      <span>Generá el envío con la agencia</span>
                    </div>
                    <div className={styles.helpArrow}>↓</div>
                    <div className={styles.helpStep}>
                      <div className={styles.helpStepNumber}>2</div>
                      <span>Fotografiá el comprobante/ticket</span>
                    </div>
                    <div className={styles.helpArrow}>↓</div>
                    <div className={styles.helpStep}>
                      <div className={styles.helpStepNumber}>3</div>
                      <span>Subilo acá — el cliente recibe el token</span>
                    </div>
                    <div className={styles.helpArrow}>↓</div>
                    <div className={styles.helpStep}>
                      <div className={styles.helpStepNumber}>4</div>
                      <span>El cliente valida y acepta el envío</span>
                    </div>
                    <p className={`${styles.helpNote} ${styles.warning}`}>
                      ⚠️ El ticket se difumina hasta que el cliente confirme
                    </p>
                  </div>
                </details>
              </div>
            )}
          </>
        )}
      </div>
    );
    
    return (
      <section className={styles.ticketSection}>
        <div className={styles.ticketHeader}>
          <h3 className={styles.sectionTitle}>
            <Receipt size={16} /> Comprobante de Envío
          </h3>
          {hasTicket && (
            <span className={`${styles.ticketStatusBadge} ${
              isDisputed ? styles.statusBadgeRed :
              isInValidando ? styles.statusBadgeOrange : 
              styles.statusBadgeGreen
            }`}>
              {isDisputed ? (
                <><X size={14} /> Rechazado</>
              ) : isInValidando ? (
                <><RefreshCw size={14} /> VALIDANDO</>
              ) : isEnReparto ? (
                <><Truck size={14} /> En Reparto</>
              ) : (
                <><CheckCircle size={14} /> Confirmado</>
              )}
            </span>
          )}
        </div>
        
        {isEditingTicket ? (
          // Modo edición
          renderUploadForm(true)
        ) : hasTicket ? (
          // Mostrar ticket existente
          <div className={styles.ticketCard}>
            <div className={styles.ticketImageContainer}>
              <Image
                src={order.ticketImageUrl || ''}
                alt="Ticket"
                fill
                className={`${styles.ticketImage} ${isInValidando ? styles.ticketBlurred : ''}`}
                style={{ objectFit: 'contain' }}
              />
              <div className={styles.ticketImageOverlay}>
                <span>
                  {isDisputed ? 'Ticket rechazado' :
                   isInValidando ? 'Esperando validación' :
                   isEnReparto ? 'En reparto' :
                   'Ticket confirmado'}
              </span>
              </div>
            </div>
            <div className={styles.ticketInfo}>
              {isDisputed ? (
                <p className={styles.ticketInfoTextWarning}>⚠️ El cliente rechazó este ticket. Subí uno nuevo.</p>
              ) : isInValidando ? (
                <p className={styles.ticketInfoTextWarning}>⏳ Esperando validación del cliente</p>
              ) : isEnReparto ? (
                <p className={styles.ticketInfoTextSuccess}>🚚 Pedido en reparto — el cliente confirmará recepción</p>
              ) : isDelivered ? (
                <p className={styles.ticketInfoTextSuccess}>✓ Ticket confirmado por el cliente</p>
              ) : (
                <p className={styles.ticketInfoTextSuccess}>✓ Ticket subido correctamente</p>
              )}
            </div>
            <div className={styles.ticketActions}>
              {canEditTicket && (
                <button
                  className={styles.editButton}
                  onClick={() => {
                    setIsEditingTicket(true);
                    setTicketPreview(null);
                    setTicketFile(null);
                    setUploadResult(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <Upload size={14} /> {isDisputed ? 'Re-subir Ticket' : 'Editar Ticket'}
                </button>
              )}
              {isDelivered && (
                <button
                  className={styles.sendButton}
                  onClick={handleNotifyDelivery}
                  disabled={notifyingDelivery}
                >
                  {notifyingDelivery ? <RefreshCw size={18} /> : <Truck size={18} />}
                  {notifyingDelivery ? 'Notificando...' : 'Notificar Entrega'}
                </button>
              )}
            </div>
          </div>
        ) : (
          // No puede subir todavía
          <div className={styles.ticketCard}>
            <p className={styles.ticketInfoText}>
              El ticket de envío estará disponible cuando el pedido sea despachado.
            </p>
          </div>
        )}
      </section>
    );
  };

  const renderHelpTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.helpBox}>
        <h3 className={styles.sectionTitle}>
          <HelpCircle size={16} /> Guía de Estados
        </h3>
        {Object.entries(URBANO_STATUS_MAP)
          .slice(0, 8)
          .map(([key, info]) => (
            <div key={key} className={styles.helpStep}>
              <div className={styles.helpStepNumber}>{info.progress}%</div>
              <span>{info.label}</span>
            </div>
          ))}
      </div>
      <div className={styles.helpBox}>
        <h3 className={styles.sectionTitle}>
          <Truck size={16} /> Tipos de Envío
        </h3>
        <div className={styles.helpStep}>
          <div className={styles.helpStepNumber}>A</div>
          <span>
            <strong>Agencia:</strong> El cliente retira en punto de recogida
          </span>
        </div>
        <div className={styles.helpStep}>
          <div className={styles.helpStepNumber}>D</div>
          <span>
            <strong>Domicilio:</strong> Entrega directa a la dirección
          </span>
        </div>
        <div className={styles.helpStep}>
          <div className={styles.helpStepNumber}>R</div>
          <span>
            <strong>Recojo:</strong> El cliente retira en tu local
          </span>
        </div>
      </div>
    </div>
  );

  const renderModalContent = (order: OrderItem) => {
    const statusInfo = URBANO_STATUS_MAP[order.status] || {
      label: order.status,
      className: '',
      progress: 0,
      icon: 'info',
    };
    return (
      <>
        <div className={styles.modalHero}>
          <button className={styles.modalHeroClose} onClick={() => setSelectedOrder(null)}>
            <X size={20} />
          </button>
          <div className={styles.modalHeroOrderNumber}>
            <Hash size={24} />
            <h2>#{order.orderNumber || order.id.slice(0, 8).toUpperCase()}</h2>
          </div>
          <div className={styles.statusHeroBadge}>
            {statusInfo.icon && (
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {statusInfo.icon}
              </span>
            )}
            {statusInfo.label}
          </div>
          <div className={styles.modalHeroMeta}>
            <Calendar size={16} />
            {new Date(order.createdAt).toLocaleString('es-PE', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </div>
        </div>
        {renderTimeline(order)}
        <div className={styles.modalTabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'detalles' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('detalles')}
          >
            <Receipt size={16} /> Detalles
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'ticket' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('ticket')}
          >
            <Receipt size={16} /> Ticket
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'ayuda' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('ayuda')}
          >
            <HelpCircle size={16} /> Ayuda
          </button>
        </div>
        {activeTab === 'detalles' && (
          <div className={styles.modalBodyNew}>
            <div className={styles.modalInfoGrid}>
              <section className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>
                  <ShoppingBag size={16} /> Producto
                </h3>
                <div className={styles.productCard}>
                  <div className={styles.productImageWrapper}>
                    {order.productImage ? (
                      <Image
                        src={order.productImage}
                        alt={order.productTitle}
                        width={60}
                        height={60}
                        className={styles.productImg}
                      />
                    ) : (
                      <div className={styles.productPlaceholder}>
                        <ShoppingBag size={24} />
                      </div>
                    )}
                  </div>
                  <div className={styles.productInfo}>
                    <Link
                      href={`/product/${order.productSlug}`}
                      target="_blank"
                      className={styles.productLink}
                    >
                      {order.productTitle} <ExternalLink size={14} />
                    </Link>
                    <p className={styles.itemPrice}>
                      {new Intl.NumberFormat('es-PE', {
                        style: 'currency',
                        currency: order.currency,
                      }).format(Number(order.amount) - Number(order.shippingCost))}
                    </p>
                  </div>
                </div>
              </section>
              <section className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>
                  <CreditCard size={16} /> Pago
                </h3>
                <div className={styles.paymentDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Método:</span>
                    <span className={styles.capitalizeText}>
                      {PAYMENT_METHOD_MAP[order.paymentMethod] || order.paymentMethod}
                    </span>
                  </div>
                  <div className={styles.divider} />
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Subtotal:</span>
                    <span>
                      {new Intl.NumberFormat('es-PE', {
                        style: 'currency',
                        currency: order.currency,
                      }).format(Number(order.amount) - Number(order.shippingCost))}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Envío:</span>
                    <span>
                      {new Intl.NumberFormat('es-PE', {
                        style: 'currency',
                        currency: order.currency,
                      }).format(Number(order.shippingCost))}
                    </span>
                  </div>
                  <div className={`${styles.detailRow} ${styles.totalRow}`}>
                    <span className={styles.detailLabel}>Total:</span>
                    <span className={styles.totalValue}>
                      {new Intl.NumberFormat('es-PE', {
                        style: 'currency',
                        currency: order.currency,
                      }).format(Number(order.amount))}
                    </span>
                  </div>
                </div>
              </section>
              <section className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>
                  <User size={16} /> Cliente
                </h3>
                <div className={styles.customerCard}>
                  <div className={styles.customerHeader}>
                    <div className={styles.customerAvatar}>
                      <User size={24} />
                    </div>
                    <div className={styles.customerBasicInfo}>
                      <p className={styles.customerLabel}>Comprador</p>
                      <p className={styles.customerEmail}>{order.buyerEmail || 'No registrado'}</p>
                    </div>
                  </div>
                  <div className={styles.dataItem}>
                    <IdCard size={16} />
                    <span>DNI: {order.maskedDni || 'No registrado'}</span>
                  </div>
                  <div className={styles.dataItem}>
                    <Phone size={16} />
                    <span>Tel: {order.shippingPhone || 'Sin teléfono'}</span>
                  </div>
                </div>
              </section>
              {renderShippingPathModal(order)}
            </div>
            <div className={styles.quickActions}>
              <button
                className={styles.actionButton}
                onClick={() =>
                  copyToClipboard(
                    `${order.shippingAddress || ''}, ${order.shippingDistrict || ''}, ${order.shippingProvince || ''}`,
                    'address',
                  )
                }
              >
                <MapPin size={16} />
                {copiedField === 'address' ? 'Dirección copiada!' : 'Copiar Dirección'}
              </button>
            </div>
            {order.status === 'esperando_confirmacion' && order.finalizationDeadline && (
              <div className={styles.finalizationPending}>
                <div className={styles.finalizationIcon}>
                  <Clock size={20} />
                </div>
                <div className={styles.finalizationText}>
                  <strong>Esperando confirmación del cliente</strong>
                  <span>
                    El vendedor ha solicitado la finalización. El cliente tiene un plazo para
                    confirmar.
                  </span>
                  <div className={styles.finalizationDeadline}>
                    Deadline:{' '}
                    {new Date(order.finalizationDeadline).toLocaleDateString('es-PE', {
                      dateStyle: 'long',
                    })}
                  </div>
                </div>
              </div>
            )}
            {(order.status === 'completed' || order.status === 'finalizado') && (
              <div className={styles.permanentSeal}>
                <div className={styles.sealIconWrapper}>
                  <CheckCircle size={20} />
                </div>
                <div className={styles.sealText}>
                  <strong>Pedido Finalizado</strong>
                  <span>Esta operación ha sido completada exitosamente.</span>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'ticket' && (
          <div className={styles.modalBodyNew} key={selectedOrder?.ticketImageUrl || 'no-ticket'}>
            {renderTicketSection(selectedOrder!)}
          </div>
        )}
        {activeTab === 'ayuda' && <div className={styles.modalBodyNew}>{renderHelpTab()}</div>}
      </>
    );
  };

  return (
    <article className={styles.card}>
      {confirmAction.open && (
        <div
          className={styles.confirmOverlay}
          onClick={() => setConfirmAction({ open: false, action: null })}
        >
          <div className={styles.confirmContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>¿Estás seguro?</h3>
            <p className={styles.confirmDesc}>Esta acción no se puede deshacer.</p>
            <div className={styles.confirmActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setConfirmAction({ open: false, action: null })}
              >
                Cancelar
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => {
                  confirmAction.action?.();
                  setConfirmAction({ open: false, action: null });
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={styles.filtersHeader}>
        <div className={styles.searchWrapper}>
          <TextField
            type="text"
            label="Buscar por dirección o NRO..."
            value={currentSearch}
            className={styles.searchInputMD3}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter') updateFilters({ search: e.target.value });
            }}
          />
        </div>
        <div className={styles.filterGroup}>
          <Select
            label="Estado"
            outlined
            value={currentStatus || 'all'}
            className={styles.statusSelectMD3}
            onChange={(e: any) => updateFilters({ status: e.target.value })}
          >
            <SelectOption value="all">Todos los estados</SelectOption>
            {Object.entries(URBANO_STATUS_MAP).map(([key, info]) => (
              <SelectOption key={key} value={key}>
                {info.label}
              </SelectOption>
            ))}
          </Select>
          <Select
            label="Límite"
            outlined
            value={currentLimit.toString()}
            className={styles.limitSelectMD3}
            onChange={(e: any) => updateFilters({ limit: e.target.value })}
          >
            <SelectOption value="10">10 por página</SelectOption>
            <SelectOption value="20">20 por página</SelectOption>
            <SelectOption value="50">50 por página</SelectOption>
          </Select>
        </div>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>NRO Orden</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Ruta de Envío</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  No se encontraron pedidos.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const statusInfo = URBANO_STATUS_MAP[order.status] || {
                  label: order.status,
                  className: '',
                  progress: 0,
                };
                return (
                  <tr key={order.id}>
                    <td className={styles.orderNumberCell}>
                      <span className={styles.orderNumber}>
                        #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className={styles.productCell}>
                      <Link
                        href={`/product/${order.productSlug}`}
                        target="_blank"
                        className={styles.productTableLink}
                      >
                        {order.productTitle}
                      </Link>
                    </td>
                    <td className={styles.priceCell}>
                      {new Intl.NumberFormat('es-PE', {
                        style: 'currency',
                        currency: order.currency,
                      }).format(Number(order.amount))}
                    </td>
                    <td className={styles.trackingCell}>{renderShippingProgress(order)}</td>
                    <td className={styles.statusCell}>
                      <span className={`${styles.statusBadge} ${styles[statusInfo.className]}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(order.createdAt).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className={styles.pageButton}
          >
            Anterior
          </button>
          <div className={styles.pageInfo}>
            Página <span>{currentPage}</span> de {totalPages}
          </div>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className={styles.pageButton}
          >
            Siguiente
          </button>
        </div>
      )}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {renderModalContent(selectedOrder)}
            <footer className={styles.modalFooter}>
              <button className={styles.primaryButton} onClick={() => setSelectedOrder(null)}>
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}
    </article>
  );
}
