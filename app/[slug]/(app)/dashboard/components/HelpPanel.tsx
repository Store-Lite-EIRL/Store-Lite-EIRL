'use client';

import {
  ABANDONO_DAYS,
  PENALTY_A_PERCENTAGE,
  PENALTY_B_PERCENTAGE,
  PENALTY_COUNT_WINDOW,
  PENALTY_WINDOW_DAYS,
  SELLER_TIMEOUT_DAYS,
} from '@/core/penalties/penaltyTypes';
import {
  AlertTriangle,
  CheckCircle,
  Package,
  RefreshCw,
  Shield,
  Store,
  Truck,
  XCircle,
} from 'lucide-react';
import styles from './HelpPanel.module.css';

interface HelpPanelProps {
  selectedPhase: number;
  shippingType?: string | null;
}

function getPhaseHelp(
  phase: number,
  shippingType?: string | null,
): { icon: React.ReactNode; title: string; text: string } {
  const isPickup = shippingType?.toLowerCase() === 'recojo';

  if (isPickup) {
    switch (phase) {
      case 0:
        return {
          icon: <Package size={20} />,
          title: 'Preparar el Pedido',
          text: 'El comprador ya pagó. Prepará el producto y luego marcá el pedido como "Listo para recojo" desde el panel — así el comprador sabe que ya puede pasar a recogerlo.',
        };
      case 1:
        return {
          icon: <Store size={20} />,
          title: 'Recojo en Tienda',
          text: 'El comprador pasará por tu tienda. Cuando llegue, verificá su código de recojo y DNI, entregá el producto, y luego marcá el pedido como Recogido en el sistema para completar el proceso.',
        };
      case 2:
      case 3:
        return {
          icon: <CheckCircle size={20} />,
          title: 'Finalización del Pedido',
          text: 'El pedido está finalizado. El comprador ya recogió el producto.',
        };
      default:
        return {
          icon: <Package size={20} />,
          title: 'Preparar el Pedido',
          text: 'El comprador ya pagó. Prepará el producto para que el comprador pase a recogerlo.',
        };
    }
  }

  switch (phase) {
    case 0:
      return {
        icon: <Package size={20} />,
        title: 'Preparar el Pedido',
        text: 'El comprador ya pagó. Verificá los datos (dirección, tipo de envío, producto) y preparalo. Coordiná con la agencia o preparalo para entrega.',
      };
    case 1:
      return {
        icon: <RefreshCw size={20} />,
        title: 'Subir el Ticket de Envío',
        text: 'Subí una foto clara del comprobante del courier. Asegurate de que se vea el número de guía. El comprador lo validará para continuar.',
      };
    case 2:
      return {
        icon: <Truck size={20} />,
        title: 'Seguimiento del Envío',
        text: 'El paquete está en camino. Usá los datos del courier para hacer tracking. Cuando el comprador confirme la recepción, marcá la entrega.',
      };
    case 3:
      return {
        icon: <CheckCircle size={20} />,
        title: 'Finalización del Pedido',
        text: 'El pedido está finalizado. Revisá el resumen para ver los detalles completos de la venta.',
      };
    default:
      return {
        icon: <Package size={20} />,
        title: 'Preparar el Pedido',
        text: 'El comprador ya pagó. Verificá los datos y prepará el producto.',
      };
  }
}

// ─── Delivery tips ───
const DOS_DELIVERY = [
  'Subí el ticket lo antes posible — mientras antes subas, antes el cliente confirma y liberás el pedido',
  'Empaquetá el producto de forma segura. Sos responsable hasta que llegue al comprador',
  'Respondé rápido si el cliente reporta un problema. Una respuesta rápida puede evitar una disputa',
  'Verificá el código de recojo y DNI antes de entregar en tienda',
  'Usá los datos de contacto solo para coordinar la entrega del pedido',
];

// ─── Pickup tips ───
const DOS_PICKUP = [
  'Marcá el pedido como listo para recojo apenas tengas el producto preparado — así el comprador sabe que puede pasar a recogerlo',
  'Empaquetá el producto de forma segura. Sos responsable hasta que se entregue en tienda',
  'Respondé rápido si el cliente reporta un problema. Una respuesta rápida puede evitar una disputa',
  'Verificá el código de recojo y DNI antes de entregar, y luego marcá el pedido como Recogido en el sistema para completar el proceso',
  'Usá los datos de contacto solo para coordinar la entrega del pedido',
];

