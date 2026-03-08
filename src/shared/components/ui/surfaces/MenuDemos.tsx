'use client';

import { useRef } from 'react';
import { IconButton } from '../buttons';
import { Icon } from '../data-display';
import './MenuDemos.css';

interface MenuElement extends HTMLElement {
  anchorElement?: HTMLElement;
  open?: boolean;
}

type SwitchElement = HTMLElement & { selected?: boolean };

const toggleMenu = (menu: MenuElement | null, anchorElement: HTMLElement) => {
  if (!menu) return;
  menu.anchorElement = anchorElement;
  menu.open = !menu.open;
};

const closeMenu = (menu: MenuElement | null) => {
  if (menu) menu.open = false;
};

// Simple Menu Component
export const SimpleMenuDemo = () => {
  const menuRef = useRef<MenuElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    toggleMenu(menuRef.current, event.currentTarget);
  };

  const handleMenuItemClick = () => {
    closeMenu(menuRef.current);
  };

  return (
    <div className="menu-demo-container">
      <IconButton onClick={handleClick} id="simple-menu-trigger">
        <Icon>more_vert</Icon>
      </IconButton>

      <md-menu
        ref={(node: HTMLElement | null) => {
          menuRef.current = node as MenuElement | null;
        }}
        id="simple-menu-demo"
        anchor="simple-menu-trigger"
        anchor-corner="end-start"
        menu-corner="start-start"
        positioning="popover"
      >
        <md-menu-item onClick={handleMenuItemClick}>
          <div slot="headline">Revert</div>
          <Icon slot="end">undo</Icon>
        </md-menu-item>

        <md-menu-item onClick={handleMenuItemClick}>
          <div slot="headline">Delete</div>
          <Icon slot="end">delete</Icon>
        </md-menu-item>

        <md-menu-item onClick={handleMenuItemClick}>
          <div slot="headline">Settings</div>
          <Icon slot="end">settings</Icon>
        </md-menu-item>

        <md-menu-item onClick={handleMenuItemClick}>
          <div slot="headline">Help & feedback</div>
          <Icon slot="end">help</Icon>
        </md-menu-item>
      </md-menu>
    </div>
  );
};

// Helper functions for submenu rendering
const renderCreateSubmenu = (handleMenuItemClick: (event?: React.MouseEvent) => void) => (
  <md-sub-menu>
    <md-menu-item slot="item">
      <Icon slot="start">add</Icon>
      <div slot="headline">Create</div>
      <Icon slot="end">chevron_right</Icon>
    </md-menu-item>
    <md-menu slot="menu" positioning="popover" anchor-corner="start-end" menu-corner="start-start">
      <md-menu-item onClick={handleMenuItemClick}>
        <Icon slot="start">description</Icon>
        <div slot="headline">Document</div>
      </md-menu-item>
      <md-menu-item onClick={handleMenuItemClick}>
        <Icon slot="start">image</Icon>
        <div slot="headline">Image</div>
      </md-menu-item>
      <md-menu-item onClick={handleMenuItemClick}>
        <Icon slot="start">slideshow</Icon>
        <div slot="headline">Slides</div>
      </md-menu-item>
    </md-menu>
  </md-sub-menu>
);

const renderShareSubmenu = (handleMenuItemClick: (event?: React.MouseEvent) => void) => (
  <md-sub-menu>
    <md-menu-item slot="item">
      <Icon slot="start">share</Icon>
      <div slot="headline">Share</div>
      <Icon slot="end">chevron_right</Icon>
    </md-menu-item>
    <md-menu slot="menu" positioning="popover" anchor-corner="start-end" menu-corner="start-start">
      <md-menu-item onClick={handleMenuItemClick}>
        <Icon slot="start">email</Icon>
        <div slot="headline">Email</div>
      </md-menu-item>
      <md-menu-item onClick={handleMenuItemClick}>
        <Icon slot="start">link</Icon>
        <div slot="headline">Copy link</div>
      </md-menu-item>
    </md-menu>
  </md-sub-menu>
);

const renderDownloadSubmenu = (handleMenuItemClick: (event?: React.MouseEvent) => void) => (
  <md-sub-menu>
    <md-menu-item slot="item">
      <Icon slot="start">download</Icon>
      <div slot="headline">Download</div>
      <Icon slot="end">chevron_right</Icon>
    </md-menu-item>
    <md-menu slot="menu" positioning="popover" anchor-corner="start-end" menu-corner="start-start">
      <md-menu-item onClick={handleMenuItemClick}>
        <Icon slot="start">picture_as_pdf</Icon>
        <div slot="headline">PDF</div>
      </md-menu-item>
      <md-menu-item onClick={handleMenuItemClick}>
        <Icon slot="start">article</Icon>
        <div slot="headline">Word</div>
      </md-menu-item>
    </md-menu>
  </md-sub-menu>
);

// Complex Submenu Component
export const ComplexSubmenuDemo = () => {
  const menuRef = useRef<MenuElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    toggleMenu(menuRef.current, event.currentTarget);
  };

  const handleMenuItemClick = (event?: React.MouseEvent) => {
    // Prevent menu closing if clicking on switch or its container
    if (event?.target instanceof Element) {
      const target = event.target;
      const switchElement = target.closest('md-switch');
      const switchContainer = target.closest('md-menu-item:has(md-switch)');

      if (switchElement || switchContainer) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }

    closeMenu(menuRef.current);
  };

  const handleSwitchClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    // Toggle the nearest switch manually to keep menu open while updating state.
    const switchElement = (event.target as Element).closest('md-switch') as SwitchElement | null;
    if (switchElement && typeof switchElement.selected === 'boolean') {
      switchElement.selected = !switchElement.selected;
    }
    return false;
  };

  return (
    <div className="menu-demo-container">
      <IconButton onClick={handleClick} id="complex-menu-trigger">
        <Icon>more_vert</Icon>
      </IconButton>

      <md-menu
        ref={(node: HTMLElement | null) => {
          menuRef.current = node as MenuElement | null;
        }}
        id="complex-menu-demo"
        anchor="complex-menu-trigger"
        anchor-corner="end-start"
        menu-corner="start-start"
        positioning="popover"
        has-overflow
      >
        <md-menu-item onClick={handleMenuItemClick}>
          <Icon slot="start">folder_open</Icon>
          <div slot="headline">Open</div>
        </md-menu-item>

        <md-menu-item onClick={handleMenuItemClick}>
          <Icon slot="start">content_copy</Icon>
          <div slot="headline">Make a copy</div>
        </md-menu-item>

        {renderCreateSubmenu(handleMenuItemClick)}

        <md-menu-item>
          <Icon slot="start">offline_pin</Icon>
          <div slot="headline">Offline mode</div>
          <md-switch
            slot="end"
            selected
            onClick={handleSwitchClick}
            onMouseDown={handleSwitchClick}
          />
        </md-menu-item>

        {renderShareSubmenu(handleMenuItemClick)}
        {renderDownloadSubmenu(handleMenuItemClick)}
      </md-menu>
    </div>
  );
};
