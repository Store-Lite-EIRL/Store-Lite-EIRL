'use client';

import { closeElementById } from '@/shared/utils';
import { Button } from '../buttons/Button';
import { Chips } from '../data-display/Chips';
import { Divider } from '../data-display/Divider';
import { Icon } from '../data-display/Icon';
import { Checkbox } from '../inputs/Checkbox';
import { TextField } from '../inputs/TextField';
import { Card } from './Card';
import { Dialog } from './Dialog';
import { Sheet } from './Sheet';
import { SteppedSheet } from './SteppedSheet';

const DialogDemo = () => (
  <Dialog id="catalog-dialog">
    <div slot="headline">Confirm Action</div>
    <div slot="content">
      This is a high-fidelity Material Design 3 dialog. It supports slots for headlines, content,
      and actions.
    </div>
    <div slot="actions">
      <Button variant="text" onClick={() => closeElementById('catalog-dialog')}>
        Cancel
      </Button>
      <Button variant="filled" onClick={() => closeElementById('catalog-dialog')}>
        Accept
      </Button>
    </div>
  </Dialog>
);

const SheetDemo = () => (
  <Sheet id="catalog-sheet" title="Side Sheet" direction="bottom">
    <div className="flex-col-gap-3">
      <p>
        This is a high-fidelity Material Design 3 side sheet. It is fully responsive and adapts its
        width on smaller screens.
      </p>
      <Divider />
      <div style={{ padding: '8px 0' }}>
        <h3 style={{ marginBottom: '12px' }}>Responsive Content</h3>
        <div className="flex-wrap-center" style={{ gap: '8px', justifyContent: 'flex-start' }}>
          <Chips label="Settings" variant="assist" />
          <Chips label="Profile" variant="assist" />
          <Chips label="Notifications" variant="assist" />
        </div>
      </div>
      <p>You can put any content here, and it will scroll if it exceeds the available space.</p>
      <div
        style={{
          height: '400px',
          background: 'var(--md-sys-color-surface-variant)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Scrollable Content Area
      </div>
    </div>
  </Sheet>
);

const SteppedSheetDemo = () => (
  <SteppedSheet id="stepped-sheet-demo" title="Registro de Usuario">
    {/* Step 1 */}
    <div className="flex-col-gap-3">
      <h3>Información Personal</h3>
      <TextField label="Nombre Completo" variant="outlined" />
      <TextField label="Correo Electrónico" variant="outlined" type="email" />
      <p>
        Por favor, ingresa tus datos básicos para comenzar el proceso de registro en nuestro
        catálogo.
      </p>
    </div>

    {/* Step 2 */}
    <div className="flex-col-gap-3">
      <h3>Preferencias</h3>
      <p>¿Qué tipo de componentes te interesan más? (Selecciona uno para continuar)</p>
      <div className="flex-col-gap-2">
        <label className="field-label">
          <Checkbox /> <span>Componentes de Acción</span>
        </label>
        <label className="field-label">
          <Checkbox /> <span>Componentes de Entrada</span>
        </label>
        <label className="field-label">
          <Checkbox /> <span>Superficies y Navegación</span>
        </label>
      </div>
    </div>

    {/* Step 3 */}
    <div className="flex-col-gap-3">
      <h3>Confirmación</h3>
      <Card variant="outlined" style={{ padding: '16px' }}>
        <p>
          Estás a punto de finalizar. Una vez que pulses &quot;Aceptar&quot;, tus preferencias se
          guardarán localmente.
        </p>
        <Divider style={{ margin: '12px 0' }} />
        <div className="flex-wrap-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
          <Icon>verified</Icon>
          <span>Todo listo para comenzar.</span>
        </div>
      </Card>
    </div>
  </SteppedSheet>
);

export const OverlayDemos = () => {
  return (
    <>
      <DialogDemo />
      <SheetDemo />
      <SteppedSheetDemo />
    </>
  );
};
