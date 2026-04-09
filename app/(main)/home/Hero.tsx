'use client';

import { Button, IconButton } from '@/shared/components/ui/buttons';
import { Icon } from '@/shared/components/ui/data-display';
import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import styles from './Hero.module.css';
import { useHeroController, type HeroBusiness } from './useHeroController';

interface HeroProps {
  business?: HeroBusiness | null;
  isOwner?: boolean;
}

export default function Hero({ business, isOwner = false }: HeroProps) {
  const {
    backgroundImage,
    backgroundPositionStyle,
    confirmDeleteBackground,
    cursorStyle,
    fileInputRef,
    handleCancel,
    handleDeleteClick,
    handleFileChange,
    handleMenuClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleSave,
    heroRef,
    isEditing,
    isSaving,
    menuRef,
    setShowDeleteDialog,
    setSnackbar,
    showDeleteDialog,
    snackbar,
  } = useHeroController({ business: business || null });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <section
        ref={heroRef}
        className={styles.heroContainer}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          backgroundImage: backgroundImage ? `url('${backgroundImage}')` : undefined,
          backgroundPosition: backgroundPositionStyle,
          cursor: cursorStyle,
        }}
      >
        {isSaving && <md-linear-progress indeterminate className={styles.progressBar} />}

        {isOwner && !isEditing && business && (
          <div className={styles.menuContainer}>
            <IconButton id="hero-menu-trigger" onClick={handleMenuClick} suppressHydrationWarning>
              <md-icon suppressHydrationWarning>more_vert</md-icon>
            </IconButton>
            <md-menu
              ref={menuRef}
              id="hero-menu"
              anchor="hero-menu-trigger"
              anchor-corner="end-start"
              menu-corner="start-start"
              positioning="popover"
              suppressHydrationWarning
            >
              <md-menu-item onClick={handleUploadClick} suppressHydrationWarning>
                <div slot="headline">Subir publicidad (Portada)</div>
                <Icon slot="icon" size={21}>
                  upload
                </Icon>
              </md-menu-item>
              <md-menu-item onClick={handleDeleteClick} suppressHydrationWarning>
                <div slot="headline">Eliminar imagen</div>
                <Icon slot="icon" size={21}>
                  delete
                </Icon>
              </md-menu-item>
            </md-menu>
          </div>
        )}

        <div className={styles.heroContent}>
          <div className={styles.textContainer}>
            <h1 className={styles.title}>{business?.name || 'Mi Negocio'}</h1>
          </div>
        </div>

        {isEditing && (
          <div className={styles.editControls}>
            <div className={styles.instructionText}>Arrastra para posicionar la publicidad</div>
            <div className={styles.buttonGroup}>
              <Button variant="outlined" onClick={handleCancel} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Portada'}
              </Button>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            console.warn('[Hero] input onChange triggered');
            handleFileChange(e);
          }}
          accept="image/*"
          style={{ display: 'none' }}
          aria-label="Subir publicidad"
        />
      </section>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} type="alert">
        <div slot="headline">¿Eliminar imagen?</div>
        <div slot="content">
          ¿Estas seguro de que deseas eliminar la imagen de publicidad de tu negocio?
        </div>
        <div slot="actions">
          <Button variant="text" onClick={() => setShowDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button variant="text" onClick={confirmDeleteBackground}>
            Eliminar
          </Button>
        </div>
      </Dialog>

      <AlertSnackbar
        {...snackbar}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        position="bottom-center"
      />
    </>
  );
}
