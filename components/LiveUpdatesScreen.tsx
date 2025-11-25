import { ArrowLeft, Zap, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { WeatherPanel } from './LiveData/WeatherPanel';
import { TrafficStatusPanel } from './LiveData/TrafficStatusPanel';
import { LiveAlertsPanel } from './LiveData/LiveAlertsPanel';

interface LiveUpdatesScreenProps {
    userLocation?: any;
    onBack: () => void;
}

export function LiveUpdatesScreen({ userLocation, onBack }: LiveUpdatesScreenProps) {
    const locationName = userLocation?.area || userLocation?.pincode || 'Chennai';

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-25 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4 shadow-md">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="text-white hover:bg-orange-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Zap className="w-6 h-6" />
                            <h1 className="text-xl font-bold">Live Updates</h1>
                        </div>
                        <div className="flex items-center gap-1 text-orange-100 text-sm mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{locationName}</span>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6 max-w-2xl mx-auto">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-1">Real-Time Data</h3>
                            <p className="text-sm text-blue-700">
                                All information is fetched live from the web using AI. Data updates every 15 minutes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Weather Section */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <WeatherPanel userLocation={userLocation} />
                </div>

                {/* Traffic Section */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <TrafficStatusPanel userLocation={userLocation} />
                </div>

                {/* Alerts Section */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <LiveAlertsPanel userLocation={userLocation} />
                </div>

                {/* Footer Info */}
                <div className="text-center text-sm text-gray-500 py-4">
                    <p>Data powered by AI web search</p>
                    <p className="text-xs mt-1">Updates cached for 15 minutes</p>
                </div>
            </div>
        </div>
    );
}
