import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

type UserRights = {
  canEditProduct: boolean;
  canDeleteProduct: boolean;
  canViewReports: boolean;
  canViewAdminPanel: boolean;
  canSuspendAdmin: boolean;
  canHardDelete: boolean;
  canViewSystemConfig: boolean;
  canViewAdminLogs: boolean;
  canChangeRoles: boolean;
};

const defaultRights: UserRights = {
  canEditProduct: false,
  canDeleteProduct: false,
  canViewReports: false,
  canViewAdminPanel: false,
  canSuspendAdmin: false,
  canHardDelete: false,
  canViewSystemConfig: false,
  canViewAdminLogs: false,
  canChangeRoles: false,
};

const UserRightsContext = createContext<UserRights>(defaultRights);

export const UserRightsProvider = ({ children }: { children: React.ReactNode }) => {
  const { userRole } = useAuth();

  const rights = useMemo(() => {
    // We assume roles might be 'SUPERADMIN', 'ADMIN', 'MANAGER', 'USER'
    const role = userRole?.toUpperCase() || 'USER';

    return {
      canEditProduct: role === 'ADMIN' || role === 'SUPERADMIN' || role === 'MANAGER',
      canDeleteProduct: role === 'ADMIN' || role === 'SUPERADMIN' || role === 'MANAGER',
      canViewReports: role === 'ADMIN' || role === 'SUPERADMIN' || role === 'MANAGER',
      canViewAdminPanel: role === 'ADMIN' || role === 'SUPERADMIN',
      canSuspendAdmin: role === 'SUPERADMIN',
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
