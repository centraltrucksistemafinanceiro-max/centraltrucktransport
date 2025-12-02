import React, { useState } from 'react';
import { useTrips } from '../../context/TripContext';
import { useSession } from '../../context/SessionContext';
import { Trip, Cargo, Expense, Fueling, TripStatus, ExpenseCategory, PaymentMethod, ReceivedPayment, ReceivedPaymentType, Trecho, TrechoStatus } from '../../types';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, RECEIVED_PAYMENT_TYPES } from '../../constants';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ICONS } from '../../constants';
import { AutocompleteInput } from '../ui/AutocompleteInput';
import { calculateTrechoMetrics } from '../../utils/tripMetrics';

type TripFormProps = {
    setView: (view: any) => void;
    trip?: Trip | null;
}

const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

export const TripForm: React.FC<TripFormProps> = ({ setView, trip: existingTrip }) => {
    const { drivers, vehicles, trips, addTrip, updateTrip } = useTrips();
    const { currentDriverId } = useSession();
    const [isSaving, setIsSaving] = useState(false);

    const [trip, setTrip] = useState<Omit<Trip, 'id' | 'createdAt'>>({
        driverId: existingTrip?.driverId || currentDriverId || '',
        vehicleId: existingTrip?.vehicleId || '',
        origin: existingTrip?.origin || '',
        destination: existingTrip?.destination || '',
        startDate: existingTrip?.startDate || today,
        endDate: existingTrip?.endDate || '',
        startKm: existingTrip?.startKm || 0,
        endKm: existingTrip?.endKm || 0,
        status: existingTrip?.status || TripStatus.PLANNED,
        cargo: existingTrip?.cargo || [],
        expenses: existingTrip?.expenses || [],
        fueling: existingTrip?.fueling || [],
        trechos: existingTrip?.trechos || [],
        driverCommissionRate: existingTrip?.driverCommissionRate || 10,
        receivedPayments: existingTrip?.receivedPayments || [],
    });

    // Autocomplete suggestions
    const originSuggestions = [...new Set(trips.map(t => t.origin))];
    const destinationSuggestions = [...new Set(trips.map(t => t.destination))];
    const cargoTypeSuggestions = [...new Set(trips.flatMap(t => t.cargo).map(c => c.type))];
    const stationSuggestions = [...new Set(trips.flatMap(t => t.fueling).map(f => f.station))];
    const expenseDescSuggestions = [...new Set(trips.flatMap(t => t.expenses).map(e => e.description))];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (['origin', 'destination'].includes(name)) {
             setTrip(prev => ({ ...prev, [name]: value.toUpperCase() }));
        } else {
            setTrip(prev => ({ ...prev, [name]: value }));
        }
    };
    
    // Cargo Management
    const [currentCargo, setCurrentCargo] = useState<Omit<Cargo, 'id'>>({ type: '', weight: 0, pricePerTon: 0, tax: 0 });
    const handleAddCargo = () => {
        if (currentCargo.type && currentCargo.weight > 0 && currentCargo.pricePerTon > 0) {
            setTrip(prev => ({ ...prev, cargo: [...prev.cargo, { ...currentCargo, id: '' + Math.random() }] }));
            setCurrentCargo({ type: '', weight: 0, pricePerTon: 0, tax: 0 });
        }
    };
    const handleRemoveCargo = (id: string) => {
        setTrip(prev => ({...prev, cargo: prev.cargo.filter(c => c.id !== id)}))
    }

    // Received Payments Management
    const [currentReceivedPayment, setCurrentReceivedPayment] = useState<Omit<ReceivedPayment, 'id'>>({ type: ReceivedPaymentType.ADVANCE, method: PaymentMethod.PIX, amount: 0, date: today });
    const handleAddReceivedPayment = () => {
        if (currentReceivedPayment.amount > 0) {
            setTrip(prev => ({ ...prev, receivedPayments: [...prev.receivedPayments, { ...currentReceivedPayment, id: '' + Math.random() }] }));
            setCurrentReceivedPayment({ type: ReceivedPaymentType.ADVANCE, method: PaymentMethod.PIX, amount: 0, date: today });
        }
    };
    const handleRemoveReceivedPayment = (id: string) => {
        setTrip(prev => ({...prev, receivedPayments: prev.receivedPayments.filter(p => p.id !== id)}));
    }

    // Trecho Management
    const [currentTrecho, setCurrentTrecho] = useState<Omit<Trecho, 'id'>>({ status: TrechoStatus.CARREGADO, kmInicial: trip.startKm || 0, kmFinal: 0, observacoes: '' });
    const handleAddTrecho = () => {
        if (currentTrecho.kmFinal > currentTrecho.kmInicial) {
            setTrip(prev => ({ ...prev, trechos: [...prev.trechos, { ...currentTrecho, id: '' + Math.random() }] }));
            setCurrentTrecho({ status: TrechoStatus.CARREGADO, kmInicial: currentTrecho.kmFinal, kmFinal: 0, observacoes: '' });
        }
    };
    const handleRemoveTrecho = (id: string) => {
        setTrip(prev => ({...prev, trechos: prev.trechos.filter(t => t.id !== id)}))
    }

    // Fueling Management
    const [currentFueling, setCurrentFueling] = useState<Omit<Fueling, 'id'>>({ station: '', date: today, km: trip.startKm || 0, liters: 0, totalAmount: 0, paymentMethod: PaymentMethod.CARD });
    const handleAddFueling = () => {
        if (currentFueling.station && currentFueling.liters > 0 && currentFueling.totalAmount > 0) {
            setTrip(prev => ({ ...prev, fueling: [...prev.fueling, { ...currentFueling, id: '' + Math.random() }] }));
            setCurrentFueling({ station: '', date: today, km: 0, liters: 0, totalAmount: 0, paymentMethod: PaymentMethod.CARD });
        }
    };
    const handleRemoveFueling = (id: string) => {
        setTrip(prev => ({...prev, fueling: prev.fueling.filter(f => f.id !== id)}))
    }

    // Expense Management
    const [currentExpense, setCurrentExpense] = useState<Omit<Expense, 'id'>>({ category: ExpenseCategory.OTHER, description: '', amount: 0, date: today });
    const handleAddExpense = () => {
        if (currentExpense.description && currentExpense.amount > 0) {
            setTrip(prev => ({ ...prev, expenses: [...prev.expenses, { ...currentExpense, id: '' + Math.random() }] }));
            setCurrentExpense({ category: ExpenseCategory.OTHER, description: '', amount: 0, date: today });
        }
    };
     const handleRemoveExpense = (id: string) => {
        setTrip(prev => ({...prev, expenses: prev.expenses.filter(e => e.id !== id)}))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        if (existingTrip) {
            const updatedTripData: Trip = {
                ...existingTrip,
                ...trip,
            };
            await updateTrip(updatedTripData);
            setView({ type: 'viewTrip', tripId: existingTrip.id });
        } else {
            const tripToSave = {
                ...trip,
                status: trip.status === TripStatus.PLANNED ? TripStatus.IN_PROGRESS : trip.status
            };
            await addTrip(tripToSave);
            setView({ type: 'dashboard' });
        }
        setIsSaving(false);
    };

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    // Real-time calculations
    const totalFreight = trip.cargo.reduce((sum, c) => sum + ((c.weight * c.pricePerTon) - (c.tax || 0)), 0);
    const driverCommission = (totalFreight * trip.driverCommissionRate) / 100;
    const totalReceived = trip.receivedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalFueling = trip.fueling.reduce((sum, f) => sum + f.totalAmount, 0);
    const totalLiters = trip.fueling.reduce((sum, f) => sum + f.liters, 0);
    const totalOtherExpenses = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = totalFueling + totalOtherExpenses;
    const estimatedNetBalance = totalFreight - driverCommission - totalExpenses;
    const totalKm = trip.endKm > trip.startKm ? trip.endKm - trip.startKm : 0;
    
    // Trecho metrics
    const trechoMetrics = calculateTrechoMetrics(trip.trechos, totalLiters, totalKm);

    const pricePerLiter = currentFueling.liters > 0 && currentFueling.totalAmount > 0 ? currentFueling.totalAmount / currentFueling.liters : 0;
    
    // Filter drivers and vehicles to show only active ones, but include the selected one if it's inactive (on edit)
    const availableDrivers = drivers.filter(d => d.status === 'active');
    const currentTripDriver = existingTrip ? drivers.find(d => d.id === existingTrip.driverId) : null;
    if (currentTripDriver && currentTripDriver.status === 'inactive' && !availableDrivers.some(d => d.id === currentTripDriver.id)) {
        availableDrivers.unshift(currentTripDriver);
    }

    const availableVehicles = vehicles.filter(v => v.status === 'active');
    const currentTripVehicle = existingTrip ? vehicles.find(v => v.id === existingTrip.vehicleId) : null;
    if (currentTripVehicle && currentTripVehicle.status === 'inactive' && !availableVehicles.some(v => v.id === currentTripVehicle.id)) {
        availableVehicles.unshift(currentTripVehicle);
    }


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader><CardTitle>{existingTrip ? 'Editar Viagem' : 'Criar Nova Viagem'}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Select id="driverId" name="driverId" label="Motorista" value={trip.driverId} onChange={handleInputChange} required disabled={!!currentDriverId}>
                        <option value="">Selecione...</option>
                        {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name} {d.status === 'inactive' ? '(Inativo)' : ''}</option>)}
                    </Select>
                    <Select id="vehicleId" name="vehicleId" label="Veículo" value={trip.vehicleId} onChange={handleInputChange} required>
                        <option value="">Selecione...</option>
                        {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model} {v.status === 'inactive' ? '(Inativo)' : ''}</option>)}
                    </Select>
                    <AutocompleteInput id="origin" name="origin" label="Origem" value={trip.origin} onChange={handleInputChange} required suggestions={originSuggestions} />
                    <AutocompleteInput id="destination" name="destination" label="Destino" value={trip.destination} onChange={handleInputChange} required suggestions={destinationSuggestions} />
                    <Input id="startDate" name="startDate" label="Data Início" type="date" value={trip.startDate} onChange={handleInputChange} required />
                    <Input id="endDate" name="endDate" label="Data Fim" type="date" value={trip.endDate || ''} onChange={handleInputChange} />
                    <Input id="startKm" name="startKm" label="KM Inicial" type="number" step="any" value={trip.startKm || ''} onChange={e => setTrip(p => ({...p, startKm: e.target.valueAsNumber || 0}))} required />
                    <Input id="endKm" name="endKm" label="KM Final" type="number" step="any" value={trip.endKm || ''} onChange={e => setTrip(p => ({...p, endKm: e.target.valueAsNumber || 0}))} />
                    <Select id="status" name="status" label="Status" value={trip.status} onChange={handleInputChange}>
                       {Object.values(TripStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Input id="driverCommissionRate" name="driverCommissionRate" label="Comissão Motorista (%)" type="number" step="any" value={trip.driverCommissionRate || ''} onChange={e => setTrip(p => ({...p, driverCommissionRate: e.target.valueAsNumber || 0}))} required />
                </CardContent>
            </Card>

            {/* Trechos */}
            <Card>
                <CardHeader><CardTitle>Registro de Trechos (Carregado/Vazio)</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2 mb-4 min-h-[60px]">
                    {trip.trechos.map((t) => (
                        <div key={t.id} className="bg-slate-700 p-2 rounded flex items-center justify-between">
                            <div className="flex-1">
                                <span className={`font-semibold ${t.status === TrechoStatus.CARREGADO ? 'text-yellow-400' : 'text-blue-400'}`}>
                                    {t.status}: {t.kmInicial}km → {t.kmFinal}km ({t.kmFinal - t.kmInicial}km)
                                </span>
                                {t.observacoes && <p className="text-xs text-slate-400 mt-1">{t.observacoes}</p>}
                            </div>
                            <Button type="button" variant="danger" onClick={() => handleRemoveTrecho(t.id)} className="p-1 h-7 w-7"><ICONS.trash className="h-4 w-4"/></Button>
                        </div>
                    ))}
                    </div>
                    
                    {trip.trechos.length > 0 && (
                        <div className="border-t border-slate-700 pt-3 mb-4 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-400">KM Carregado</span>
                                <span className="font-semibold text-yellow-400">{trechoMetrics.kmCarregado}km</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">KM Vazio</span>
                                <span className="font-semibold text-blue-400">{trechoMetrics.kmVazio}km</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                                <span className="text-slate-300">Média Carregado</span>
                                <span className="font-bold text-yellow-300">{trechoMetrics.mediaCarregado.toFixed(2)} km/l</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-300">Média Vazio</span>
                                <span className="font-bold text-blue-300">{trechoMetrics.mediaVazio.toFixed(2)} km/l</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-300">Média Geral</span>
                                <span className="font-bold text-green-300">{trechoMetrics.mediaGeral.toFixed(2)} km/l</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-slate-700 pt-4">
                        <Select id="trechoStatus" label="Tipo" value={currentTrecho.status} onChange={e => setCurrentTrecho(p => ({...p, status: e.target.value as TrechoStatus}))}>
                            {Object.values(TrechoStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <Input id="trechoKmInicial" label="KM Inicial" type="number" step="any" value={currentTrecho.kmInicial || ''} onChange={e => setCurrentTrecho(p => ({...p, kmInicial: e.target.valueAsNumber || 0}))}/>
                        <Input id="trechoKmFinal" label="KM Final" type="number" step="any" value={currentTrecho.kmFinal || ''} onChange={e => setCurrentTrecho(p => ({...p, kmFinal: e.target.valueAsNumber || 0}))}/>
                        <Input id="trechoObs" label="Observações" type="text" value={currentTrecho.observacoes || ''} onChange={e => setCurrentTrecho(p => ({...p, observacoes: e.target.value}))}/>
                    </div>
                    <Button type="button" variant="secondary" onClick={handleAddTrecho} className="mt-2 w-full">Adicionar Trecho</Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Cargas */}
                <Card>
                    <CardHeader><CardTitle>Cargas da Viagem</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2 mb-4 min-h-[60px]">
                        {trip.cargo.map((c) => (
                           <div key={c.id} className="bg-slate-700 p-2 rounded flex items-center justify-between">
                               <div>
                                 <span>{c.type} - {c.weight}t x {formatCurrency(c.pricePerTon)}</span>
                                 {c.tax && c.tax > 0 && <span className="text-xs text-red-400 ml-2">(-{formatCurrency(c.tax)} imposto)</span>}
                               </div>
                               <div className="flex items-center gap-2">
                                <span className="font-bold">{formatCurrency((c.weight * c.pricePerTon) - (c.tax || 0))}</span>
                                <Button type="button" variant="danger" onClick={() => handleRemoveCargo(c.id)} className="p-1 h-7 w-7"><ICONS.trash className="h-4 w-4"/></Button>
                               </div>
                           </div>
                        ))}
                        </div>
                        <div className="border-t border-slate-700 pt-3 space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Frete Bruto Total</span>
                                <span className="font-semibold text-white">{formatCurrency(totalFreight)}</span>
                            </div>
                            <div className="flex justify-between text-base">
                                <span className="text-slate-300">Sua Comissão ({trip.driverCommissionRate}%)</span>
                                <span className="font-bold text-lg text-green-400">{formatCurrency(driverCommission)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-slate-700 pt-4">
                            <AutocompleteInput id="cargoType" label="Tipo" value={currentCargo.type} onChange={e => setCurrentCargo(p => ({...p, type: e.target.value.toUpperCase()}))} suggestions={cargoTypeSuggestions} />
                            <Input id="cargoWeight" label="Peso (t)" type="number" step="any" value={currentCargo.weight || ''} onChange={e => setCurrentCargo(p => ({...p, weight: e.target.valueAsNumber || 0}))}/>
                            <Input id="cargoPrice" label="Valor/t" type="number" step="0.01" value={currentCargo.pricePerTon || ''} onChange={e => setCurrentCargo(p => ({...p, pricePerTon: e.target.valueAsNumber || 0}))}/>
                            <Input id="cargoTax" label="Imposto (R$)" type="number" step="0.01" value={currentCargo.tax || ''} onChange={e => setCurrentCargo(p => ({...p, tax: e.target.valueAsNumber || 0}))}/>
                        </div>
                        <Button type="button" variant="secondary" onClick={handleAddCargo} className="mt-2 w-full">Adicionar Carga</Button>
                    </CardContent>
                </Card>

                {/* Recebimentos */}
                <Card>
                    <CardHeader><CardTitle>Recebimentos do Frete</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2 mb-4 min-h-[60px]">
                        {trip.receivedPayments.map((p) => (
                            <div key={p.id} className="bg-slate-700 p-2 rounded flex items-center justify-between">
                               <span>{p.type}: {p.method}</span>
                               <div className="flex items-center gap-2">
                                <span className="font-bold text-green-400">{formatCurrency(p.amount)}</span>
                                <Button type="button" variant="danger" onClick={() => handleRemoveReceivedPayment(p.id)} className="p-1 h-7 w-7"><ICONS.trash className="h-4 w-4"/></Button>
                               </div>
                           </div>
                        ))}
                        </div>
                        <div className="border-t border-slate-700 pt-3 mb-4">
                             <div className="flex justify-between text-base">
                                <span className="text-slate-300">Total Recebido</span>
                                <span className="font-bold text-lg text-green-400">{formatCurrency(totalReceived)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 border-t border-slate-700 pt-4">
                            <Select id="recType" label="Tipo" value={currentReceivedPayment.type} onChange={e => setCurrentReceivedPayment(p => ({...p, type: e.target.value as ReceivedPaymentType}))}>
                                {RECEIVED_PAYMENT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                            </Select>
                            <Select id="recMethod" label="Forma Pgto." value={currentReceivedPayment.method} onChange={e => setCurrentReceivedPayment(p => ({...p, method: e.target.value as PaymentMethod}))}>
                                {PAYMENT_METHODS.map(c => <option key={c} value={c}>{c}</option>)}
                            </Select>
                            <Input id="recDate" label="Data" type="date" value={currentReceivedPayment.date} onChange={e => setCurrentReceivedPayment(p => ({...p, date: e.target.value}))}/>
                            <Input id="recAmount" label="Valor (R$)" type="number" step="0.01" value={currentReceivedPayment.amount || ''} onChange={e => setCurrentReceivedPayment(p => ({...p, amount: e.target.valueAsNumber || 0}))}/>
                        </div>
                        <Button type="button" variant="secondary" onClick={handleAddReceivedPayment} className="mt-2 w-full">Adicionar Recebimento</Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Abastecimentos */}
                <Card>
                    <CardHeader><CardTitle>Abastecimentos</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2 mb-4 min-h-[60px]">
                        {trip.fueling.map((f) => (
                            <div key={f.id} className="bg-slate-700 p-2 rounded flex items-center justify-between">
                               <span>{f.station}: {f.liters}L</span>
                               <div className="flex items-center gap-2">
                                <span className="font-bold">{formatCurrency(f.totalAmount)}</span>
                                <Button type="button" variant="danger" onClick={() => handleRemoveFueling(f.id)} className="p-1 h-7 w-7"><ICONS.trash className="h-4 w-4"/></Button>
                               </div>
                           </div>
                        ))}
                        </div>
                        <div className="border-t border-slate-700 pt-3 mb-4">
                             <div className="flex justify-between text-base">
                                <span className="text-slate-300">Total de Combustível</span>
                                <span className="font-bold text-lg text-red-400">{formatCurrency(totalFueling)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border-t border-slate-700 pt-4">
                            <AutocompleteInput id="fuelStation" label="Posto" value={currentFueling.station} onChange={e => setCurrentFueling(p => ({...p, station: e.target.value.toUpperCase()}))} suggestions={stationSuggestions}/>
                            <Input id="fuelKm" label="KM" type="number" step="any" value={currentFueling.km || ''} onChange={e => setCurrentFueling(p => ({...p, km: e.target.valueAsNumber || 0}))}/>
                             <Select id="fuelPayment" label="Pagamento" value={currentFueling.paymentMethod} onChange={e => setCurrentFueling(p => ({...p, paymentMethod: e.target.value as PaymentMethod}))}>
                                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </Select>
                            <Input id="fuelLiters" label="Litros" type="number" step="any" value={currentFueling.liters || ''} onChange={e => setCurrentFueling(p => ({...p, liters: e.target.valueAsNumber || 0}))}/>
                            <Input id="fuelAmount" label="Valor Total" type="number" step="0.01" value={currentFueling.totalAmount || ''} onChange={e => setCurrentFueling(p => ({...p, totalAmount: e.target.valueAsNumber || 0}))}/>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Preço / Litro</label>
                                <div className="mt-1 flex items-center justify-center bg-slate-800 rounded-md h-[38px] text-white font-semibold">
                                    {formatCurrency(pricePerLiter)}
                                </div>
                            </div>
                        </div>
                        <Button type="button" variant="secondary" onClick={handleAddFueling} className="mt-2 w-full">Adicionar Abastecimento</Button>
                    </CardContent>
                </Card>

                {/* Outras Despesas */}
                <Card>
                    <CardHeader><CardTitle>Outras Despesas</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2 mb-4 min-h-[60px]">
                        {trip.expenses.map((e) => (
                            <div key={e.id} className="bg-slate-700 p-2 rounded flex items-center justify-between">
                               <span>{e.category}: {e.description}</span>
                               <div className="flex items-center gap-2">
                                <span className="font-bold">{formatCurrency(e.amount)}</span>
                                <Button type="button" variant="danger" onClick={() => handleRemoveExpense(e.id)} className="p-1 h-7 w-7"><ICONS.trash className="h-4 w-4"/></Button>
                               </div>
                           </div>
                        ))}
                        </div>
                        <div className="border-t border-slate-700 pt-3 mb-4">
                             <div className="flex justify-between text-base">
                                <span className="text-slate-300">Total Outras Despesas</span>
                                <span className="font-bold text-lg text-red-400">{formatCurrency(totalOtherExpenses)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-t border-slate-700 pt-4">
                            <Select id="expCat" label="Categoria" value={currentExpense.category} onChange={e => setCurrentExpense(p => ({...p, category: e.target.value as ExpenseCategory}))}>
                                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </Select>
                            <AutocompleteInput id="expDesc" label="Descrição" value={currentExpense.description} onChange={e => setCurrentExpense(p => ({...p, description: e.target.value.toUpperCase()}))} suggestions={expenseDescSuggestions}/>
                            <Input id="expAmount" label="Valor" type="number" step="0.01" value={currentExpense.amount || ''} onChange={e => setCurrentExpense(p => ({...p, amount: e.target.valueAsNumber || 0}))}/>
                        </div>
                        <Button type="button" variant="secondary" onClick={handleAddExpense} className="mt-2 w-full">Adicionar Despesa</Button>
                    </CardContent>
                </Card>
            </div>
            
            <Card className="bg-slate-900/50">
                <CardContent className="text-center p-4">
                    <p className="text-slate-400 text-sm mb-2">Estimativa de Lucro da Viagem</p>
                    <p className={`text-3xl font-bold ${estimatedNetBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(estimatedNetBalance)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        (Frete - Despesas - Comissão)
                    </p>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="secondary" onClick={() => setView({ type: 'tripList' })} disabled={isSaving}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Salvando...' : (existingTrip ? 'Atualizar Viagem' : 'Salvar e Iniciar Viagem')}
                </Button>
            </div>
        </form>
    );
};
