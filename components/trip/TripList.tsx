import React from 'react';
import { useTrips } from '../../context/TripContext';
import { useSession } from '../../context/SessionContext';
import { TripStatus } from '../../types';
import type { View } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { ICONS } from '../../constants';

interface TripListProps {
  setView: (view: View) => void;
}

const getStatusClass = (status: TripStatus) => {
  switch (status) {
    case TripStatus.PLANNED:
      return 'bg-blue-500 text-white';
    case TripStatus.IN_PROGRESS:
      return 'bg-yellow-500 text-black';
    case TripStatus.COMPLETED:
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

export const TripList: React.FC<TripListProps> = ({ setView }) => {
  const { trips, getDriver, getVehicle } = useTrips();
  const { currentDriverId } = useSession();

  const displayedTrips = currentDriverId
    ? trips.filter(trip => trip.driverId === currentDriverId)
    : trips;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{currentDriverId ? 'Minhas Viagens' : 'Todas as Viagens'}</CardTitle>
          <Button onClick={() => setView({type: 'newTrip'})}>Criar Nova Viagem</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedTrips.length > 0 ? displayedTrips.map(trip => {
            const driver = getDriver(trip.driverId);
            const vehicle = getVehicle(trip.vehicleId);
            return (
              <div key={trip.id} className="bg-slate-700 p-4 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white">{trip.origin} → {trip.destination}</h3>
                  <p className="text-sm text-slate-400">
                    {driver?.name} | {vehicle?.plate} ({vehicle?.model})
                  </p>
                  <p className="text-sm text-slate-400">
                    Início: {new Date(trip.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    {trip.monthlyTripNumber && ` | ${trip.monthlyTripNumber}ª Viagem do Mês`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                   <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(trip.status)}`}>
                    {trip.status}
                   </span>
                   <div className="flex items-center gap-2">
                     <Button variant="secondary" onClick={() => setView({ type: 'editTrip', tripId: trip.id })}>
                       <ICONS.pencil className="w-4 h-4 mr-1.5" />
                       Editar
                     </Button>
                     <Button variant="secondary" onClick={() => setView({ type: 'viewTrip', tripId: trip.id })}>
                      Ver Detalhes
                     </Button>
                   </div>
                </div>
              </div>
            )
          }) : <p className="text-slate-400 text-center py-8">Nenhuma viagem encontrada.</p>}
        </div>
      </CardContent>
    </Card>
  );
};