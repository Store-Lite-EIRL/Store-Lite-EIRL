'use client';

import { Icon } from '@/shared/components/ui/data-display';
import { useState } from 'react';
import AppSettingsModal from './AppSettingsModal';

export default function AppSettingsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <md-icon-button
        onClick={() => setIsOpen(true)}
        suppressHydrationWarning
        title="Ajustes de la aplicación"
      >
        <Icon size={24}>settings</Icon>
      </md-icon-button>

      <AppSettingsModal open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
