import { MainApp } from './components/MainApp';
import { AuthScreen } from './components/auth/AuthScreen';
import { LocationSetupScreen } from './components/auth/LocationSetupScreen';
import { SupabaseAuthProvider, useAuth } from './components/auth/SupabaseAuthProvider';
import { LocationProvider } from './services/LocationService';
import { LanguageProvider } from './services/LanguageService';
import ErrorBoundary from './components/ErrorBoundary';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CommunityFeed } from './components/CommunityFeed';
import { LocalServices } from './components/LocalServices';
import { ChatScreen } from './components/ChatScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { LiveUpdatesScreen } from './components/LiveUpdatesScreen';
import { useLocation as useLocationService } from './services/LocationService';

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const [locationSetup, setLocationSetup] = useState(false);

  // Check if user has already set up location
  useEffect(() => {
    if (user) {
      const hasLocation = localStorage.getItem('user_pincode');
      setLocationSetup(!!hasLocation);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-25 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-600 font-medium">Loading Chennai Community...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!locationSetup) {
    return <LocationSetupScreen onComplete={() => setLocationSetup(true)} />;
  }

  // User is authenticated and location is set up - render nested routes
  return (
    <Routes>
      {/* Main app layout with nested routes */}
      <Route path="/" element={<MainApp />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<CommunityFeedWrapper />} />
        <Route path="services" element={<LocalServicesWrapper />} />
        <Route path="chat" element={<ChatScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
        <Route path="live" element={<LiveUpdatesScreenWrapper />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}

// Wrapper components to pass location context
function CommunityFeedWrapper() {
  const { currentLocation } = useLocationService();
  return <CommunityFeed userLocation={currentLocation} />;
}

function LocalServicesWrapper() {
  const { currentLocation } = useLocationService();
  return <LocalServices userLocation={currentLocation} />;
}

function LiveUpdatesScreenWrapper() {
  const { currentLocation } = useLocationService();
  return <LiveUpdatesScreen userLocation={currentLocation} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <SupabaseAuthProvider>
        <LanguageProvider>
          <LocationProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-25 relative overflow-hidden">
                <div className="relative z-10">
                  <ProtectedRoutes />
                </div>
              </div>
            </BrowserRouter>
          </LocationProvider>
        </LanguageProvider>
      </SupabaseAuthProvider>
    </ErrorBoundary>
  );
}