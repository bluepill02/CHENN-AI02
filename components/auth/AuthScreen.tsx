import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Mail, Loader2, Sparkles, MapPin, Users, Zap, Lock, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'signin' | 'signup' | 'magic';

export function AuthScreen() {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleEmailPasswordAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setMessage({ type: 'error', text: 'Please enter both email and password' });
            return;
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            if (mode === 'signup') {
                // Use configured site URL or current origin
                const redirectTo = import.meta.env.VITE_SITE_URL || window.location.origin;

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: redirectTo,
                    },
                });

                if (error) throw error;

                setMessage({
                    type: 'success',
                    text: 'Account created! Check your email to verify. 📧',
                });
                setEmail('');
                setPassword('');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                // Success - user will be redirected by SupabaseAuthProvider
            }
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || `Failed to ${mode === 'signup' ? 'create account' : 'sign in'}`,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setMessage(null);

        try {
            // Redirect to root path - Supabase will handle the OAuth flow
            const redirectTo = import.meta.env.VITE_SITE_URL || window.location.origin;

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectTo,
                },
            });

            if (error) throw error;
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Failed to sign in with Google',
            });
            setLoading(false);
        }
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setMessage({ type: 'error', text: 'Please enter your email' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const redirectTo = import.meta.env.VITE_SITE_URL || window.location.origin;

            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: redirectTo,
                },
            });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Check your email for the magic link! 📧',
            });
            setEmail('');
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Failed to send magic link',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-yellow-300/40 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
                <div className="absolute top-40 right-10 w-96 h-96 bg-orange-300/40 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-red-300/40 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            {/* Main content */}
            <div className="w-full max-w-md relative z-10">
                {/* Logo section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-3xl shadow-2xl mb-6 transform hover:scale-105 transition-transform">
                        <span className="text-7xl">🏛️</span>
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
                        Chennai Community
                    </h1>
                    <p className="text-orange-50 text-xl font-medium">
                        வணக்கம்! Welcome home
                    </p>
                </div>

                {/* Auth card */}
                <div className="bg-gradient-to-br from-white via-orange-50/30 to-white rounded-3xl shadow-2xl p-10 backdrop-blur-xl border-2 border-white/50 mb-6">
                    {/* Mode Toggle - Only for email/password */}
                    {mode !== 'magic' && (
                        <div className="flex gap-2 mb-6 p-1 bg-orange-100 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setMode('signin')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${mode === 'signin'
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('signup')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${mode === 'signup'
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Sign Up
                            </button>
                        </div>
                    )}

                    {mode === 'magic' ? (
                        /* Magic Link Form */
                        <form onSubmit={handleMagicLink} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-base font-bold text-gray-800 mb-3">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-orange-500 z-10" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your.email@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-14 pr-4 h-16 text-lg bg-white border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-2xl transition-all shadow-sm"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 hover:from-orange-600 hover:via-red-500 hover:to-red-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                        Sending Magic Link...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-6 h-6 mr-3" />
                                        Send Magic Link
                                    </>
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setMode('signin')}
                                className="w-full text-center text-sm text-orange-600 hover:text-orange-700 font-semibold"
                            >
                                ← Back to sign in
                            </button>
                        </form>
                    ) : (
                        /* Email/Password Form */
                        <>
                            <form onSubmit={handleEmailPasswordAuth} className="space-y-5">
                                {/* Email Input */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your.email@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-12 pr-4 h-14 bg-white border-2 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl transition-all"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-12 pr-12 h-14 bg-white border-2 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 rounded-xl transition-all"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                    {mode === 'signup' && (
                                        <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            {mode === 'signup' ? 'Creating Account...' : 'Signing In...'}
                                        </>
                                    ) : (
                                        <>{mode === 'signup' ? 'Create Account' : 'Sign In'}</>
                                    )}
                                </Button>
                            </form>

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                <span className="text-sm text-gray-500 font-semibold">or</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                            </div>

                            {/* Google Sign In */}
                            <Button
                                type="button"
                                onClick={handleGoogleSignIn}
                                className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-3 transition-all"
                                disabled={loading}
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </Button>

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                <span className="text-sm text-gray-500 font-semibold">or</span>
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                            </div>

                            {/* Magic Link Option */}
                            <button
                                type="button"
                                onClick={() => setMode('magic')}
                                className="w-full h-12 bg-orange-50 hover:bg-orange-100 text-orange-700 border-2 border-orange-200 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                Use Magic Link Instead
                            </button>
                        </>
                    )}

                    {/* Message */}
                    {message && (
                        <div
                            className={`mt-6 p-4 rounded-xl text-sm font-semibold ${message.type === 'success'
                                ? 'bg-green-50 text-green-800 border-2 border-green-300'
                                : 'bg-red-50 text-red-800 border-2 border-red-300'
                                }`}
                        >
                            {message.text}
                        </div>
                    )}
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                            <Users className="w-7 h-7 text-white" />
                        </div>
                        <p className="text-sm font-bold text-gray-800">Connect</p>
                        <p className="text-xs text-gray-600 mt-1">Neighbors</p>
                    </div>

                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                            <MapPin className="w-7 h-7 text-white" />
                        </div>
                        <p className="text-sm font-bold text-gray-800">Local</p>
                        <p className="text-xs text-gray-600 mt-1">Updates</p>
                    </div>

                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                            <Zap className="w-7 h-7 text-white" />
                        </div>
                        <p className="text-sm font-bold text-gray-800">Real-time</p>
                        <p className="text-xs text-gray-600 mt-1">Info</p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-white/90 text-sm font-medium drop-shadow">
                    Powered by Groq AI • Made for Chennai
                </p>
            </div>

            <style>{`
        @keyframes blob {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
          }
          33% { 
            transform: translate(30px, -50px) scale(1.1); 
          }
          66% { 
            transform: translate(-20px, 20px) scale(0.9); 
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
        </div>
    );
}
