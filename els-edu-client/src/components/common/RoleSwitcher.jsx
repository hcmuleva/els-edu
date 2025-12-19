import React, { useState } from 'react';
import { useAvailableRoles, useActiveRole, useRoleContext } from '../../contexts/RoleContext';
import { useNotify } from 'react-admin';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export const RoleSwitcher = ({ isOpen, onClose }) => {
  const availableRoles = useAvailableRoles();
  const activeRole = useActiveRole();
  const { switchActiveRole } = useRoleContext();
  const notify = useNotify();
  const [switching, setSwitching] = useState(false);

  if (!availableRoles || availableRoles.length <= 1) {
    return null; // Don't show switcher if user has only one role
  }

  const handleRoleSwitch = async (roleId) => {
    if (switching || activeRole?.id === roleId || activeRole?.documentId === roleId) {
      return;
    }

    setSwitching(true);
    try {
      await switchActiveRole(roleId);
      notify('Role switched successfully', { type: 'success' });
      onClose?.();
    } catch (error) {
      notify(error.message || 'Failed to switch role', { type: 'error' });
    } finally {
      setSwitching(false);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      STUDENT: 'Student',
      TEACHER: 'Teacher',
      ADMIN: 'Admin',
      SUPERADMIN: 'Super Admin',
      EDITOR: 'Editor',
      REVIEWER: 'Reviewer',
      PARENT: 'Parent',
      MARKETING: 'Marketing',
    };
    return labels[role] || role;
  };

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-lg border border-border/50 py-2 min-w-[200px]",
      !isOpen && "hidden"
    )}>
      <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60 border-b border-border/30">
        Switch Role
      </div>
      <div className="py-1">
        {availableRoles
          .filter(role => role.isActive) // Only show active roles
          .map((role) => {
            const isActive = activeRole?.id === role.id || activeRole?.documentId === role.documentId;
            return (
              <button
                key={role.id || role.documentId}
                onClick={() => handleRoleSwitch(role.id || role.documentId)}
                disabled={switching || isActive}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors",
                  isActive
                    ? "bg-primary/5 text-primary font-medium cursor-default"
                    : "text-gray-700 hover:bg-gray-50 cursor-pointer",
                  switching && "opacity-50 cursor-not-allowed"
                )}
              >
                <span>{getRoleLabel(role.role)}</span>
                {isActive && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}
      </div>
    </div>
  );
};


