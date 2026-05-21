import { useNotifications } from '@/hooks/useNotifications';
import { AlertSnackbar, Button, Icon } from '@/shared/components/ui';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { usePermissions } from '../../context/PermissionsContext';
import { useStorage } from '../context/StorageContext';
import type { Product } from '../data';
import { ImportProgressDialog } from './import/ImportProgressDialog';
import { ImportPreviewDialog } from './ImportPreviewDialog';
import { ImportSourceModal } from './ImportSourceModal';
import { NotificationsPanel } from './NotificationsPanel';
import { StatsHeader } from './StatsHeader';

interface StorageHeaderProps {
  productsCount: number;
  allProducts: Product[];
  onAddProduct: () => void;
  businessId: string;
}

interface ImportRowInput {
  name: string;
  description?: string;
  category: string;
  stock: number;
  price: number;
  status: string;
  imageUrl?: string;
  brand?: string;
  externalCode?: string;
  tags?: string[];
  secondPrice?: number;
  saleStatus?: string;
  shippingInfo?: string;
  seoTitle?: string;
  seoDescription?: string;
  metadata?: Record<string, unknown>;
}

export const StorageHeader = ({
  productsCount,
  allProducts,
  onAddProduct,
  businessId,
}: StorageHeaderProps) => {
  const { can, isOwner } = usePermissions();
  const { entitlements, refreshProducts } = useStorage();
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showImportWarning, setShowImportWarning] = useState(false);

  // Progress dialog state
  const [progressOpen, setProgressOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRowInput[]>([]);

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [realtimeToast, setRealtimeToast] = useState<{
    id: string;
    title: string;
    message: string;
  } | null>(null);

  const onNewNotification = useCallback((notif: { id: string; title: string; message: string }) => {
    setRealtimeToast({
      id: notif.id,
      title: notif.title,
      message: notif.message,
    });
    setTimeout(() => {
      setRealtimeToast((prev) => (prev?.id === notif.id ? null : prev));
    }, 5000);
  }, []);

  const {
    unreadCount,
    notifications,
    isLoading: notifLoading,
  } = useNotifications({
    businessId,
    onNewNotification,
  });

  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const handleImportClick = () => {
    if (window.innerWidth <= 425) {
      setShowImportWarning(true);
    } else {
      setSourceModalOpen(true);
    }
  };

  const handleFileSelected = (file: File) => {
    setSourceModalOpen(false);
    setSelectedFile(file);
    setImportDialogOpen(true);
  };

  const handlePreviewClose = () => {
    setImportDialogOpen(false);
    setSelectedFile(null);
  };

  // Called when user clicks "Importar N productos" in the preview dialog
  const handleImportStart = (rows: ImportRowInput[], _businessSlug: string) => {
    setImportDialogOpen(false);
    setSelectedFile(null);
    setImportRows(rows);
    setProgressOpen(true);
  };

  // Called when progress dialog is done ("Aceptar")
  const handleProgressComplete = () => {
    setProgressOpen(false);
    setImportRows([]);
    refreshProducts().then(() => router.refresh());
  };

  // Called when progress dialog is closed while importing (user cancels)
  const handleProgressClose = () => {
    setProgressOpen(false);
    setImportRows([]);
  };

  return (
    <header className="storage-header">
      <div className="storage-title-wrap">
        <h1 className="storage-title">Almacén</h1>
        <div className="product-count-wrapper">
          <p className="product-count">({productsCount} productos)</p>
          {entitlements && entitlements.maxProducts !== Infinity && (
            <div
              className={`limit-badge ${productsCount >= entitlements.maxProducts ? 'limit-reached' : ''}`}
            >
              Límite: {entitlements.maxProducts}
            </div>
          )}
        </div>
      </div>

      <StatsHeader products={allProducts} />

      <div className="header-actions">
        {(isOwner || can('products.edit')) && (
          <Button variant="outlined" onClick={handleImportClick} className="btn-import">
            <Icon slot="icon" size={23}>
              download
            </Icon>
            <span>Importar</span>
          </Button>
        )}

        {(isOwner || can('products.create')) && (
          <Button variant="filled" onClick={onAddProduct} className="btn-add-product">
            <Icon slot="icon" size={23}>
              add
            </Icon>
            <span>Añadir Producto</span>
          </Button>
        )}

        <button
          onClick={() => setNotificationsOpen(true)}
          className="notifications-btn"
          title={`${unreadCount} notificaciones sin leer`}
        >
          <Icon>notifications</Icon>
          {unreadCount > 0 && (
            <span className="notifications-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>
      </div>

      {/* Import warning on small screens */}
      <AlertSnackbar
        icon="info"
        description="La importación está disponible solo en pantallas mayores a 425px para una mejor visualización."
        color="warning"
        position="bottom-center"
        open={showImportWarning}
        onClose={() => setShowImportWarning(false)}
        autoCloseDuration={4000}
      />

      {/* Notifications panel */}
      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        isLoading={notifLoading}
        unreadCount={unreadCount}
      />

      {/* Real-time toast for new notifications */}
      {realtimeToast && (
        <div className="realtime-toast">
          <div className="realtime-toast-icon">
            <Icon>notifications</Icon>
          </div>
          <div className="realtime-toast-content">
            <span className="realtime-toast-title">{realtimeToast.title}</span>
            <span className="realtime-toast-message">{realtimeToast.message}</span>
          </div>
          <button className="realtime-toast-close" onClick={() => setRealtimeToast(null)}>
            <Icon>close</Icon>
          </button>
        </div>
      )}

      {/* Step 1: choose source */}
      <ImportSourceModal
        open={sourceModalOpen}
        onClose={() => setSourceModalOpen(false)}
        onFileSelected={handleFileSelected}
      />

      {/* Step 2: preview & confirm import */}
      <ImportPreviewDialog
        open={importDialogOpen}
        file={selectedFile}
        onClose={handlePreviewClose}
        onImportStart={handleImportStart}
      />

      {/* Step 3: progress & results */}
      <ImportProgressDialog
        open={progressOpen}
        businessSlug={slug}
        rows={importRows}
        onComplete={handleProgressComplete}
        onClose={handleProgressClose}
      />
    </header>
  );
};
