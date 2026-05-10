import React from 'react';
import { ShieldAlert, Check, X, Users, Lock, Database } from 'lucide-react';
import { useUserRights } from '@/context/UserRightsContext';
import { Navigate } from 'react-router-dom';

export function RolePermissions() {
  const { canViewSystemConfig } = useUserRights();

  if (!canViewSystemConfig) {
    return <Navigate to="/" />;
  }

  const matrix = [
    { module: 'View Products & Dashboard', user: true, admin: true, superadmin: true },
    { module: 'View Price History', user: true, admin: true, superadmin: true },
    { module: 'Add / Edit Products', user: false, admin: true, superadmin: true },
    { module: 'Access Reports Analytics', user: false, admin: true, superadmin: true },
    { module: 'Manage Regular Users', user: false, admin: true, superadmin: true },
    { module: 'Access Vault / Archive', user: false, admin: true, superadmin: true },
    { module: 'Manage Admin Accounts', user: false, admin: false, superadmin: true },
    { module: 'Access System Config', user: false, admin: false, superadmin: true },
    { module: 'Access Global Audit Logs', user: false, admin: false, superadmin: true },
    { module: 'System Backup & Restore', user: false, admin: false, superadmin: true },
    { module: 'Configure Role RBAC', user: false, admin: false, superadmin: true },
  ];

  const renderIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <Check className="w-5 h-5 text-emerald-500 mx-auto" />
    ) : (
      <X className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto" />
    );
  };

  return (
    <div className="p-4 md:p-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-500" /> Role Permissions (RBAC)
          </h1>
          <p className="text-slate-500 dark:text-slate-400">View and manage system access level policies.</p>
        </div>
      </div>

      <div className="mb-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-lg p-4 text-sm text-rose-800 dark:text-rose-300 flex items-start gap-3">
        <Lock className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          <strong>Security Note:</strong> These permission configurations are hardcoded via PostgreSQL Row Level Security (RLS) policies to ensure absolute data privacy and integrity. This interface provides a visual reference matrix of current system configurations. Modifying core roles requires backend database migrations.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 w-1/2">Module / Capability</th>
                <th className="px-6 py-4 text-center border-l dark:border-slate-700">
                  <div className="flex flex-col items-center gap-1">
                    <Users className="w-5 h-5 text-slate-400" />
                    <span className="font-bold text-slate-700 dark:text-slate-200">USER</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center border-l dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10">
                  <div className="flex flex-col items-center gap-1">
                    <Lock className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-blue-700 dark:text-blue-400">ADMIN</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center border-l dark:border-slate-700 bg-purple-50/50 dark:bg-purple-900/10">
                  <div className="flex flex-col items-center gap-1">
                    <Database className="w-5 h-5 text-purple-500" />
                    <span className="font-bold text-purple-700 dark:text-purple-400">SUPERADMIN</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                    {row.module}
                  </td>
                  <td className="px-6 py-4 border-l dark:border-slate-700">
                    {renderIcon(row.user)}
                  </td>
                  <td className="px-6 py-4 border-l dark:border-slate-700 bg-blue-50/20 dark:bg-blue-900/5">
                    {renderIcon(row.admin)}
                  </td>
                  <td className="px-6 py-4 border-l dark:border-slate-700 bg-purple-50/20 dark:bg-purple-900/5">
                    {renderIcon(row.superadmin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
