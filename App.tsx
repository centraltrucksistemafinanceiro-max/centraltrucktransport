
import React, { useState } from 'react';
import { TripProvider, useTrips } from './context/TripContext';
import { SessionProvider, useSession } from './context/SessionContext';
import { NotificationProvider } from './context/NotificationContext';
import { Notification } from './components/ui/Notification';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { DriverManagement } from './components/management/DriverManagement';
import { AdminManagement } from './components/management/AdminManagement';
import { VehicleManagement } from './components/management/VehicleManagement';
import { AccountsPayable } from './components/management/AccountsPayable';
import { BillingManagement } from './components/management/BillingManagement';
import { TripList } from './components/trip/TripList';
import { TripForm } from './components/trip/TripForm';
import { TripDetails } from './components/trip/TripDetails';
import { ActiveTripView } from './components/trip/ActiveTripView';
import { LoginScreen } from './components/auth/LoginScreen';
import { Trip } from './types';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { AnalysisDashboard } from './components/analysis/AnalysisDashboard';

export type View =
  | { type: 'dashboard' }
  | { type: 'tripList' }
  | { type: 'newTrip' }
  | { type: 'viewTrip'; tripId: string }
  | { type: 'editTrip'; tripId: string }
  | { type: 'activeTrip'; trip: Trip }
  | { type: 'drivers' }
  | { type: 'admins' }
  | { type: 'vehicles' }
  | { type: 'accountsPayable' }
  | { type: 'billing' }
  | { type: 'analysis' }
  | { type: 'profileSettings' };

const MainContent: React.FC<{ view: View; setView: (view: View) => void }> = ({ view, setView }) => {
  const { getTrip } = useTrips();
  
  switch (view.type) {
    case 'dashboard':
      return <Dashboard setView={setView} />;
    case 'tripList':
      return <TripList setView={setView} />;
    case 'drivers':
      return <DriverManagement />;
    case 'admins':
      return <AdminManagement />;
    case 'vehicles':
      return <VehicleManagement />;
    case 'accountsPayable':
        return <AccountsPayable />;
    case 'billing':
        return <BillingManagement />;
    case 'analysis':
        return <AnalysisDashboard />;
    case 'newTrip':
      return <TripForm setView={setView} />;
    case 'editTrip': {
        const tripToEdit = getTrip(view.tripId);
        if (!tripToEdit) {
            return <div className="text-white text-center p-8">Viagem não encontrada.</div>;
        }
        return <TripForm setView={setView} trip={tripToEdit} />;
    }
    case 'activeTrip':
      return <ActiveTripView trip={view.trip} setView={setView} />;
    case 'viewTrip':
        return <TripDetails tripId={view.tripId} setView={setView} />;
    case 'profileSettings':
        return <ProfileSettings setView={setView} />;
    default:
      return <Dashboard setView={setView} />;
  }
};

const AppContent: React.FC = () => {
    const [view, setView] = useState<View>({ type: 'dashboard' });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { session } = useSession();
    const { isLoading } = useTrips();

    if (!session.user) {
        return <LoginScreen />;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-screen bg-slate-900">
                <p className="text-white text-xl animate-pulse">Carregando dados...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-900">
            <Notification />
            <Sidebar 
              currentView={view} 
              setView={setView} 
              isOpen={isSidebarOpen}
              setIsOpen={setIsSidebarOpen}
            />
            <div className="flex flex-col flex-1 lg:ml-64">
                <Header setView={setView} onMenuClick={() => setIsSidebarOpen(true)} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <MainContent view={view} setView={setView} />
                </main>
            </div>
        </div>
    );
};


function App() {
  return (
    <NotificationProvider>
      <TripProvider>
        <SessionProvider>
          <AppContent />
        </SessionProvider>
      </TripProvider>
    </NotificationProvider>
  );
}

export default App;
