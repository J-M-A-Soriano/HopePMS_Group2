import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, Shield, Clock, Activity, Settings, Key, Bell, CreditCard, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Profile() {
  const { user, staffId } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const showFeedback = (message: string, type: 'error' | 'success' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showFeedback("Passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showFeedback("Password must be at least 6 characters.", "error");
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showFeedback("Password updated successfully.", "success");
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      showFeedback(e.message || "Failed to update password.", "error");
    }
  };

  const handleAvatarUpdate = async () => {
    if (!user) return;
    try {
      setIsSavingAvatar(true);
      const { error } = await supabase.from('user').update({ avatar_url: avatarUrl }).eq('userid', user.id);
      if (error) throw error;
      setProfileData({ ...profileData, avatar_url: avatarUrl });
      showFeedback("Profile picture updated.", "success");
    } catch (e: any) {
      showFeedback(e.message || "Failed to update profile picture.", "error");
    } finally {
      setIsSavingAvatar(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Fetch User Data
        const { data: userData } = await supabase.from('user').select('*').eq('userid', user.id).single();
        if (userData) {
          setProfileData(userData);
          setAvatarUrl(userData.avatar_url || '');
        }

        // Fetch Last Login / Last Activity
        const { data: logs } = await supabase
          .from('audit_logs')
          .select('created_at, action_type')
          .eq('performed_by', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (logs && logs.length > 0) {
          setLastLogin(new Date(logs[0].created_at).toLocaleString());
        } else {
          setLastLogin('First time login or no recent activity recorded.');
        }
      } catch (e) {
        console.error('Error fetching profile:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading profile data...</div>;
  }

  if (!profileData) {
    return <div className="p-8 text-center text-red-500">Error loading profile data.</div>;
  }

  return (
    <div className="p-4 md:p-8 pb-16 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <User className="w-8 h-8 text-indigo-500" /> Account Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your profile, security, and preferences.</p>
        </div>
      </div>

      {feedback && (
         <div className={`mb-6 p-4 rounded-md text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${feedback.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
            {feedback.type === 'error' ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle className="h-5 w-5 shrink-0" />}
            {feedback.message}
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Profile Card */}
         <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4 border-4 border-white dark:border-slate-700 shadow-sm overflow-hidden">
               {profileData.avatar_url ? (
                 <img src={profileData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                    {profileData.username.charAt(0)}
                 </span>
               )}
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white truncate max-w-full px-2" title={profileData.username}>
               {profileData.username}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4 truncate max-w-full px-2" title={user?.email}>
               {user?.email}
            </p>
            
            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
               {profileData.user_type || 'USER'}
            </span>

            <div className="w-full border-t dark:border-slate-700 pt-4 mt-auto">
               <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-500 dark:text-slate-400">Account Status</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> {profileData.record_status || 'ACTIVE'}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Staff ID</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">{staffId || 'N/A'}</span>
               </div>
            </div>
         </div>

         {/* Settings Form */}
         <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl p-6 shadow-sm">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b dark:border-slate-700 pb-3 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-slate-400" /> Security & Activity
               </h3>
               
               <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border dark:border-slate-700 flex items-start gap-4">
                     <Clock className="w-5 h-5 text-indigo-500 mt-0.5" />
                     <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">Last Activity Detected</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{lastLogin}</p>
                     </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border dark:border-slate-700 flex items-start gap-4">
                     <Shield className="w-5 h-5 text-emerald-500 mt-0.5" />
                     <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">Account Created</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{new Date(profileData.created_at).toLocaleString()}</p>
                     </div>
                  </div>
               </div>

               <div className="mt-6 pt-6 border-t dark:border-slate-700">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Profile Customization</h4>
                  <div className="flex gap-2 mb-6">
                     <input 
                       type="text" 
                       placeholder="Paste an Image URL for your Avatar..." 
                       value={avatarUrl}
                       onChange={(e) => setAvatarUrl(e.target.value)}
                       className="flex-1 border dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                     />
                     <button 
                       onClick={handleAvatarUpdate} 
                       disabled={isSavingAvatar}
                       className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                     >
                       {isSavingAvatar ? 'Saving...' : 'Save Avatar'}
                     </button>
                  </div>
               </div>

               <div className="mt-6 pt-6 border-t dark:border-slate-700">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <button onClick={() => setShowPasswordModal(true)} className="flex items-center justify-center gap-2 px-4 py-2 border dark:border-slate-600 rounded text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                        <Key className="w-4 h-4" /> Change Password
                     </button>
                     <button onClick={() => showFeedback('Notification preferences module is currently under development.', 'success')} className="flex items-center justify-center gap-2 px-4 py-2 border dark:border-slate-600 rounded text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                        <Bell className="w-4 h-4" /> Notification Preferences
                     </button>
                     <button onClick={() => navigate('/settings')} className="flex items-center justify-center gap-2 px-4 py-2 border dark:border-slate-600 rounded text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                        <Settings className="w-4 h-4" /> General Settings
                     </button>
                     <button onClick={() => showFeedback('Billing is managed via your Enterprise Support representative.', 'error')} className="flex items-center justify-center gap-2 px-4 py-2 border dark:border-slate-600 rounded text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                        <CreditCard className="w-4 h-4" /> Billing & Subscription
                     </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-4 text-center">Note: Some actions may require administrator approval or redirect to an external portal.</p>
               </div>
            </div>
         </div>
      </div>
      
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-4 border-b dark:border-slate-700">
                 <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <Key className="w-5 h-5 text-indigo-500" /> Update Password
                 </h2>
                 <button type="button" onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handlePasswordUpdate} className="p-5 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <input 
                      required 
                      type="password" 
                      className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                    <input 
                      required 
                      type="password" 
                      className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                 </div>
                 <div className="pt-2 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 border dark:border-slate-600 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">Update Security</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
