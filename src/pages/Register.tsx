import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Package } from 'lucide-react';

export function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
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

    // Basic validation
    if (!firstName.trim()) { setError('First name is required.'); return; }
    if (!lastName.trim()) { setError('Last name is required.'); return; }
    if (!username.trim()) { setError('Username is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
        }
      }
    });

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

  const handleGoogleRegister = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background overflow-hidden relative py-8">
      {/* Subtle Corporate Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div className="w-full max-w-md bg-card/95 backdrop-blur-md p-8 rounded-2xl shadow-xl shadow-black/5 border border-border animate-fade-in relative z-10 mx-4">
        <div className="mb-8 flex flex-col items-center justify-center space-y-3 text-center">
          <div className="rounded-xl bg-primary/10 p-3 shadow-sm ring-1 ring-primary/20">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an Account</h1>
          <p className="text-sm font-medium text-muted-foreground">Sign up to get started securely</p>
        </div>

        {error && <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-xl">{error}</div>}
        {success && <div className="mb-4 text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl font-medium">Registration successful! You can now sign in.</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* First Name + Last Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-foreground">First Name</label>
              <input
                type="text"
                className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm placeholder:text-muted-foreground outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-primary/50"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-foreground">Last Name</label>
              <input
                type="text"
                className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm placeholder:text-muted-foreground outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-primary/50"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold tracking-wide text-foreground">Username</label>
            <input
              type="text"
              className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm placeholder:text-muted-foreground outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-primary/50"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold tracking-wide text-foreground">Email</label>
            <input
              type="email"
              className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm placeholder:text-muted-foreground outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-primary/50"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold tracking-wide text-foreground">Password</label>
            <input
              type="password"
              className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm placeholder:text-muted-foreground outline-none transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary hover:border-primary/50"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
          </div>

          <button type="submit" className="w-full bg-primary text-primary-foreground h-10 rounded-lg font-semibold shadow-sm hover:bg-primary/90 transition-colors duration-200">
            Create Account
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider"><span className="bg-background px-3 text-muted-foreground rounded-full border border-border">Or register with</span></div>
        </div>

        <button
          onClick={handleGoogleRegister}
          className="w-full border border-input shadow-sm bg-card text-foreground h-10 rounded-lg font-medium hover:bg-muted transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
          Register with Google
        </button>

        <p className="mt-6 text-center text-sm font-medium text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary hover:underline transition-colors">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
