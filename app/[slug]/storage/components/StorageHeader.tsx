import { Badge, Button, Icon, IconButton } from '@/shared/components/ui';
import { CircularProgress } from '@/shared/components/ui/feedback/Progress';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { importProductsBatch } from '../actions';
import type { Product } from '../data';
import { ImportPreviewDialog } from './ImportPreviewDialog';
import { ImportSourceModal } from './ImportSourceModal';
import { useStorage } from '../context/StorageContext';
import { StatsHeader } from './StatsHeader';
import { usePermissions } from '../../context/PermissionsContext';

interface StorageHeaderProps {
  productsCount: number;
  allProducts: Product[];
  onAddProduct: () => void;
}

export const StorageHeader = ({ productsCount, allProducts, onAddProduct }: StorageHeaderProps) => {
  const { entitlements } = useStorage();
  const { can, isOwner } = usePermissions();
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  // ... rest of state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const params = useParams();
  const router = useRouter();
  const businessSlug = params.slug as string;

  const handleImportClick = () => {
    setSourceModalOpen(true);
  };

  const handleFileSelected = (file: File) => {
    setSourceModalOpen(false);
    setSelectedFile(file);
    setImportDialogOpen(true);
  };

  const handleImport = async (products: Product[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Mapear al formato que espera el backend
    const payload = products.map((p) => ({
      name: p.name,
      description: p.description || '',
      category: p.category,
      stock: p.stock,
      price: Number(p.price) || 0,
      status: p.status,
      imageUrl: p.image || undefined,
    }));

    // Simular un progreso suave ya que Drizzle no emite progreso real
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 500);

    const result = await importProductsBatch(businessSlug, payload);

    clearInterval(progressInterval);

    if (result.success) {
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setImportDialogOpen(false);
        setSelectedFile(null);
        router.refresh();
      }, 500);
    } else {
      setIsUploading(false);
      alert(result.error || 'Error al importar los productos');
    }
  };

  const handlePreviewClose = () => {
    setImportDialogOpen(false);
    setSelectedFile(null);
  };

  return (
    <header className="storage-header">
      <div className="storage-title-wrap">
        <h1 className="storage-title">Productos</h1>
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
        <IconButton
          style={{
            position: 'relative',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderRadius: '50%',
          }}
          className="notifications-btn"
        >
          <Icon>notifications</Icon>
          <Badge count="3" />
        </IconButton>
        
        {(isOwner || can('products.edit')) && (
          <Button variant="outlined" onClick={handleImportClick} className="btn-import">
            <Icon slot="icon" size={23}>download</Icon>
            <span>Importar</span>
          </Button>
        )}

        {(isOwner || can('products.create')) && (
          <Button variant="filled" onClick={onAddProduct} className="btn-add-product">
            <Icon slot="icon" size={23}>add</Icon>
            <span>Añadir Producto</span>
          </Button>
        )}
      </div>

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
        onImport={handleImport}
      />

      {/* Step 3: Upload progress modal */}
      <Dialog
        open={isUploading}
        style={{ '--md-dialog-container-max-inline-size': '400px' } as React.CSSProperties}
      >
        <div slot="headline" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon>cloud_upload</Icon>
          Importando Productos
        </div>
        <div
          slot="content"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            padding: '1rem 0',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CircularProgress indeterminate style={{ width: 64, height: 64 }} />
            <span style={{ position: 'absolute', fontWeight: 600, fontSize: '0.875rem' }}>
              {uploadProgress}%
            </span>
          </div>

          <p style={{ textAlign: 'center', margin: 0, fontWeight: 500 }}>
            No cierre ni recargue la página. <br />
            Esta operación puede tomar varios segundos.
          </p>
        </div>
      </Dialog>
    </header>
  );
};
