import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { MapPin, Loader2, CheckCircle, Search } from 'lucide-react';
import { useAuth } from './SupabaseAuthProvider';

interface PincodeData {
    PostOffice: Array<{
        Name: string;
        Block: string;
        District: string;
        State: string;
        Country: string;
    }>;
}

export function LocationSetupScreen({ onComplete }: { onComplete: () => void }) {
    const { user } = useAuth();
    const [pincode, setPincode] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [locationData, setLocationData] = useState<PincodeData | null>(null);

    const handlePincodeChange = async (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 6);
        setPincode(cleaned);
        setError('');
        setLocationData(null);

        // Auto-verify when 6 digits are entered
        if (cleaned.length === 6) {
            await verifyPincode(cleaned);
        }
    };

    const verifyPincode = async (code: string) => {
        setVerifying(true);
        setError('');

        try {
            // Use Postal Pincode API
            const response = await fetch(`https://api.postalpincode.in/pincode/${code}`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data[0].Status === 'Success') {
                const postOffice = data[0].PostOffice[0];
                const district = postOffice.District;
                const state = postOffice.State;

                // Strict Validation: Greater Chennai Region
                // We normalize to lowercase and check for common variations
                const validDistricts = [
                    'chennai',
                    'chengalpattu', 'chengalpet',
                    'kanchipuram', 'kancheepuram',
                    'tiruvallur', 'thiruvallur'
                ];

                const normalizedDistrict = district.toLowerCase();
                const isChennaiRegion = validDistricts.some(d => normalizedDistrict.includes(d));

                if (isChennaiRegion && state === 'Tamil Nadu') {
                    setLocationData(data[0]);
                } else {
                    setError('This app is currently available only for Chennai and surrounding areas.');
                    setLocationData(null);
                }
            } else {
                setError('Invalid pincode. Please enter a valid 6-digit pincode.');
                setLocationData(null);
            }
        } catch (err) {
            console.error('Pincode verification failed:', err);
            setError('Failed to verify pincode. Please check your internet connection.');
            setLocationData(null);
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!pincode || pincode.length !== 6) {
            setError('Please enter a valid 6-digit pincode');
            return;
        }

        if (!locationData) {
            setError('Please wait for pincode verification');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Get area name from postal data
            // Get area name from postal data - prioritize Name over Block for specific locality
            const rawName = locationData.PostOffice[0]?.Name || locationData.PostOffice[0]?.Block || 'Chennai';
            // Remove "(Chennai)" or "Chennai" suffix if present to be cleaner
            const area = rawName.replace(/\s*\(?Chennai\)?/i, '').trim() || rawName;
            const district = locationData.PostOffice[0]?.District || 'Chennai';

            // Update user profile with location
            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user?.id,
                    area: area,
                    pincode: pincode,
                    district: district,
                    updated_at: new Date().toISOString(),
                });

            if (updateError) throw updateError;

            // Store in localStorage for location-aware content
            localStorage.setItem('user_pincode', pincode);
            localStorage.setItem('user_area', area);
            localStorage.setItem('user_district', district);

            onComplete();
        } catch (err: any) {
            setError(err.message || 'Failed to save location');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        // Set default Chennai location
        localStorage.setItem('user_pincode', '600004');
        localStorage.setItem('user_area', 'Mylapore');
        localStorage.setItem('user_district', 'Chennai');
        onComplete();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-yellow-300/40 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
                <div className="absolute top-40 right-10 w-96 h-96 bg-orange-300/40 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-orange-500" />
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
                        Set Your Location
                    </h1>
                    <p className="text-orange-50 text-lg">
                        உங்கள் பகுதியை அமைக்கவும்
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-gradient-to-br from-white via-orange-50/30 to-white rounded-3xl shadow-2xl p-8 backdrop-blur-xl border-2 border-white/50 mb-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="pincode" className="block text-base font-bold text-gray-800 mb-3">
                                Chennai Pincode
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-2xl blur opacity-25 group-focus-within:opacity-40 transition-opacity"></div>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-orange-500 z-10" />
                                    <Input
                                        id="pincode"
                                        type="text"
                                        placeholder="600004"
                                        value={pincode}
                                        onChange={(e) => handlePincodeChange(e.target.value)}
                                        className="pl-14 pr-4 h-16 text-lg bg-white border-2 border-orange-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 rounded-2xl transition-all shadow-sm"
                                        disabled={loading}
                                        maxLength={6}
                                    />
                                    {verifying && (
                                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-orange-500 animate-spin" />
                                    )}
                                    {locationData && !verifying && (
                                        <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-green-500" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Location Preview */}
                        {locationData && (
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-green-900">
                                            {locationData.PostOffice[0]?.Name || locationData.PostOffice[0]?.Block}
                                        </p>
                                        <p className="text-xs text-green-700">
                                            {locationData.PostOffice[0]?.District}, {locationData.PostOffice[0]?.State}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 text-red-800 text-sm font-medium border-2 border-red-200">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
                            disabled={loading || !locationData || verifying}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Continue
                                </>
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                            onClick={handleSkip}
                            disabled={loading}
                        >
                            Skip for now
                        </Button>
                    </form>
                </div>

                {/* Info */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg">
                        <span className="text-2xl mb-2 block">🏘️</span>
                        <p className="text-xs font-semibold text-gray-700">Local Posts</p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg">
                        <span className="text-2xl mb-2 block">🚌</span>
                        <p className="text-xs font-semibold text-gray-700">Bus Updates</p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg">
                        <span className="text-2xl mb-2 block">🏛️</span>
                        <p className="text-xs font-semibold text-gray-700">Nearby Temples</p>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
        </div>
    );
}
