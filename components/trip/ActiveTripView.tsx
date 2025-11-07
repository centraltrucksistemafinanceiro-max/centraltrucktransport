import React, { useState } from 'react';
import { useTrips } from '../../context/TripContext';
import { Trip, Expense, Fueling, ExpenseCategory, TripStatus, PaymentMethod } from '../../types';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../constants';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ICONS } from '../../constants';
import { View } from '../../App';
import { AutocompleteInput } from '../ui/AutocompleteInput';
import { useNotification } from '../../context/NotificationContext';

type ActiveTripViewProps = {
  trip: Trip;
  setView: (view: View) => void;
};

const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const ActiveTripView: React.FC<ActiveTripViewProps> = ({ trip: initialTrip, setView }) => {
    const { trips, updateTrip } = useTrips();
    const { showNotification } = useNotification();
    const [trip, setTrip] = useState<Trip>(initialTrip);
    const [endKm, setEndKm] = useState(0);
    const [isFinishing, setIsFinishing] = useState(false);

    const [currentExpense, setCurrentExpense] = useState<Omit<Expense, 'id'>>({ category: ExpenseCategory.OTHER, description: '', amount: 0, date: today });
    const [currentFueling, setCurrentFueling] = useState<Omit<Fueling, 'id'>>({ station: '', date: today, km: trip.startKm, liters: 0, totalAmount: 0, paymentMethod: PaymentMethod.CARD });
    
    const stationSuggestions = [...new Set(trips.flatMap(t => t.fueling).map(f => f.station))];
    const expenseDescSuggestions = [...new Set(trips.flatMap(t => t.expenses).map(e => e.description))];

    const handleAddExpense = async () => {
        if (currentExpense.description && currentExpense.amount > 0) {
            const newExpense = { ...currentExpense, id: '' + Math.random() };
            const updatedTrip = { ...trip, expenses: [...trip.expenses, newExpense] };
            setTrip(updatedTrip);
            await updateTrip(updatedTrip);
            setCurrentExpense({ category: ExpenseCategory.OTHER, description: '', amount: 0, date: today });
            showNotification('Despesa adicionada com sucesso!', 'success');
        } else {
            showNotification('Preencha a descrição e um valor maior que zero.', 'error');
        }
    };
    
    const handleAddFueling = async () => {
        if (currentFueling.station && currentFueling.liters > 0 && currentFueling.totalAmount > 0) {
            const newFueling = { ...currentFueling, id: '' + Math.random() };
            const updatedTrip = { ...trip, fueling: [...trip.fueling, newFueling] };
            setTrip(updatedTrip);
            await updateTrip(updatedTrip);
            setCurrentFueling({ station: '', date: today, km: 0, liters: 0, totalAmount: 0, paymentMethod: PaymentMethod.CARD });
            showNotification('Abastecimento adicionado com sucesso!', 'success');
        } else {
             showNotification('Preencha o posto, litros e valor total.', 'error');
        }
    };

    const handleRemoveExpense = async (id: string) => {
        const updatedTrip = { ...trip, expenses: trip.expenses.filter(e => e.id !== id) };
        setTrip(updatedTrip);
        await updateTrip(updatedTrip);
    }
    
    const handleRemoveFueling = async (id: string) => {
        const updatedTrip = { ...trip, fueling: trip.fueling.filter(f => f.id !== id) };
        setTrip(updatedTrip);
        await updateTrip(updatedTrip);
    }
    
    const handleFinishTrip = async () => {
        if (endKm > trip.startKm) {
            setIsFinishing(true);
            const finishedTrip = {
                ...trip,
                endKm,
                endDate: today,
                status: TripStatus.COMPLETED
            }
            await updateTrip(finishedTrip);
            setIsFinishing(false);
            setView({ type: 'viewTrip', tripId: trip.id });
        } else {
            showNotification('A quilometragem final deve ser maior que a inicial.', 'error');
        }
    }
    
    const totalOtherExpenses = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalFueling = trip.fueling.reduce((sum, f) => sum + f.totalAmount, 0);
    const pricePerLiter = currentFueling.liters > 0 && currentFueling.totalAmount > 0 ? currentFueling.totalAmount / currentFueling.liters : 0;

    return (
        <div className="space-y-6">
             <Button onClick={() => setView({type: 'dashboard'})} variant="secondary" className="mb-4">
                &larr; Voltar para o Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-white">Gerenciando Viagem: {trip.origin} &rarr; {trip.destination}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Adicionar Abastecimento</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                        <Button onClick={handleAddFueling} className="mt-4 w-full">Adicionar Abastecimento</Button>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>Finalizar Viagem</CardTitle></CardHeader>
                    <CardContent className="flex flex-col h-full">
                        <p className="text-slate-400 mb-4">Ao chegar, preencha a KM final para completar a viagem.</p>
                        <div className="flex-grow">
                            <Input
                                id="endKm"
                                label={`KM Final (Inicial: ${trip.startKm} km)`}
                                type="number"
                                step="any"
                                value={endKm || ''}
                                onChange={e => setEndKm(e.target.valueAsNumber || 0)}
                                placeholder="Digite a KM do painel"
                            />
                        </div>
                        <Button onClick={handleFinishTrip} variant="primary" className="mt-4 w-full bg-green-600 hover:bg-green-700 focus:ring-green-500" disabled={isFinishing}>
                            {isFinishing ? 'Finalizando...' : 'Completar Viagem e Gerar Acerto'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader><CardTitle>Adicionar Nova Despesa (Outras)</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Select id="expCat" label="Categoria" value={currentExpense.category} onChange={e => setCurrentExpense(p => ({...p, category: e.target.value as ExpenseCategory}))}>
                            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                        <AutocompleteInput id="expDesc" label="Descrição" value={currentExpense.description} onChange={e => setCurrentExpense(p => ({...p, description: e.target.value.toUpperCase()}))} suggestions={expenseDescSuggestions}/>
                        <Input id="expAmount" label="Valor (R$)" type="number" step="0.01" value={currentExpense.amount || ''} onChange={e => setCurrentExpense(p => ({...p, amount: e.target.valueAsNumber || 0}))}/>
                    </div>
                    <Button onClick={handleAddExpense} className="mt-4 w-full" variant="secondary">Adicionar Despesa</Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Abastecimentos da Viagem</CardTitle>
                            <div className="text-lg font-bold text-white">Total: {formatCurrency(totalFueling)}</div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                        {trip.fueling.length > 0 ? trip.fueling.map((f) => (
                            <div key={f.id} className="bg-slate-700 p-3 rounded flex items-center justify-between">
                                <div>
                                   <p className="font-semibold text-white">{f.station}</p>
                                   <p className="text-sm text-slate-300">{f.liters}L - {new Date(f.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                </div>
                               <div className="flex items-center gap-4">
                                <span className="font-bold text-lg">{formatCurrency(f.totalAmount)}</span>
                                <Button type="button" variant="danger" onClick={() => handleRemoveFueling(f.id)} className="p-1 h-7 w-7"><ICONS.trash className="h-4 w-4"/></Button>
                               </div>
                           </div>
                        )) : <p className="text-center text-slate-400 py-4">Nenhum abastecimento adicionado.</p>}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Outras Despesas</CardTitle>
                            <div className="text-lg font-bold text-white">Total: {formatCurrency(totalOtherExpenses)}</div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                        {trip.expenses.length > 0 ? trip.expenses.map((e) => (
                            <div key={e.id} className="bg-slate-700 p-3 rounded flex items-center justify-between">
                                <div>
                                   <p className="font-semibold text-white">{e.category}</p>
                                   <p className="text-sm text-slate-300">{e.description} - {new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                </div>
                               <div className="flex items-center gap-4">
                                <span className="font-bold text-lg">{formatCurrency(e.amount)}</span>
                                <Button type="button" variant="danger" onClick={() => handleRemoveExpense(e.id)} className="p-1 h-7 w-7"><ICONS.trash className="h-4 w-4"/></Button>
                               </div>
                           </div>
                        )) : <p className="text-center text-slate-400 py-4">Nenhuma outra despesa adicionada.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