const DONT = [
  'No compartas el DNI, teléfono o dirección del comprador con terceros',
  'No contactes al comprador fuera de Store Lite para asuntos no relacionados al pedido',
  'No entregues el producto sin verificar la identidad del comprador (recojo en tienda)',
  'No uses información del comprador para publicidad o promociones sin su consentimiento',
  'No ignores los reportes o quejas — pueden escalar a una disputa formal',
];

const TIMINGS_DELIVERY = [
  { label: 'Preparación del pedido', time: '48 horas desde la confirmación de pago' },
  { label: 'Registro de envío', time: '3 días para subir el comprobante' },
  { label: 'Respuesta a reportes', time: '48 horas para resolver problemas' },
  { label: 'Finalización automática', time: '3 días sin acción del comprador' },
];

const TIMINGS_PICKUP = [
  { label: 'Preparación del pedido', time: '48 horas desde la confirmación de pago' },
  { label: 'Marcar listo para recojo', time: '3 días para poner el pedido como disponible' },
  { label: 'Respuesta a reportes', time: '48 horas para resolver problemas' },
  {
    label: 'Finalización sin recojo',
    time: '7 días — si el comprador no recoge, se finaliza automáticamente',
  },
];

export default function HelpPanel({ selectedPhase, shippingType }: HelpPanelProps) {
  const isPickup = shippingType?.toLowerCase() === 'recojo';
  const help = getPhaseHelp(selectedPhase, shippingType);
  const DOS = isPickup ? DOS_PICKUP : DOS_DELIVERY;
  const TIMINGS = isPickup ? TIMINGS_PICKUP : TIMINGS_DELIVERY;

  return (
    <div className={styles.helpPanel}>
      {/* ── Phase-contextual help ── */}
      <div className={styles.phaseCard}>
        <div className={styles.phaseCardHeader}>
          <div className={styles.phaseIcon}>{help.icon}</div>
          <h3 className={styles.phaseTitle}>{help.title}</h3>
        </div>
        <p className={styles.phaseDescription}>{help.text}</p>
      </div>

      {/* ── Buenas prácticas / evitar ── */}
      <h3 className={styles.sectionTitle}>Lo que debés hacer y lo que no</h3>
      <div className={styles.doDontGrid}>
        <div className={styles.doColumn}>
          <div className={styles.columnHeader}>
            <CheckCircle size={18} className={styles.columnHeaderIcon} />
            <h4 className={styles.columnTitle}>Buenas prácticas</h4>
          </div>
          <div className={styles.columnList}>
            {DOS.map((item, i) => (
              <div key={i} className={styles.columnItem}>
                <CheckCircle size={16} className={styles.columnItemIcon} />
                <p className={styles.columnItemText}>{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.dontColumn}>
          <div className={styles.columnHeader}>
            <XCircle size={18} className={styles.columnHeaderIcon} />
            <h4 className={styles.columnTitle}>Evitá hacer esto</h4>
          </div>
          <div className={styles.columnList}>
            {DONT.map((item, i) => (
              <div key={i} className={styles.columnItem}>
                <XCircle size={16} className={styles.columnItemIcon} />
                <p className={styles.columnItemText}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Protección de datos ── */}
      <h3 className={styles.sectionTitle}>
        <Shield size={18} /> Protección de datos
      </h3>
      <div className={styles.securityCard}>
        <p className={styles.securityIntro}>
          Store Lite protege la información de tus compradores. Estos datos son de uso exclusivo
          para completar la venta:
        </p>
        <div className={styles.securityContent}>
          <div className={styles.securityItem}>
            <CheckCircle size={16} className={styles.securityItemIcon} />
            <span className={styles.securityGood}>
              DNI enmascarado (***1234), teléfono de contacto, dirección de envío
            </span>
          </div>
          <div className={styles.securityItem}>
            <XCircle size={16} className={styles.securityItemIcon} />
            <span className={styles.securityBad}>
              No compartas esta información fuera de la plataforma. Store Lite audita todas las
              acciones dentro del sistema. Compartir datos con terceros puede resultar en la
              suspensión temporal o permanente de tu cuenta.
            </span>
          </div>
          <div className={styles.securityItem}>
            <CheckCircle size={16} className={styles.securityItemIcon} />
            <span className={styles.securityGood}>
              Usá los datos solo para coordinar la entrega. Todo el resto de la comunicación debe
              ocurrir dentro de Store Lite.
            </span>
          </div>
        </div>
      </div>

      {/* ── Responsabilidades ── */}
      <h3 className={styles.sectionTitle}>
        <AlertTriangle size={18} /> Responsabilidades del vendedor
      </h3>
      <div className={styles.responsibilitiesCard}>
        <p className={styles.responsibilityIntro}>
          Como vendedor, sos responsable del producto desde que se confirma la venta hasta que el
          comprador lo recibe o recoge.
        </p>

        <div className={styles.timingSection}>
          <h4 className={styles.timingTitle}>⏱ Tiempos clave</h4>
          <div className={styles.timingList}>
            {TIMINGS.map((item, i) => (
              <div key={i} className={styles.timingItem}>
                <div className={styles.timingDot} />
                <p className={styles.timingText}>
                  <strong>{item.label}:</strong>{' '}
                  <span className={styles.timingBadge}>{item.time}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.consequences}>
          <div className={styles.consequenceItem}>
            <CheckCircle size={18} className={styles.consequenceIcon} />
            <span className={`${styles.consequenceText} ${styles.consequenceGood}`}>
              Cumplir a tiempo mejora tu reputación y aumenta tus ventas
            </span>
          </div>
          <div className={styles.consequenceItem}>
            <XCircle size={18} className={styles.consequenceIcon} />
            <span className={`${styles.consequenceText} ${styles.consequenceBad}`}>
              No cumplir genera reportes que afectan tu cuenta
            </span>
          </div>
          <div className={styles.consequenceItem}>
            <AlertTriangle size={18} className={styles.consequenceIcon} />
            <span className={`${styles.consequenceText} ${styles.consequenceWarning}`}>
              3 reportes o quejas pueden resultar en la desactivación temporal de tu cuenta
            </span>
          </div>
        </div>
      </div>

      {/* ── Penalties ── */}
      <h3 className={styles.sectionTitle}>
        <AlertTriangle size={18} /> Multas por demora
      </h3>
      <div className={styles.penaltyCard}>
        <p className={styles.penaltyIntro}>
          <strong>Transparencia primero:</strong> Antes no te avisábamos de estas reglas de forma
          clara. Ahora sí. Acá están las consecuencias si no preparás el pedido a tiempo:
        </p>

        <div className={styles.penaltySteps}>
          <div className={styles.penaltyStep}>
            <div className={styles.penaltyStepIcon}>
              <span className={styles.penaltyStepNumber}>1</span>
            </div>
            <div className={styles.penaltyStepContent}>
              <h4 className={styles.penaltyStepTitle}>
                Penalidad A — {SELLER_TIMEOUT_DAYS} días sin preparar
              </h4>
              <p className={styles.penaltyStepDesc}>
                Si pasan {SELLER_TIMEOUT_DAYS} días desde la compra y no preparaste el pedido, se
                genera una <strong>multa del {PENALTY_A_PERCENTAGE}%</strong> del valor del producto
                y se <strong>bloquea Cobra con Culqi</strong> hasta que pagues la multa.
              </p>
            </div>
          </div>

          <div className={styles.penaltyStep}>
            <div className={styles.penaltyStepIcon}>
              <span className={styles.penaltyStepNumber}>2</span>
            </div>
            <div className={styles.penaltyStepContent}>
              <h4 className={styles.penaltyStepTitle}>
                Penalidad B — {ABANDONO_DAYS} días sin preparar
              </h4>
              <p className={styles.penaltyStepDesc}>
                Si llegás a {ABANDONO_DAYS} días sin preparar el pedido, se genera una{' '}
                <strong>multa del {PENALTY_B_PERCENTAGE}%</strong> y tu{' '}
                <strong>negocio se cierra permanentemente</strong> (blacklist + bloqueo de RUC).
              </p>
            </div>
          </div>

          <div className={styles.penaltyStep}>
            <div className={styles.penaltyStepIcon}>
              <span className={styles.penaltyStepNumber}>3</span>
            </div>
            <div className={styles.penaltyStepContent}>
              <h4 className={styles.penaltyStepTitle}>
                Bloqueo automático — {PENALTY_COUNT_WINDOW} penalidades en {PENALTY_WINDOW_DAYS}{' '}
                días
              </h4>
              <p className={styles.penaltyStepDesc}>
                Si acumulás {PENALTY_COUNT_WINDOW} penalidades en {PENALTY_WINDOW_DAYS} días, se
                bloquea automáticamente Cobra con Culqi sin importar el monto.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.penaltyFooter}>
          <AlertTriangle size={16} />
          <span>
            Podés ver el detalle de tus multas, pagarlas y reactivar tus cobros desde la sección{' '}
            <strong>Multas</strong> del panel de control.
          </span>
        </div>
      </div>
    </div>
  );
}
