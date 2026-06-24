'use client';

import { AlertTriangle, CheckCircle, Lightbulb, Package, RefreshCw, Truck } from 'lucide-react';
import helpStyles from './HelpPanel.module.css';
import styles from './RecentOrders.module.css';

interface HelpPanelProps {
  selectedPhase: number;
}

const PHASE_HELP: Record<number, { icon: React.ReactNode; title: string; text: string }> = {
  0: {
    icon: <Package size={20} />,
    title: 'Preparar el Pedido',
    text: 'El comprador ya pagó. Verificá los datos de envío (dirección, tipo de envío) y prepará el producto. Coordiná con la agencia o preparalo para entrega.',
  },
  1: {
    icon: <RefreshCw size={20} />,
    title: 'Subir el Ticket de Envío',
    text: 'Sacale una foto clara al comprobante del courier. Asegurate de que se vea el número de guía. Subila abajo en "Validación de Ticket". El comprador validará y aceptará.',
  },
  2: {
    icon: <Truck size={20} />,
    title: 'Seguimiento del Envío',
    text: 'El paquete está en camino. Usá los datos del courier para hacer tracking. Cuando el comprador confirme la recepción, podrás notificar la entrega desde esta fase.',
  },
  3: {
    icon: <CheckCircle size={20} />,
    title: 'Finalización del Pedido',
    text: 'El pedido está por cerrarse. Si está esperando confirmación del comprador, esperá a que confirme o a que venza el plazo. Si ya está finalizado, ¡venta completada!',
  },
};

export default function HelpPanel({ selectedPhase }: HelpPanelProps) {
  const help = PHASE_HELP[selectedPhase] || PHASE_HELP[0];

  return (
    <div className={styles.helpFlowContainer}>
      {/* Phase-contextual help */}
      <div className={helpStyles.perPhaseHelp}>
        <div className={helpStyles.phaseHelpHeader}>
          <div className={helpStyles.phaseHelpIcon}>{help.icon}</div>
          <h3 className={helpStyles.phaseHelpTitle}>{help.title}</h3>
        </div>
        <p className={helpStyles.phaseHelpText}>{help.text}</p>
      </div>

      {/* Persistent sections footer */}
      <div className={helpStyles.persistentFooter}>
        {/* SECCIÓN: Consejos para el Vendedor */}
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
              <strong>Subí el ticket rápido:</strong> Entre más rápido subas el ticket, más rápido
              el cliente validará y saldrá el producto. ¡La velocidad es clave!
            </p>
          </div>
          <div className={styles.tipItem}>
            <div className={styles.tipIcon}>📦</div>
            <p className={styles.tipText}>
              <strong>Empaquetado seguro:</strong> Asegurate de que el producto esté bien
              empaquetado. Vos sos responsable hasta que el cliente lo reciba.
            </p>
          </div>
        </div>

        {/* SECCIÓN: Reglas de Negocio (collapsible) */}
        <details className={styles.warningsSection}>
          <summary className={styles.warningsHeader}>
            <div className={styles.warningsIcon}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className={styles.warningsTitle}>Reglas de Negocio</h3>
              <p className={styles.warningsSubtitle}>
                Cumplí con los tiempos para evitar sanciones
              </p>
            </div>
          </summary>
          <div className={styles.warningsList}>
            <div className={styles.warningItem}>
              <div className={styles.warningNumber}>1</div>
              <div className={styles.warningContent}>
                <h4 className={styles.warningTitle}>Pedidos sin terminar</h4>
                <p className={styles.warningText}>
                  Mantener pedidos pendientes afecta directamente la reputación de tu negocio y
                  puede disminuir tus ventas futuras. ¡Completalos a tiempo!
                </p>
              </div>
            </div>
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
            <div className={styles.warningItem}>
              <div className={styles.warningNumber}>3</div>
              <div className={styles.warningContent}>
                <h4 className={styles.warningTitle}>Límite de Quejas</h4>
                <p className={styles.warningText}>
                  Si acumulás{' '}
                  <span className={styles.warningHighlight}>3 órdenes con quejas o reportes</span>,
                  tu cuenta sufrirá desactivación de funciones o ban temporal/permanente de tu RUC.
                  ¡Cuidá tu historial!
                </p>
              </div>
            </div>
            <div className={styles.warningItem}>
              <div className={styles.warningNumber}>4</div>
              <div className={styles.warningContent}>
                <h4 className={styles.warningTitle}>Tiempo Máximo (3 días)</h4>
                <p className={styles.warningText}>
                  Tenés un máximo de{' '}
                  <span className={styles.warningHighlight}>
                    3 días para subir el ticket de envío
                  </span>{' '}
                  tras recibir el pedido. Si no lo hacés, se considerará reporte automático. Lo
                  mismo aplica para la finalización del producto. ¡La puntualidad es clave!
                </p>
              </div>
            </div>
          </div>
        </details>

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
    </div>
  );
}
