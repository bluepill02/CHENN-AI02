import { useState, useRef } from 'react';
import { BottomNav } from './BottomNav';
import { CommunityFeed } from './CommunityFeed';
import { LocalServices } from './LocalServices';
import { ChatScreen } from './ChatScreen';
import { ProfileScreen } from './ProfileScreen';
import { ExternalDataProvider } from '../services/ExternalDataService';
import { RealTimeDataProvider } from '../services/RealTimeDataService';
import { LocationAwareLiveData } from './LiveData/LocationAwareLiveData';
import { LocationModal } from './LocationModal';
import { useLocation } from '../services/LocationService';
import { AiAssistant } from './AiAssistant';

type Screen = 'home' | 'services' | 'chat' | 'profile';

export function MainApp() {
  const { currentLocation } = useLocation();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [showLiveData, setShowLiveData] = useState(false);
  const scrollRef = useRef<number>(0);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <CommunityFeed userLocation={currentLocation} />;
      case 'services':
        return <LocalServices userLocation={currentLocation} />;
      case 'chat':
        return <ChatScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <CommunityFeed userLocation={currentLocation} />;
    }
  };

  return (
    <RealTimeDataProvider>
      <ExternalDataProvider>
        <div className="w-full max-w-md mx-auto bg-gradient-to-br from-orange-50 via-yellow-25 to-orange-25 min-h-screen flex flex-col relative overflow-hidden">
          {/* Main content area */}
          <main
            className="flex-1 overflow-y-auto relative z-10"
            onScroll={(e) => {
              const target = e.currentTarget as HTMLDivElement;
              const currentY = target.scrollTop;
              const lastY = (scrollRef.current ?? 0) as number;
              const delta = currentY - lastY;

              // small threshold to avoid jitter
              if (Math.abs(delta) < 15) {
                // update last position but do nothing
                scrollRef.current = currentY as any;
                return;
              }

              if (delta > 0) {
                // scrolling down -> minimize
                setShowLiveData(false);
              } else if (delta < 0) {
                // scrolling up -> expand
                setShowLiveData(true);
              }

              scrollRef.current = currentY as any;
            }}
          >
            {renderScreen()}
          </main>

          {/* Live Data Widget - Floating */}
          <div className="live-widget-wrapper fixed bottom-20 right-4 z-30 transition-all duration-300 ease-in-out w-auto">
            <LocationAwareLiveData
              collapsed={!showLiveData}
              onCollapseChange={(c) => setShowLiveData(!c)}
              userLocation={currentLocation}
            />
          </div>

          {/* AI Assistant */}
          <AiAssistant />

          {/* Bottom navigation */}
          <BottomNav currentScreen={currentScreen} onScreenChange={setCurrentScreen} />

          {/* Location modal */}
          <LocationModal />
        </div>
      </ExternalDataProvider>
    </RealTimeDataProvider>
  );
}