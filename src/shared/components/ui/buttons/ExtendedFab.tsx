'use client';

import React from 'react';
import type { FabProps } from './Fab';
import { Fab } from './Fab';

interface ExtendedFabProps extends FabProps {
  label: string;
  icon?: React.ReactNode;
}

export const ExtendedFab = ({ label, icon, ...props }: ExtendedFabProps) => {
  return (
    <Fab label={label} {...props}>
      {icon && <div slot="icon">{icon}</div>}
    </Fab>
  );
};
