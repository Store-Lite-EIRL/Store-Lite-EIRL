'use client';

import type { Permission } from '@/lib/permissions/definitions';
import { PERMISSION_GROUPS, PERMISSION_LABELS } from '@/lib/permissions/definitions';
import { Switch } from '@/shared/components/ui';
import styles from './PermissionsMatrix.module.css';

interface PermissionsMatrixProps {
  role: 'admin' | 'member';
  permissions: Permission[];
  onChange?: (permission: Permission, enabled: boolean) => void;
  readOnly?: boolean;
}

export function PermissionsMatrix({
  role,
  permissions,
  onChange,
  readOnly = false,
}: PermissionsMatrixProps) {
  // Filter out owner-only permissions
  const availableGroups = Object.entries(PERMISSION_GROUPS).filter(
    ([key]) =>
      key !== 'business' &&
      key !== 'team' &&
      key !== 'plan' &&
      key !== 'contact' &&
      key !== 'legal',
  );

  const handleToggle = (permission: Permission, enabled: boolean) => {
    if (onChange) {
      onChange(permission, enabled);
    }
  };

  return (
    <div className={styles.container}>
      {availableGroups.map(([groupKey, group]) => (
        <div key={groupKey} className={styles.group}>
          <div className={styles.groupHeader}>
            <span className="material-symbols-outlined">{group.icon}</span>
            <span className={styles.groupLabel}>{group.label}</span>
          </div>

          <div className={styles.permissionsList}>
            {group.permissions.map((permission) => {
              const isEnabled = permissions.includes(permission);
              const meta = PERMISSION_LABELS[permission];

              return (
                <div key={permission} className={styles.permissionItem}>
                  <div className={styles.permissionInfo}>
                    <span className={styles.permissionLabel}>{meta.label}</span>
                    <span className={styles.permissionDescription}>{meta.description}</span>
                  </div>
                  <Switch
                    selected={isEnabled}
                    onClick={() => !readOnly && handleToggle(permission, !isEnabled)}
                    disabled={readOnly}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
