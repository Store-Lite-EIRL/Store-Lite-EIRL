'use client';

import type { Business } from '@/core/database/schema';
import { Icon } from '@/shared/components/ui/data-display';
import { AlertSnackbar } from '@/shared/components/ui/feedback';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { deleteBusinessAction } from '../actions';
import { useBusinessSettings } from '../hooks/useBusinessSettings';
import styles from './BusinessSettingsModal.module.css';
import { EquipoTab } from './settings-tabs/EquipoTab';
import { NegocioTab } from './settings-tabs/NegocioTab';
import { ProductosTab } from './settings-tabs/ProductosTab';
import { ResultadosTab } from './settings-tabs/ResultadosTab';
import { TemasTab } from './settings-tabs/TemasTab';

interface BusinessSettingsModalProps {
  business: Business | null;
  open: boolean;
  onClose: () => void;
}

type TabType = 'negocio' | 'productos' | 'resultados' | 'equipo' | 'temas' | 'peligro';

export default function BusinessSettingsModal({
  business,
  open,
  onClose,
}: BusinessSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('negocio');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    formData,
    handleChange,
    logoPreview,
    isUpdatingLogo,
    isSaving,
    hasChanges,
    alert,
    setAlert,
    handleSave,
    handleLogoUpload,
    closeAlert,
  } = useBusinessSettings(business, open);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    },
    [open, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Prevent scroll when modal is open and handle layout shift
  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleLogoUpload(file);
  };

  const handleDelete = useCallback(async () => {
    if (!business) return;

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar "${business.name}"?\n\nEsta acción es irreversible. Se borrarán todos los datos, productos y pedidos asociados.`,
    );
    if (!confirmed) return;

    setAlert({ open: false, description: '', color: 'primary' });

    try {
      const result = await deleteBusinessAction(business.id);
      if (result.success) {
        setAlert({
          open: true,
          description: `"${business.name}" ha sido eliminado definitivamente.`,
          color: 'success',
        });
        // Close modal after a brief delay so the user sees the success
        setTimeout(() => {
          closeAlert();
          onClose();
        }, 1500);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setAlert({
        open: true,
        description: error instanceof Error ? error.message : 'Error al eliminar el negocio.',
        color: 'error',
      });
    }
  }, [business, setAlert, closeAlert, onClose]);

  if (!business || !open) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'negocio':
        return (
          <NegocioTab
            formData={formData}
            handleChange={handleChange}
            logoPreview={logoPreview}
            isUpdatingLogo={isUpdatingLogo}
            isSaving={isSaving}
            hasChanges={hasChanges}
            handleSave={handleSave}
            handleFileChange={handleFileChange}
            fileInputRef={fileInputRef}
          />
        );
      case 'productos':
        return <ProductosTab businessId={business.id} />;
      case 'resultados':
        return <ResultadosTab business={business} />;
      case 'equipo':
        return <EquipoTab businessId={business.id} />;
      case 'temas':
        return <TemasTab />;
      case 'peligro':
        return (
          <div className={styles.contentContainer} style={{ paddingBottom: '48px' }}>
            <h2 className={styles.sectionTitle} style={{ color: 'var(--md-sys-color-error)' }}>
              Zona de Peligro
            </h2>
            <p className={styles.formHint}>Estas acciones son irreversibles.</p>
            <div className={styles.actionsCard}>
              <div className={styles.actionsCardInfo}>
                <div className={styles.actionsCardTitle}>Eliminar negocio</div>
                <div className={styles.actionsCardDesc}>
                  Se borrarán todos los datos, productos y pedidos asociados.
                </div>
              </div>
              <md-filled-button
                suppressHydrationWarning
                style={{ '--md-filled-button-container-color': 'var(--md-sys-color-error)' }}
                onClick={handleDelete}
              >
                Eliminar definitivamente
              </md-filled-button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}>
      <div className={styles.modalContainer}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarContent}>
            <div className={styles.sidebarHeader}>{business.name}</div>

            <button
              className={`${styles.tabButton} ${activeTab === 'negocio' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('negocio')}
            >
              <Icon size={20}>settings</Icon>
              Vista general
            </button>

            <button
              className={`${styles.tabButton} ${activeTab === 'productos' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('productos')}
            >
              <Icon size={20}>inventory_2</Icon>
              Productos
            </button>

            <button
              className={`${styles.tabButton} ${activeTab === 'resultados' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('resultados')}
            >
              <Icon size={20}>analytics</Icon>
              Resultados
            </button>

            <button
              className={`${styles.tabButton} ${activeTab === 'equipo' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('equipo')}
            >
              <Icon size={20}>groups</Icon>
              Equipo
            </button>

            <button
              className={`${styles.tabButton} ${activeTab === 'temas' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('temas')}
            >
              <Icon size={20}>palette</Icon>
              Apariencia
            </button>

            <div
              style={{
                margin: '8px 0',
                borderTop: '1px solid var(--md-sys-color-outline-variant)',
              }}
            />

            <button
              className={styles.tabButton}
              onClick={() => setActiveTab('peligro')}
              style={{ color: 'var(--md-sys-color-error)' }}
            >
              <Icon size={20} style={{ color: 'inherit' }}>
                delete
              </Icon>
              Eliminar Negocio
            </button>
          </div>
        </div>
        <div className={styles.mainContent}>
          {renderTabContent()}
          <div className={styles.closeButtonContainer}>
            <button className={styles.closeButton} onClick={onClose} aria-label="Close">
              <Icon size={18}>close</Icon>
            </button>
            <span className={styles.closeHint}>ESC</span>
          </div>
        </div>
      </div>
      <AlertSnackbar
        open={alert.open}
        description={alert.description}
        color={alert.color}
        onClose={closeAlert}
      />
    </div>
  );
}
