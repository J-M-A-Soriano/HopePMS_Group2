import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Package } from 'lucide-react';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    // Supabase returns a 'fake success' for existing emails to prevent enumeration.
    // We can detect this if the identities array is empty.
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      setError('An account with this email already exists. Please use a different email or try signing in.');
      return;
    }

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        setError('An account with this email already exists. Please use a different email or try signing in.');
      } else {
        setError(error.message);
      }
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background overflow-hidden relative">
      {/* Subtle Corporate Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div className="w-full max-w-md bg-card/95 backdrop-blur-md p-8 rounded-2xl shadow-xl shadow-black/5 border border-border animate-fade-in relative z-10">
        <div className="mb-8 flex flex-col items-center justify-center space-y-3 text-center">
          <div className="rounded-xl bg-primary/10 p-3 shadow-sm ring-1 ring-primary/20">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an Account</h1>
          <p className="text-sm font-medium text-muted-foreground">Sign up to get started securely</p>
        </div>

        {error && <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-xl">{error}</div>}
        {success && <div className="mb-4 text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl font-medium">Registration successful! You can now sign in.</div>}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2 group">
            <label className="text-sm font-semibold tracking-wide text-foreground">Email</label>
            <input 
              type="email" 
              className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm placeholder:text-muted-foreground outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-primary/50" 
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 group">
            <label className="text-sm font-semibold tracking-wide text-foreground">Password</label>
            <input 
              type="password" 
              className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm placeholder:text-muted-foreground outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-primary/50" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground h-10 rounded-lg font-semibold shadow-sm hover:bg-primary/90 transition-colors duration-200">
            Sign Up
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary hover:underline transition-colors">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
