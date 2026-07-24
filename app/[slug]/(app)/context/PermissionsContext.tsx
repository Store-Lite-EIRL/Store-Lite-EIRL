'use client';

import type { Permission, Role } from '@/lib/permissions/definitions';
import { createContext, useContext, type ReactNode } from 'react';

interface PermissionsContextType {
  role: Role | null;
  permissions: Permission[];
  isOwner: boolean;
  can: (permission: Permission) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({
  children,
  role,
  permissions,
  isOwner,
}: {
  children: ReactNode;
  role: Role | null;
  permissions: Permission[];
  isOwner: boolean;
}) {
  const can = (permission: Permission) => {
    // El dueño siempre tiene permisos totales
    if (isOwner) return true;
    return permissions.includes(permission);
  };

  return (
    <PermissionsContext.Provider value={{ role, permissions, isOwner, can }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
