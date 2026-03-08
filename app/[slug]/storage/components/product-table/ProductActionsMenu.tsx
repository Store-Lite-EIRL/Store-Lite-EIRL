import { Icon } from '@/shared/components/ui';
import type { RefObject } from 'react';

interface ProductActionsMenuProps {
  id: string;
  menuRef?: RefObject<HTMLElement | null>;
  onView: () => void;
  onShare: () => void;
}

export const ProductActionsMenu = ({ id, menuRef, onView, onShare }: ProductActionsMenuProps) => {
  return (
    <md-menu
      ref={menuRef}
      id={id}
      anchor-corner="end-start"
      menu-corner="start-start"
      positioning="popover"
    >
      <md-menu-item onClick={onView}>
        <div slot="headline">Ir al detalle</div>
        <Icon slot="end">visibility</Icon>
      </md-menu-item>
      <md-menu-item onClick={onShare}>
        <div slot="headline">Compartir</div>
        <Icon slot="end">share</Icon>
      </md-menu-item>
    </md-menu>
  );
};
