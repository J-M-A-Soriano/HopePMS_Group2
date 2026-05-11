import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

type UserRights = {
  isSuperadmin: boolean;
  canViewAdminPanel: boolean;
  canManageProducts: boolean;
  canManageInventory: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canManageSuperadmins: boolean;
  canApproveRequests: boolean;
  canViewVault: boolean;
  canSoftDelete: boolean;
  canHardDelete: boolean;
  canViewSystemConfig: boolean;
  canViewAdminLogs: boolean;
  canChangeRoles: boolean;
};

const defaultRights: UserRights = {
  isSuperadmin: false,
  canViewAdminPanel: false,
  canManageProducts: false,
  canManageInventory: false,
  canViewReports: false,
  canManageUsers: false,
  canManageSuperadmins: false,
  canApproveRequests: false,
  canViewVault: false,
  canSoftDelete: false,
  canHardDelete: false,
  canViewSystemConfig: false,
  canViewAdminLogs: false,
  canChangeRoles: false,
};

const UserRightsContext = createContext<UserRights>(defaultRights);

export const UserRightsProvider = ({ children }: { children: React.ReactNode }) => {
  const { userRole } = useAuth();

  const rights = useMemo(() => {
    const role = userRole?.toUpperCase() || 'USER';

    return {
      isSuperadmin: role === 'SUPERADMIN',
      canViewAdminPanel: role === 'ADMIN' || role === 'SUPERADMIN',
      canManageProducts: role === 'ADMIN' || role === 'SUPERADMIN',
      canManageInventory: role === 'ADMIN' || role === 'SUPERADMIN',
      canViewReports: role === 'ADMIN' || role === 'SUPERADMIN',
      canManageUsers: role === 'ADMIN' || role === 'SUPERADMIN',
      canManageSuperadmins: role === 'SUPERADMIN',
      canApproveRequests: role === 'ADMIN' || role === 'SUPERADMIN',
      canViewVault: role === 'ADMIN' || role === 'SUPERADMIN',
      canSoftDelete: role === 'ADMIN' || role === 'SUPERADMIN',
      canHardDelete: role === 'SUPERADMIN',
      canViewSystemConfig: role === 'SUPERADMIN',
      canViewAdminLogs: role === 'SUPERADMIN',
      canChangeRoles: role === 'SUPERADMIN',
    };
  }, [userRole]);

  return (
    <UserRightsContext.Provider value={rights}>
      {children}
    </UserRightsContext.Provider>
  );
};

export const useUserRights = () => useContext(UserRightsContext);
