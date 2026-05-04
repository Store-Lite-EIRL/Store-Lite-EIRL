'use client';

import { Icon } from '@/shared';
import { Button } from '@/shared/components/ui/buttons/Button';
import { IconButton } from '@/shared/components/ui/buttons/IconButton';
import { Select, SelectOption } from '@/shared/components/ui/inputs/Select';
import { TextField } from '@/shared/components/ui/inputs/TextField';
import {
  AlertTriangle,
  ArrowLeftRight,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  HelpCircle,
  Home,
  IdCard,
  Lightbulb,
  Loader2,
  MapPin,
  Phone,
  Receipt,
  RefreshCw,
  Search,
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
import {
  notifyDelivery,
  uploadTicketAndUpdatePayment,
  type UploadTicketResult,
} from '../actions/ticketActions';
import styles from './RecentOrders.module.css';

interface ConfirmAction {
  open: boolean;
  action: (() => void) | null;
  title?: string;
  description?: string;
}

interface OrderItem {
  id: string;
  orderNumber: string | null;
  productId: string;
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
  maskedDni: string;
  trackingToken?: string | null;
  ticketImageUrl: string | null;
  finalizationDeadline: string | null;
  completedAt: string | null;
  metadata: any;
  createdAt: string;
  businessId: string;
}

interface RecentOrdersProps {
  orders: OrderItem[];
  totalPages: number;
  currentPage: number;
  currentStatus: string;
  currentSearch: string;
  currentDate: string;
  businessSlug: string;
}

const URBANO_STATUS_MAP: Record<
  string,
  {
    label: string;
    className: string;
    progress: number;
    icon: string;
    lucideIcon: React.ComponentType<any>;
  }
> = {
  pending: {
    label: 'Pendiente',
    className: 'statusPending',
    progress: 5,
    icon: 'pending',
    lucideIcon: Clock,
  },
  paid: {
    label: 'Pagado',
    className: 'statusPaid',
    progress: 10,
    icon: 'payments',
    lucideIcon: CreditCard,
  },
  processing: {
    label: 'Procesando',
    className: 'statusProcessing',
    progress: 20,
    icon: 'settings',
    lucideIcon: RefreshCw,
  },
  analizando: {
    label: 'Analizando',
    className: 'statusAnalyzing',
    progress: 15,
    icon: 'search',
    lucideIcon: Search,
  },
  validando: {
    label: 'VALIDANDO',
    className: 'statusVerifying',
    progress: 25,
    icon: 'fact_check',
    lucideIcon: RefreshCw,
  },
  not_delivered: {
    label: 'No Entregado',
    className: 'statusFailed',
    progress: 30,
    icon: 'hourglass_top',
    lucideIcon: X,
  },
  aceptado: {
    label: 'Aceptado',
    className: 'statusAccepted',
    progress: 40,
    icon: 'check_circle',
    lucideIcon: CheckCircle,
  },
  delivered: {
    label: 'Entregado al Courier',
    className: 'statusDelivered',
    progress: 50,
    icon: 'local_shipping',
    lucideIcon: Truck,
  },
  shipped: {
    label: 'Enviado',
    className: 'statusDelivered',
    progress: 60,
    icon: 'local_shipping',
    lucideIcon: Truck,
  },
  en_reparto: {
    label: 'En Reparto',
    className: 'statusEnReparto',
    progress: 75,
    icon: 'local_shipping',
    lucideIcon: Truck,
  },
  esperando_confirmacion: {
    label: 'Esperando Confirmación',
    className: 'statusWaiting',
    progress: 80,
    icon: 'hourglass_empty',
    lucideIcon: Clock,
  },
  completed: {
    label: 'Finalizado',
    className: 'statusCompleted',
    progress: 100,
    icon: 'verified',
    lucideIcon: CheckCircle,
  },
  finalizado: {
    label: 'Finalizado',
    className: 'statusCompleted',
    progress: 100,
    icon: 'verified',
    lucideIcon: CheckCircle,
  },

  disputed: {
    label: 'En Disputa',
    className: 'statusRejected',
    progress: 0,
    icon: 'gavel',
    lucideIcon: AlertTriangle,
  },
  failed: {
    label: 'Fallido',
    className: 'statusFailed',
    progress: 0,
    icon: 'error',
    lucideIcon: X,
  },
  refund_requested: {
    label: 'Reembolso Solicitado',
    className: 'statusRejected',
    progress: 0,
    icon: 'currency_exchange',
    lucideIcon: ArrowLeftRight,
  },
  refunded: {
    label: 'Reembolsado',
    className: 'statusRejected',
    progress: 0,
    icon: 'currency_exchange',
    lucideIcon: ArrowLeftRight,
  },
  rechazado: {
    label: 'Rechazado',
    className: 'statusRejected',
    progress: 0,
    icon: 'cancel',
    lucideIcon: X,
  },
};

// Estados que REALMENTE existen en la Base de Datos (schema.ts)
const DB_STATUS_FILTERS = [
  'pending',
  'paid',
  'validando',
  'not_delivered',
  'delivered',
  'completed',
  'failed',
  'disputed',
  'refund_requested',
  'refunded',
];

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
  currentStatus,
  currentSearch,
  currentDate,
  businessSlug,
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
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>({ open: false, action: null });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState(currentSearch);

  // Sync local search with URL param
  useEffect(() => {
    setLocalSearch(currentSearch);
  }, [currentSearch]);

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
    setIsFilterLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === 'all' || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Siempre volver a página 1 al filtrar (excepto en cambio de página)
    if (!('page' in updates)) {
      params.set('page', '1');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    // Simular tiempo mínimo de carga para UX
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 500);
  };

  const handlePageChange = (newPage: number) => {
    setIsFilterLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 500);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      // Fallback
    }
  };

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
        setSelectedOrder({ ...selectedOrder, status: 'en_reparto' as any });
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
          <MapPin size={18} /> Ruta de Entrega
        </h3>
        <div className={styles.shippingPathHorizontal}>
          {/* Inicio */}
          <div className={styles.pathItemHorizontal}>
            <div
              className={`${styles.pathIcon} ${statusInfo.progress >= 10 ? styles.pathIconActive : ''}`}
            >
              <Store size={20} />
            </div>
            <div className={styles.pathLabelAlwaysVisible}>Inicio</div>
            <div className={styles.pathTooltip}>
              <p className={styles.pathValue}>Almacén Central (Lima)</p>
            </div>
          </div>

          {type !== 'recojo' && (
            <>
              <div className={styles.pathArrow}>→</div>
              <div className={styles.pathItemHorizontal}>
                <div
                  className={`${styles.pathIcon} ${statusInfo.progress >= 40 ? styles.pathIconActive : ''}`}
                >
                  <Truck size={20} />
                </div>
                <div className={styles.pathLabelAlwaysVisible}>Agencia</div>
                <div className={styles.pathTooltip}>
                  <p className={styles.pathValue}>{order.shippingAgency || 'Distribución local'}</p>
                </div>
              </div>
            </>
          )}

          {type === 'domicilio' && (
            <>
              <div className={styles.pathArrow}>→</div>
              <div className={styles.pathItemHorizontal}>
                <div
                  className={`${styles.pathIcon} ${statusInfo.progress >= 80 ? styles.pathIconActive : ''}`}
                >
                  <Home size={20} />
                </div>
                <div className={styles.pathLabelAlwaysVisible}>Destino</div>
                <div className={styles.pathTooltip}>
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
    const isDelivered = order.status === 'delivered';
    const isEnReparto = (order.status as any) === 'en_reparto';
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
              <Button variant="filled" onClick={handleUploadTicket} disabled={uploading}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {uploading ? <RefreshCw size={18} /> : <Send size={18} />}
                  {uploading ? 'Subiendo...' : isEditing ? 'Actualizar Ticket' : 'Enviar Ticket'}
                </span>
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  if (isEditing) setIsEditingTicket(false);
                  handleCancelUpload();
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <X size={18} /> Cancelar
                </span>
              </Button>
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
            <FileText size={16} /> Comprobante de Envío
          </h3>
          {hasTicket && renderStatusBadge()}
        </div>

        {isEditingTicket ? (
          renderUploadForm(true)
        ) : hasTicket ? (
          <div className={styles.ticketCard}>
            {/* Imagen con Badge flotando en la esquina */}
            <div className={styles.ticketImageContainer}>
              <Image
                src={order.ticketImageUrl || ''}
                alt="Ticket"
                fill
                className={`${styles.ticketImage} ${isInValidando ? styles.ticketBlurred : ''}`}
                style={{ objectFit: 'contain' }}
              />
              {/* Badge flotando en esquina superior derecha */}
              <div className={styles.ticketBadgeFloating}>{renderStatusBadge()}</div>
              <div className={styles.ticketImageOverlay}>
                <span>
                  {isDisputed
                    ? 'Ticket rechazado'
                    : isInValidando
                      ? 'Esperando validación'
                      : isEnReparto
                        ? 'En reparto'
                        : 'Ticket confirmado'}
                </span>
              </div>
            </div>

            {/* Info text */}
            <div className={styles.ticketInfo}>
              {isDisputed ? (
                <p className={styles.ticketInfoTextWarning}>
                  ⚠️ El cliente rechazó este ticket. Subí uno nuevo.
                </p>
              ) : isInValidando ? (
                <p className={styles.ticketInfoTextWarning}>⏳ Esperando validación del cliente</p>
              ) : isEnReparto ? (
                <p className={styles.ticketInfoTextSuccess}>
                  🚚 Pedido en reparto — el cliente confirmará recepción
                </p>
              ) : isDelivered ? (
                <p className={styles.ticketInfoTextSuccess}>✓ Ticket confirmado por el cliente</p>
              ) : (
                <p className={styles.ticketInfoTextSuccess}>✓ Ticket subido correctamente</p>
              )}
            </div>

            {/* Botones MD3 centrados */}
            <div className={styles.ticketActionsCentered}>
              {canEditTicket && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsEditingTicket(true);
                    setTicketPreview(null);
                    setTicketFile(null);
                    setUploadResult(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <Upload size={14} /> {isDisputed ? 'Re-subir Ticket' : 'Editar Ticket'}
                </Button>
              )}
              {isDelivered && (
                <Button
                  variant="filled"
                  onClick={() =>
                    setConfirmAction({
                      open: true,
                      action: handleNotifyDelivery,
                      title: '¿Notificar entrega?',
                      description:
                        'Se enviará al cliente una notificación de que su pedido llegó. Esta acción no se puede deshacer.',
                    })
                  }
                  disabled={notifyingDelivery}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {notifyingDelivery ? <RefreshCw size={18} /> : <Truck size={18} />}
                    {notifyingDelivery ? 'Notificando...' : 'Notificar Entrega'}
                  </span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          renderUploadForm()
        )}
      </section>
    );
  };

  const renderHelpTab = () => (
    <div className={styles.helpFlowContainer}>
      {/* SECCIÓN 1: Flujo de Pedido */}
      <div className={styles.helpSection}>
        <div className={styles.helpSectionHeader}>
          <div className={styles.helpSectionIcon}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <h3 className={styles.helpSectionTitle}>Flujo de Pedido</h3>
            <p className={styles.helpSectionSubtitle}>
              Pasos que debés seguir para completar una venta
            </p>
          </div>
        </div>
        <div className={styles.helpSteps}>
          {/* Paso 1 */}
          <div className={styles.helpStep}>
            <div className={`${styles.helpStepNumber} ${styles.statusPaid}`}>1</div>
            <div className={styles.helpStepContent}>
              <h4 className={styles.helpStepTitle}>
                <CreditCard size={14} /> Pedido Recibido (Pagado)
              </h4>
              <p className={styles.helpStepDescription}>
                El cliente realizó el pago del producto + envío. Recordá que{' '}
                <strong>vos estableciste el precio del envío</strong>, por lo que ya está cubierto.
                ¡No te quejes después!
              </p>
              <div className={`${styles.helpStepStatus} ${styles.statusPaid}`}>
                <CheckCircle size={12} /> Estado: PAGADO
              </div>
            </div>
          </div>

          {/* Paso 2 */}
          <div className={styles.helpStep}>
            <div className={`${styles.helpStepNumber} ${styles.statusVerifying}`}>2</div>
            <div className={styles.helpStepContent}>
              <h4 className={styles.helpStepTitle}>
                <Truck size={14} /> Organizá el Envío
              </h4>
              <p className={styles.helpStepDescription}>
                Coordiná el envío directo con la agencia o transporte. El cliente ya pagó el envío
                que vos configuraste, así que el costo ya está en tu cuenta.
              </p>
            </div>
          </div>

          {/* Paso 3 */}
          <div className={styles.helpStep}>
            <div className={`${styles.helpStepNumber} ${styles.statusVerifying}`}>3</div>
            <div className={styles.helpStepContent}>
              <h4 className={styles.helpStepTitle}>
                <Receipt size={14} /> Subí el Ticket de Envío
              </h4>
              <p className={styles.helpStepDescription}>
                Sacale una foto clara al comprobante/ticket del courier y subilo en la pestaña
                Ticket. Una vez subido, el estado pasará a <strong>VALIDANDO</strong>.
              </p>
              <div className={`${styles.helpStepStatus} ${styles.statusVerifying}`}>
                <RefreshCw size={12} /> Estado: VALIDANDO
              </div>
            </div>
          </div>

          {/* Paso 4 */}
          <div className={styles.helpStep}>
            <div className={`${styles.helpStepNumber} ${styles.statusAccepted}`}>4</div>
            <div className={styles.helpStepContent}>
              <h4 className={styles.helpStepTitle}>
                <CheckCircle size={14} /> Validación del Cliente
              </h4>
              <p className={styles.helpStepDescription}>
                El cliente revisará el ticket y aceptará la validación. Una vez que el cliente
                acepte, el estado pasará a <strong>ACEPTADO</strong> y el producto saldrá en camino.
              </p>
              <div className={`${styles.helpStepStatus} ${styles.statusAccepted}`}>
                <CheckCircle size={12} /> Estado: ACEPTADO
              </div>
            </div>
          </div>

          {/* Paso 5 */}
          <div className={styles.helpStep}>
            <div className={`${styles.helpStepNumber} ${styles.statusEnReparto}`}>5</div>
            <div className={styles.helpStepContent}>
              <h4 className={styles.helpStepTitle}>
                <Truck size={14} /> En Reparto / Esperando
              </h4>
              <p className={styles.helpStepDescription}>
                El producto está en camino. El cliente confirmará cuando le llegue. El estado será{' '}
                <strong>EN REPARTO</strong> y luego <strong>ESPERANDO CONFIRMACIÓN</strong>.
              </p>
              <div className={`${styles.helpStepStatus} ${styles.statusEnReparto}`}>
                <Truck size={12} /> Estado: EN REPARTO
              </div>
            </div>
          </div>

          {/* Paso 6 */}
          <div className={styles.helpStep}>
            <div className={`${styles.helpStepNumber} ${styles.helpStepNumberCompleted}`}>6</div>
            <div className={styles.helpStepContent}>
              <h4 className={styles.helpStepTitle}>
                <CheckCircle size={14} /> Confirmación Final
              </h4>
              <p className={styles.helpStepDescription}>
                El cliente confirma que recibió el producto. El pedido pasa a{' '}
                <strong>FINALIZADO</strong> y se completa la venta. ¡Felicidades!
              </p>
              <div className={`${styles.helpStepStatus} ${styles.statusCompleted}`}>
                <CheckCircle size={12} /> Estado: FINALIZADO
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Tipos de Envío */}
      <div className={styles.helpSection}>
        <div className={styles.helpSectionHeader}>
          <div className={styles.helpSectionIcon}>
            <Truck size={20} />
          </div>
          <div>
            <h3 className={styles.helpSectionTitle}>Tipos de Envío</h3>
            <p className={styles.helpSectionSubtitle}>Conocé las opciones de entrega disponibles</p>
          </div>
        </div>
        <div className={styles.shippingTypesGrid}>
          <div className={styles.shippingTypeCard}>
            <div className={styles.shippingTypeIcon}>
              <Truck size={20} />
            </div>
            <h4 className={styles.shippingTypeName}>Agencia</h4>
            <p className={styles.shippingTypeDesc}>
              El cliente retira en un punto de recogida (Olva, Shalom, etc.)
            </p>
          </div>
          <div className={styles.shippingTypeCard}>
            <div className={styles.shippingTypeIcon}>
              <Home size={20} />
            </div>
            <h4 className={styles.shippingTypeName}>Domicilio</h4>
            <p className={styles.shippingTypeDesc}>Entrega directa a la dirección del cliente</p>
          </div>
          <div className={styles.shippingTypeCard}>
            <div className={styles.shippingTypeIcon}>
              <Store size={20} />
            </div>
            <h4 className={styles.shippingTypeName}>Recojo</h4>
            <p className={styles.shippingTypeDesc}>
              El cliente pasa a retirar el producto a tu local
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: Consejos para el Vendedor */}
      <div className={styles.tipsSection}>
        <div className={styles.tipsHeader}>
          <Lightbulb size={18} />
          <h3 className={styles.tipsTitle}>Consejos para Vos</h3>
        </div>
        <div className={styles.tipItem}>
          <div className={styles.tipIcon}>💡</div>
          <p className={styles.tipText}>
            <strong>Sacá una foto clara del ticket:</strong> Asegurate de que se vea el número de
            guía y el código de barras para que el cliente pueda rastrear su pedido.
          </p>
        </div>
        <div className={styles.tipItem}>
          <div className={styles.tipIcon}>⏰</div>
          <p className={styles.tipText}>
            <strong>Subí el ticket rápido:</strong> Entre más rápido subas el ticket, más rápido el
            cliente validará y saldrá el producto. ¡La velocidad es clave!
          </p>
        </div>
        <div className={styles.tipItem}>
          <div className={styles.tipIcon}>📦</div>
          <p className={styles.tipText}>
            <strong>Empaquetado seguro:</strong> Asegurate de que el producto esté bien empaquetado.
            Vos sos responsable hasta que el cliente lo reciba.
          </p>
        </div>
      </div>

      {/* SECCIÓN 4: Advertencias de Negocio */}
      <div className={styles.warningsSection}>
        <div className={styles.warningsHeader}>
          <div className={styles.warningsIcon}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className={styles.warningsTitle}>Reglas de Negocio</h3>
            <p className={styles.warningsSubtitle}>Cumplí con los tiempos para evitar sanciones</p>
          </div>
        </div>
        <div className={styles.warningsList}>
          {/* Regla 1 */}
          <div className={styles.warningItem}>
            <div className={styles.warningNumber}>1</div>
            <div className={styles.warningContent}>
              <h4 className={styles.warningTitle}>Pedidos sin terminar</h4>
              <p className={styles.warningText}>
                Mantener pedidos pendientes afecta directamente la reputación de tu negocio y puede
                disminuir tus ventas futuras. ¡Completalos a tiempo!
              </p>
            </div>
          </div>

          {/* Regla 2 */}
          <div className={styles.warningItem}>
            <div className={styles.warningNumber}>2</div>
            <div className={styles.warningContent}>
              <h4 className={styles.warningTitle}>Confirmación Automática (3 días)</h4>
              <p className={styles.warningText}>
                Si el cliente no acepta el ticket y no lo rechaza,{' '}
                <span className={styles.warningHighlight}>
                  se confirmará automáticamente a los 3 días
                </span>
                . Lo mismo aplica para la finalización del envío. ¡No esperes al último momento!
              </p>
            </div>
          </div>

          {/* Regla 3 */}
          <div className={styles.warningItem}>
            <div className={styles.warningNumber}>3</div>
            <div className={styles.warningContent}>
              <h4 className={styles.warningTitle}>Límite de Quejas</h4>
              <p className={styles.warningText}>
                Si acumulás{' '}
                <span className={styles.warningHighlight}>3 órdenes con quejas o reportes</span>, tu
                cuenta sufrirá desactivación de funciones o ban temporal/permanente de tu RUC.
                ¡Cuidá tu historial!
              </p>
            </div>
          </div>

          {/* Regla 4 */}
          <div className={styles.warningItem}>
            <div className={styles.warningNumber}>4</div>
            <div className={styles.warningContent}>
              <h4 className={styles.warningTitle}>Tiempo Máximo (3 días)</h4>
              <p className={styles.warningText}>
                Tenés un máximo de{' '}
                <span className={styles.warningHighlight}>
                  3 días para subir el ticket de envío
                </span>{' '}
                tras recibir el pedido. Si no lo hacés, se considerará reporte automático. Lo mismo
                aplica para la finalización del producto. ¡La puntualidad es clave!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NOTA IMPORTANTE */}
      <div className={styles.noteBox}>
        <div className={styles.noteIcon}>
          <AlertTriangle size={18} />
        </div>
        <p className={styles.noteText}>
          <strong>Recordatorio:</strong> El precio del envío lo estableciste VOS al configurar el
          producto. El cliente ya pagó ese monto, así que no hay excusas para no hacer el envío a
          tiempo. ¡El ticket se difumina hasta que el cliente confirme la validación!
        </p>
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
          <IconButton
            variant="filled-tonal"
            onClick={() => setSelectedOrder(null)}
            aria-label="Cerrar"
            className={styles.modalHeroClose}
          >
            <X size={24} />
          </IconButton>
          <div className={styles.modalHeroOrderNumber}>
            <div className={`${styles.statusHeroBadge} ${styles[statusInfo.className] || ''}`}>
              {statusInfo.lucideIcon && (
                <statusInfo.lucideIcon
                  size={16}
                  style={{ marginRight: '0.3rem', verticalAlign: 'middle' }}
                />
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
        {renderTimeline(order)}
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
            className={`${styles.tabButton} ${activeTab === 'ticket' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('ticket')}
          >
            <Icon slot="icon" size={21}>
              local_activity
            </Icon>{' '}
            Ticket
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
            {/* SECCIÓN 1: Producto y Cliente UNIDOS en un solo card */}
            <section className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>
                <User size={18} /> Comprador y Producto
              </h3>
              <div className={`${styles.unifiedCard} ${styles.unifiedContent}`}>
                {/* Cliente arriba */}
                <div className={styles.customerSection}>
                  <div className={styles.customerHeader}>
                    <div className={styles.customerAvatar}>
                      <User size={28} />
                    </div>
                    <div className={styles.customerBasicInfo}>
                      <p className={styles.customerLabel}>Comprador</p>
                      <div className={styles.customerDataRow}>
                        <div className={styles.dataItemInline}>
                          <IdCard size={18} />
                          <span>DNI: {order.maskedDni || 'No registrado'}</span>
                        </div>
                        <div className={styles.dataItemInline}>
                          <Phone size={18} />
                          <span>Tel: {order.shippingPhone || 'Sin teléfono'}</span>
                        </div>
                      </div>
                      <p className={styles.customerEmail}>{order.buyerEmail || 'No registrado'}</p>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className={styles.unifiedDivider} />

                {/* Producto abajo */}
                <div className={styles.productSection}>
                  <div className={styles.productImageWrapper}>
                    {order.productImage ? (
                      <Image
                        src={order.productImage}
                        alt={order.productTitle}
                        width={100}
                        height={100}
                        className={styles.productImg}
                      />
                    ) : (
                      <div className={styles.productPlaceholder}>
                        <ShoppingBag size={36} />
                      </div>
                    )}
                  </div>
                  <div className={styles.productInfo}>
                    <Link
                      href={`/${businessSlug}/product/${order.productId || order.productSlug}`}
                      target="_blank"
                      className={styles.productLink}
                    >
                      {order.productTitle} <ExternalLink size={14} />
                    </Link>
                    <div className={styles.productMetaRow}>
                      <span className={styles.productMetaItem}>
                        <span className={styles.metaLabel}>ID:</span>{' '}
                        {order.productId?.slice(0, 10)}...
                      </span>
                    </div>
                    <div className={styles.productMetaRow}>
                      <span className={styles.productMetaItem}>
                        <span className={styles.metaLabel}>Cant.:</span> 1 unid.
                      </span>
                      <span className={styles.productMetaItem}>
                        <span className={styles.metaLabel}>Envío:</span>{' '}
                        {new Intl.NumberFormat('es-PE', {
                          style: 'currency',
                          currency: order.currency,
                        }).format(Number(order.shippingCost))}
                      </span>
                    </div>
                    <p className={styles.itemPrice}>
                      {new Intl.NumberFormat('es-PE', {
                        style: 'currency',
                        currency: order.currency,
                      }).format(Number(order.amount) - Number(order.shippingCost))}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN 2: Pago - 100% width */}
            <section className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>
                <CreditCard size={18} /> Pago
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

            {/* SECCIÓN 3: Ruta de Entrega - 100% width */}
            {renderShippingPathModal(order)}
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
              <button
                className={styles.confirmBtnText}
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
              </button>
              <button
                className={styles.confirmBtnFilled}
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
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={styles.filtersHeader}>
        <div className={`${styles.searchWrapper} ${styles.searchWithButton}`}>
          <div className={styles.searchContainer}>
            <TextField
              type="text"
              label="Buscar por NRO de orden..."
              value={localSearch}
              className={styles.searchInputMD3}
              onChange={(e: any) => {
                const value = e.target.value;
                setLocalSearch(value);
                // Si se borra el texto, limpiar el filtro inmediatamente
                if (value === '') {
                  updateFilters({ search: null });
                }
              }}
              onKeyDown={(e: any) => {
                if (e.key === 'Enter') updateFilters({ search: localSearch });
              }}
            />
            {/* Botón condicional: solo si hay 12 o más caracteres */}
            {localSearch.length >= 12 && (
              <button
                className={styles.searchButtonInside}
                onClick={() => updateFilters({ search: localSearch })}
              >
                <Search size={18} />
              </button>
            )}
          </div>
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
            {/* Solo mostramos los estados que están en la Base de Datos */}
            {DB_STATUS_FILTERS.map((key) => {
              const info = URBANO_STATUS_MAP[key];
              if (!info) return null;
              return (
                <SelectOption key={key} value={key}>
                  {info.label}
                </SelectOption>
              );
            })}
          </Select>
          <Select
            label="Fecha"
            outlined
            value={currentDate || 'all'}
            className={styles.dateSelectMD3}
            onChange={(e: any) => updateFilters({ date: e.target.value })}
          >
            <SelectOption value="all">Todo</SelectOption>
            <SelectOption value="today">Hoy</SelectOption>
            <SelectOption value="yesterday">Ayer</SelectOption>
            <SelectOption value="week">Esta semana</SelectOption>
          </Select>
        </div>
      </div>
      <div className={styles.tableWrapper} style={{ position: 'relative' }}>
        {isFilterLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(var(--md-sys-color-surface-rgb, 255, 255, 255), 0.8)',
              zIndex: 10,
              borderRadius: 'inherit',
            }}
          >
            <Loader2
              size={36}
              style={{ animation: 'spin 1s linear infinite', color: 'var(--md-sys-color-primary)' }}
            />
          </div>
        )}
        <table className={styles.table}>
          <thead>
            <tr>
              <th>NRO Orden</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Ruta de Envío</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Finalización</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && !isFilterLoading ? (
              <tr>
                <td colSpan={7} className={styles.emptyRow}>
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
                        {order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className={styles.productCell}>
                      <Link
                        href={`/${businessSlug}/product/${order.productId}`}
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
                    <td className={styles.trackingCell}>
                      <button
                        className={styles.viewMoreButton}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <MapPin size={14} />
                        Ver más
                      </button>
                    </td>
                    <td className={styles.statusCell}>
                      <span className={`${styles.statusBadge} ${styles[statusInfo.className]}`}>
                        {statusInfo.lucideIcon && (
                          <statusInfo.lucideIcon
                            size={14}
                            style={{ marginRight: '0.3rem', verticalAlign: 'middle' }}
                          />
                        )}
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
                    <td className={styles.dateCell}>
                      {order.completedAt
                        ? new Date(order.completedAt).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })
                        : '-'}
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
              <Button variant="filled" onClick={() => setSelectedOrder(null)}>
                Cerrar
              </Button>
            </footer>
          </div>
        </div>
      )}
    </article>
  );
}
