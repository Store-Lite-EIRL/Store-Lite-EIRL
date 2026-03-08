import { Button, Dialog, TextField } from '@/shared/components/ui';
import { AlertSnackbar } from '@/shared/components/ui/feedback/AlertSnackbar';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface EditCategoryModalProps {
  open: boolean;
  onClose: () => void;
  category: { id: string; name: string; imageUrl?: string | null } | null;
  onSave: (id: string, name: string, imageFile: File | null) => Promise<void>;
}

export function EditCategoryModal({ open, onClose, category, onSave }: EditCategoryModalProps) {
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    description: string;
    color: 'primary' | 'error' | 'success';
    icon?: string;
  }>({
    open: false,
    description: '',
    color: 'error',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && category) {
      setName(category.name);
      setImageFile(null);
      setPreviewUrl(category.imageUrl || null);
      setIsSubmitting(false);
    }
  }, [open, category]);

  if (!category) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setSnackbar({
          open: true,
          description: 'Formato no válido. Sube JPG, PNG o WEBP (no jfif).',
          color: 'error',
          icon: 'error',
        });
        e.target.value = ''; // clear input
        return;
      }

      const maxSizeInBytes = 1024 * 1024; // 1 MB
      if (file.size > maxSizeInBytes) {
        setSnackbar({
          open: true,
          description: 'La imagen supera 1MB. Elige una más ligera.',
          color: 'error',
          icon: 'warning',
        });
        e.target.value = ''; // clear input
        return;
      }

      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave(category.id, name.trim(), imageFile);
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      setSnackbar({
        open: true,
        description: 'Error al guardar la categoría. Revisa tu conexión.',
        color: 'error',
        icon: 'error_outline',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? () => undefined : onClose}>
      <div slot="headline">Editar Categoría</div>
      <div slot="content">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          {/* Contenedor de la imagen editable */}
          <div
            style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              overflow: 'hidden',
              backgroundColor: 'var(--md-sys-color-surface-container-highest)',
              flexShrink: 0,
              cursor: isSubmitting ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="group"
            onClick={() => !isSubmitting && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/jpeg, image/png, image/webp"
              title="Seleccionar imagen de categoría"
              aria-label="Seleccionar imagen de categoría"
              onChange={handleFileChange}
            />

            {previewUrl ? (
              <Image src={previewUrl} alt={name} fill style={{ objectFit: 'cover' }} />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                fill="currentColor"
                style={{
                  width: '32px',
                  height: '32px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  opacity: 0.6,
                }}
              >
                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z" />
              </svg>
            )}

            {/* Hover overlay para el botón de editar imagen */}
            {!isSubmitting && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 -960 960 960"
                  fill="currentColor"
                  style={{ width: '24px', height: '24px', color: 'white' }}
                >
                  <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                </svg>
              </div>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <TextField
              label="Nombre de la categoría"
              placeholder="Nombre de la categoría"
              title="Nombre de la categoría"
              value={name}
              onInput={(e: Event) => {
                const val = (e.target as HTMLInputElement).value;
                if (val.length <= 20) setName(val);
                else {
                  (e.target as HTMLInputElement).value = val.substring(0, 20);
                  setName(val.substring(0, 20));
                }
              }}
              style={{ width: '100%' }}
              disabled={isSubmitting}
              maxLength={20}
              supportingText={`Imagen menor a 1MB`}
            />
          </div>
        </div>
      </div>
      <div slot="actions">
        <Button variant="text" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button variant="filled" onClick={handleSave} disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? 'Guardando...' : 'Aceptar'}
        </Button>
      </div>

      <AlertSnackbar
        {...snackbar}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        position="bottom-center"
      />
    </Dialog>
  );
}
