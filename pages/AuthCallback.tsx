import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AuthCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Handle the OAuth callback
        const handleCallback = async () => {
            // 1. Check if we already have a session (fast path)
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate('/', { replace: true });
                return;
            }

            // 2. Listen for the SIGNED_IN event (robust path)
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    navigate('/', { replace: true });
                }
            });

            // 3. Fallback timeout
            setTimeout(() => {
                // Don't auto-redirect on timeout, just show button/error
                // This prevents infinite loops if login actually failed
                setError('Taking longer than expected...');
            }, 5000);

            return () => {
                subscription.unsubscribe();
            };
        };

        handleCallback();
    }, [navigate]);

    const handleManualRedirect = () => {
        navigate('/', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 flex flex-col items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm w-full">
                <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Signing you in...</h2>
                <p className="text-gray-600 mb-6">Please wait a moment while we verify your credentials.</p>

                {error && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-orange-600 mb-4 font-medium">{error}</p>
                        <button
                            onClick={handleManualRedirect}
                            className="bg-orange-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg"
                        >
                            Click to Continue
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
