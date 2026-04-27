import React, { useState } from 'react';
import { ShieldAlert, Fingerprint } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  actionTitle: string;
  requireIdVerification?: boolean;
};

export function ActionConfirmModal({ isOpen, onClose, onVerified, actionTitle, requireIdVerification = false }: Props) {
  const [inputId, setInputId] = useState('');
  const [error, setError] = useState('');
  const { staffId } = useAuth();

  if (!isOpen) return null;

  const handleVerify = () => {
    setError('');
    
    if (requireIdVerification) {
      if (!inputId.trim()) {
        setError('Staff ID must not be empty.');
        return;
      }
      
      // In strict environments we'd send this to the backend as part of the action request.
      // For local verification, we check against the Staff's stored ID in context.
      // Allow SUPERADMIN hardcode bypass or verify physical match.
      if (inputId.toUpperCase() === staffId?.toUpperCase() || staffId === 'SUPERADMIN-OVERRIDE') {
        onVerified();
        setInputId('');
      } else {
        setError('Invalid Staff ID. Access denied.');
      }
    } else {
      onVerified();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 flex items-start gap-3 border-b border-red-100 dark:border-red-900/50">
          <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400 mt-1" />
          <div>
            <h3 className="font-bold text-red-900 dark:text-red-300 text-lg">High-Risk Action</h3>
            <p className="text-sm text-red-700 dark:text-red-400">You are attempting to: <strong>{actionTitle}</strong></p>
          </div>
        </div>
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
            {requireIdVerification 
              ? "Physical verification required. Please consult your badge and input your Staff ID below to authorize this action."
              : "Please confirm that you want to proceed with this action. This cannot be undone."}
          </p>
          {error && <div className="mb-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm p-2 rounded border border-red-200 dark:border-red-900/50">{error}</div>}
          
          {requireIdVerification && (
            <div className="mb-6 relative">
              <Fingerprint className="absolute left-3 top-3 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="e.g. HOPE-2026-001"
                className="w-full h-11 pl-10 pr-3 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition uppercase"
                value={inputId}
                onChange={(e) => setInputId(e.target.value.toUpperCase())}
              />
            </div>
          )}

          <div className="flex gap-3 justify-end mt-4">
            <button 
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleVerify}
              className="px-4 py-2 font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition"
            >
              {requireIdVerification ? "Authorize" : "Confirm Action"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
