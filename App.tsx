import { MainApp } from './components/MainApp';
import { AuthScreen } from './components/auth/AuthScreen';
import { LocationSetupScreen } from './components/auth/LocationSetupScreen';
import { SupabaseAuthProvider, useAuth } from './components/auth/SupabaseAuthProvider';
import { LocationProvider } from './services/LocationService';
import { LanguageProvider } from './services/LanguageService';
import ErrorBoundary from './components/ErrorBoundary';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthCallback } from './pages/AuthCallback';

function Home() {
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

  return <MainApp />;
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
                  <Routes>
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/" element={<Home />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </div>
            </BrowserRouter>
          </LocationProvider>
        </LanguageProvider>
      </SupabaseAuthProvider>
    </ErrorBoundary>
  );
}