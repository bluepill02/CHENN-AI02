
import { AuthScreen } from './components/auth/AuthScreen';
import { LocationSetupScreen } from './components/auth/LocationSetupScreen';
import { SupabaseAuthProvider, useAuth } from './components/auth/SupabaseAuthProvider';
import { LocationProvider } from './services/LocationService';
import { LanguageProvider } from './services/LanguageService';
import ErrorBoundary from './components/ErrorBoundary';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainApp } from './components/MainApp';

function AppContent() {
  const { session, isReady, profile } = useAuth();
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false);

  useEffect(() => {
    if (isReady && profile) {
      // Assuming 'area' is a required field in the profile
      const hasLocation = !!profile.area;
      const hasLanguage = !!profile.preferred_language;

      if (hasLocation && hasLanguage) {
        setHasCompletedSetup(true);
      } else {
        setHasCompletedSetup(false);
      }
    }
  }, [isReady, profile, session]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (!hasCompletedSetup) {
    return <LocationSetupScreen />;
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
                      <Route path="/" element={<AppContent />} />
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
