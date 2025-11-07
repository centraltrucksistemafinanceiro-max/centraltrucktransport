import React from 'react';
import { useSession } from '../../context/SessionContext';
import { useTrips } from '../../context/TripContext';
import { TripStatus } from '../../types';
import { View } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { ICONS } from '../../constants';
import { TripList } from '../trip/TripList';

const StatCard: React.FC<{ icon: React.ReactElement; label: string; value: string | number }> = ({ icon, label, value }) => (
  <Card className="bg-slate-800">
    <CardContent className="flex items-center p-4">
      <div className="p-3 bg-slate-700 rounded-lg mr-4">
        {/* FIX: Cast icon to React.ReactElement<any> and remove hardcoded color to allow dynamic coloring */}
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export const Dashboard: React.FC<{ setView: (view: View) => void }> = ({ setView }) => {
  const { currentDriver } = useSession();
  const { trips, drivers, vehicles } = useTrips();

  if (!currentDriver) {
    const ongoingTrips = trips.filter(t => t.status === TripStatus.IN_PROGRESS).length;
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-white">Dashboard do Administrador</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <StatCard icon={<ICONS.driver className="text-indigo-400"/>} label="Total de Motoristas" value={drivers.length} />
              <StatCard icon={<ICONS.vehicle className="text-teal-400"/>} label="Total de Veículos" value={vehicles.length} />
              <StatCard icon={<ICONS.trip className="text-amber-400"/>} label="Viagens em Andamento" value={ongoingTrips} />
            </div>
            <TripList setView={setView} />
        </div>
    );
  }
  
  const driverTrips = trips.filter(t => t.driverId === currentDriver.id);
  const activeTrip = driverTrips.find(t => t.status === TripStatus.IN_PROGRESS);

  const completedTrips = driverTrips.filter(t => t.status === TripStatus.COMPLETED).length;
  const totalKm = driverTrips.reduce((acc, t) => acc + (t.endKm > 0 ? t.endKm - t.startKm : 0), 0);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Olá, {currentDriver.name}!</h1>

      {activeTrip ? (
        <Card className="bg-gradient-to-r from-blue-600 to-blue-800 border-blue-500">
          <CardHeader>
            <CardTitle className="text-white">Viagem em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xl font-bold text-white">{activeTrip.origin} &rarr; {activeTrip.destination} {activeTrip.monthlyTripNumber ? `(${activeTrip.monthlyTripNumber}ª Viagem do Mês)` : ''}</p>
                <p className="text-blue-200">Iniciada em: {new Date(activeTrip.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
              <Button onClick={() => setView({ type: 'activeTrip', trip: activeTrip })} className="bg-white text-blue-700 hover:bg-blue-100 mt-4 md:mt-0">
                <ICONS.trip className="w-5 h-5 mr-2" />
                Gerenciar Viagem
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
            <CardContent className="text-center py-8">
                <p className="text-slate-300">Nenhuma viagem em andamento no momento.</p>
                <Button onClick={() => setView({type: 'newTrip'})} className="mt-4">
                    <ICONS.plus className="w-5 h-5 mr-2" />
                    Iniciar Nova Viagem
                </Button>
            </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Suas Estatísticas</CardTitle></CardHeader>
          <CardContent>
             <div className="flex items-center justify-between p-2">
                <span className="text-slate-400">Viagens Finalizadas</span>
                <span className="font-bold text-lg text-white">{completedTrips}</span>
            </div>
             <div className="flex items-center justify-between p-2">
                <span className="text-slate-400">Total KM Rodados</span>
                <span className="font-bold text-lg text-white">{totalKm.toLocaleString('pt-BR')} km</span>
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Seu Histórico</CardTitle></CardHeader>
             <CardContent>
                <p className="text-slate-400 mb-4">Veja seu histórico completo de viagens.</p>
                <Button onClick={() => setView({ type: 'tripList' })} variant="secondary" className="w-full">
                    Ver Histórico de Viagens
                </Button>
             </CardContent>
        </Card>
      </div>

    </div>
  );
};