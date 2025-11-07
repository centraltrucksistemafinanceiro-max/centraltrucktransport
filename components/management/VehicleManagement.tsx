
import React, { useState, useEffect } from 'react';
import { useTrips } from '../../context/TripContext';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { ICONS } from '../../constants';
import { Vehicle } from '../../types';
import { AutocompleteInput } from '../ui/AutocompleteInput';

const VehicleRow: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
    const { trips, vehicles, updateVehicle, deleteVehicle } = useTrips();
    const [isEditing, setIsEditing] = useState(false);
    const [vehicleData, setVehicleData] = useState(vehicle);
    
    const modelSuggestions = [...new Set(vehicles.map(v => v.model))];

    useEffect(() => {
        setVehicleData(vehicle);
    }, [vehicle]);

    const isDeletable = !trips.some(trip => trip.vehicleId === vehicle.id);

    const handleToggleStatus = () => {
        updateVehicle({ ...vehicle, status: vehicle.status === 'active' ? 'inactive' : 'active' });
    };

    const handleSave = () => {
        updateVehicle(vehicleData);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (isDeletable && window.confirm(`Tem certeza que deseja excluir o veículo ${vehicle.plate}? Esta ação não pode ser desfeita.`)) {
            deleteVehicle(vehicle.id);
        }
    };

    if (isEditing) {
        return (
            <div className="bg-slate-700 p-4 rounded-md space-y-3">
                <Input id={`plate-${vehicle.id}`} label="Placa" value={vehicleData.plate} onChange={e => setVehicleData(v => ({ ...v, plate: e.target.value.toUpperCase() }))} />
                <AutocompleteInput 
                    id={`model-${vehicle.id}`} 
                    label="Modelo" 
                    value={vehicleData.model} 
                    onChange={e => setVehicleData(v => ({ ...v, model: e.target.value.toUpperCase() }))}
                    suggestions={modelSuggestions}
                />
                <Input id={`chassi-${vehicle.id}`} label="Chassi" value={vehicleData.chassi} onChange={e => setVehicleData(v => ({ ...v, chassi: e.target.value.toUpperCase() }))} />
                <div className="flex gap-2 justify-end mt-2">
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar Alterações</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-slate-700 p-4 rounded-md flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-opacity ${vehicle.status === 'inactive' ? 'opacity-50' : ''}`}>
            <div>
                <p className="font-semibold text-white flex items-center gap-2">
                    {vehicle.plate}
                     <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${vehicle.status === 'active' ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}>
                        {vehicle.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                </p>
                <p className="text-sm text-slate-400">{vehicle.model} | Chassi: {vehicle.chassi}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 md:mt-0 justify-start md:justify-end">
                <Button variant="secondary" onClick={() => setIsEditing(true)}>Editar</Button>
                <Button variant={vehicle.status === 'active' ? 'secondary' : 'primary'} onClick={handleToggleStatus}>
                    {vehicle.status === 'active' ? 'Inativar' : 'Ativar'}
                </Button>
                <Button variant="danger" onClick={handleDelete} disabled={!isDeletable} title={!isDeletable ? "Veículo não pode ser excluído pois está associado a viagens." : "Excluir veículo"}>
                    Excluir
                </Button>
            </div>
        </div>
    );
};

export const VehicleManagement: React.FC = () => {
  const { vehicles, addVehicle } = useTrips();
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [chassi, setChassi] = useState('');
  
  const modelSuggestions = [...new Set(vehicles.map(v => v.model))];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plate && model && chassi) {
      addVehicle({ plate, model, chassi });
      setPlate('');
      setModel('');
      setChassi('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Veículo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="vehiclePlate"
                label="Placa"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                required
              />
              <AutocompleteInput
                id="vehicleModel"
                label="Modelo"
                value={model}
                onChange={(e) => setModel(e.target.value.toUpperCase())}
                suggestions={modelSuggestions}
                required
              />
              <Input
                id="vehicleChassi"
                label="Chassi"
                value={chassi}
                onChange={(e) => setChassi(e.target.value.toUpperCase())}
                required
              />
              <Button type="submit" className="w-full">
                <ICONS.plus className="w-5 h-5 mr-2" />
                Adicionar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Veículos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vehicles.length > 0 ? (
                [...vehicles].sort((a,b) => a.plate.localeCompare(b.plate)).map((vehicle) => (
                    <VehicleRow key={vehicle.id} vehicle={vehicle} />
                ))
              ) : (
                <p className="text-slate-400 text-center py-4">Nenhum veículo cadastrado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
