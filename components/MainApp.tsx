import { useState } from 'react';
import { BottomNav } from './BottomNav';
import { CommunityFeed } from './CommunityFeed';
import { LocalServices } from './LocalServices';
import { ChatScreen } from './ChatScreen';
import { ProfileScreen } from './ProfileScreen';
import { LiveUpdatesScreen } from './LiveUpdatesScreen';
import { ExternalDataProvider } from '../services/ExternalDataService';
import { RealTimeDataProvider } from '../services/RealTimeDataService';
import { LocationModal } from './LocationModal';
import { useLocation } from '../services/LocationService';
import { AiAssistant } from './AiAssistant';

type Screen = 'home' | 'services' | 'chat' | 'profile' | 'live-updates';

export function MainApp() {
  const { currentLocation } = useLocation();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <CommunityFeed userLocation={currentLocation} onShowLiveUpdates={() => setCurrentScreen('live-updates')} />;
      case 'services':
        return <LocalServices userLocation={currentLocation} />;
      case 'chat':
        return <ChatScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'live-updates':
        return <LiveUpdatesScreen userLocation={currentLocation} onBack={() => setCurrentScreen('home')} />;
      default:
        return <CommunityFeed userLocation={currentLocation} onShowLiveUpdates={() => setCurrentScreen('live-updates')} />;
    }
  };

  return (
    <RealTimeDataProvider>
      <ExternalDataProvider>
        <div className="w-full max-w-md mx-auto bg-gradient-to-br from-orange-50 via-yellow-25 to-orange-25 min-h-screen flex flex-col relative overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 overflow-y-auto relative z-10">
            {renderScreen()}
          </div>

          {/* AI Assistant - hide on live updates screen */}
          {currentScreen !== 'live-updates' && <AiAssistant />}

          {/* Bottom navigation - hide on live updates screen */}
          {currentScreen !== 'live-updates' && (
            <BottomNav currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
          )}

          {/* Location modal */}
          <LocationModal />
        </div>
      </ExternalDataProvider>
    </RealTimeDataProvider>
  );
}