import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { ExternalDataProvider } from '../services/ExternalDataService';
import { RealTimeDataProvider } from '../services/RealTimeDataService';
import { LocationModal } from './LocationModal';
import { AiAssistant } from './AiAssistant';

export function MainApp() {
  const location = useLocation();

  // Hide bottom nav and AI assistant on live updates screen
  const isLiveUpdatesScreen = location.pathname === '/live';

  return (
    <RealTimeDataProvider>
      <ExternalDataProvider>
        <div className="w-full max-w-md mx-auto bg-gradient-to-br from-orange-50 via-yellow-25 to-orange-25 min-h-screen flex flex-col relative overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 overflow-y-auto relative z-10">
            <Outlet />
          </div>

          {/* AI Assistant - hide on live updates screen */}
          {!isLiveUpdatesScreen && <AiAssistant />}

          {/* Bottom navigation - hide on live updates screen */}
          {!isLiveUpdatesScreen && <BottomNav />}

          {/* Location modal */}
          <LocationModal />
        </div>
      </ExternalDataProvider>
    </RealTimeDataProvider>
  );
}