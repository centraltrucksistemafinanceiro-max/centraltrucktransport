import React, { useState } from 'react';
import { useTrips } from '../../context/TripContext';
import { Trip, Expense, ExpenseCategory, ReceivedPayment, ReceivedPaymentType, PaymentMethod } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ICONS, EXPENSE_CATEGORIES, RECEIVED_PAYMENT_TYPES, PAYMENT_METHODS } from '../../constants';
import { AutocompleteInput } from '../ui/AutocompleteInput';
import { useNotification } from '../../context/NotificationContext';
import { calculateTrechoMetrics } from '../../utils/tripMetrics';

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`mb-6 ${className}`}>
        <h3 className="text-lg font-semibold text-blue-400 border-b border-slate-700 pb-2 mb-3">{title}</h3>
        {children}
    </div>
);

const InfoItem: React.FC<{ label: string; value: string | number | undefined; isCurrency?: boolean }> = ({ label, value, isCurrency = false }) => (
    <div className="flex justify-between items-center py-2 text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-white">{isCurrency && typeof value === 'number' ? formatCurrency(value) : value}</span>
    </div>
);


const calculateTotals = (trip: Trip) => {
    const totalFreight = trip.cargo.reduce((sum, c) => sum + (c.weight * c.pricePerTon) - (c.tax || 0), 0);
    const totalOtherExpenses = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalFueling = trip.fueling.reduce((sum, f) => sum + f.totalAmount, 0);
    const totalExpenses = totalOtherExpenses + totalFueling;
    const driverCommission = (totalFreight * trip.driverCommissionRate) / 100;
    const netBalance = totalFreight - driverCommission - totalExpenses;
    const totalKm = trip.endKm > 0 ? trip.endKm - trip.startKm : 0;
    const totalReceived = trip.receivedPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceToReceive = totalFreight - totalReceived;
    const totalLiters = trip.fueling.reduce((sum, f) => sum + f.liters, 0);
    const fuelEfficiency = totalLiters > 0 && totalKm > 0 ? (totalKm / totalLiters).toFixed(2) : 'N/A';
    const trechoMetrics = calculateTrechoMetrics(trip.trechos, totalLiters, totalKm);

    return { totalFreight, totalExpenses, totalOtherExpenses, totalFueling, driverCommission, netBalance, totalKm, totalReceived, balanceToReceive, fuelEfficiency, trechoMetrics };
}

export const TripDetails: React.FC<{ tripId: string, setView: (view: any) => void }> = ({ tripId, setView }) => {
    const { trips, getTrip, getDriver, getVehicle, updateTrip } = useTrips();
    const { showNotification } = useNotification();
    const trip = getTrip(tripId);
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    const [newExpense, setNewExpense] = useState<Omit<Expense, 'id'>>({
        category: ExpenseCategory.OTHER,
        description: '',
        amount: 0,
        date: today,
    });
    
    const [newReceivedPayment, setNewReceivedPayment] = useState<Omit<ReceivedPayment, 'id'>>({
        type: ReceivedPaymentType.BALANCE,
        method: PaymentMethod.PIX,
        amount: 0,
        date: today,
    });

    const expenseDescSuggestions = [...new Set(trips.flatMap(t => t.expenses).map(e => e.description))];

    if (!trip) {
        return <Card><CardContent>Viagem não encontrada.</CardContent></Card>;
    }

    const driver = getDriver(trip.driverId);
    const vehicle = getVehicle(trip.vehicleId);
    const totals = calculateTotals(trip);

    const handleAddExpense = async () => {
        if (newExpense.description && newExpense.amount > 0) {
            const expenseToAdd: Expense = { ...newExpense, id: '' + Math.random() };
            const updatedTrip = { ...trip, expenses: [...trip.expenses, expenseToAdd] };
            await updateTrip(updatedTrip);
            setNewExpense({
                category: ExpenseCategory.OTHER,
                description: '',
                amount: 0,
                date: today,
            });
            showNotification('Despesa adicionada com sucesso!', 'success');
        } else {
            showNotification('Preencha a descrição e um valor maior que zero.', 'error');
        }
    };
    
    const handleAddReceivedPayment = async () => {
        if (newReceivedPayment.amount > 0) {
            const paymentToAdd: ReceivedPayment = { ...newReceivedPayment, id: '' + Math.random() };
            const updatedTrip = { ...trip, receivedPayments: [...trip.receivedPayments, paymentToAdd] };
            await updateTrip(updatedTrip);
            setNewReceivedPayment({
                type: ReceivedPaymentType.BALANCE,
                method: PaymentMethod.PIX,
                amount: 0,
                date: today,
            });
            showNotification('Recebimento adicionado com sucesso!', 'success');
        } else {
            showNotification('Por favor, preencha um valor maior que zero.', 'error');
        }
    };


    const handleRemoveExpense = async (expenseId: string) => {
        const updatedTrip = { ...trip, expenses: trip.expenses.filter(e => e.id !== expenseId) };
        await updateTrip(updatedTrip);
    };
    
    const handleRemoveFueling = async (fuelingId: string) => {
        const updatedTrip = { ...trip, fueling: trip.fueling.filter(f => f.id !== fuelingId) };
        await updateTrip(updatedTrip);
    };
    
    const handleRemoveReceivedPayment = async (paymentId: string) => {
        const updatedTrip = { ...trip, receivedPayments: trip.receivedPayments.filter(p => p.id !== paymentId) };
        await updateTrip(updatedTrip);
    };


    const handleSign = async () => {
        const signedTrip = {
            ...trip,
            signature: {
                date: new Date().toISOString(),
                confirmed: true,
            },
        };
        await updateTrip(signedTrip);
    };

    return (
        <div>
            <style>
                {`
                @media print {
                    #trip-details-header, #add-expense-section, #add-received-payment-section, .remove-btn, .no-print {
                        display: none !important;
                    }
                    .printable-card {
                        background-color: white !important;
                        box-shadow: none !important;
                        border: 1px solid #e5e7eb;
                    }
                }
                `}
            </style>
            <div id="trip-details-header" className="flex justify-between items-center mb-4">
                <Button onClick={() => setView({type: 'tripList'})}>
                    &larr; Voltar para Lista de Viagens
                </Button>
                <div className="flex gap-2">
                    <Button onClick={() => setView({ type: 'editTrip', tripId: trip.id })} variant="secondary">
                        <ICONS.pencil className="w-4 h-4 mr-2" />
                        Editar Viagem
                    </Button>
                    <Button onClick={() => window.print()} variant="secondary">
                        <ICONS.printer className="w-4 h-4 mr-2" />
                        Imprimir Acerto
                    </Button>
                </div>
            </div>

            <Card className="printable-card">
                <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <CardTitle>Acerto da Viagem: {trip.origin} para {trip.destination} {trip.monthlyTripNumber ? `(${trip.monthlyTripNumber}ª do Mês)` : ''}</CardTitle>
                            <p className="text-slate-400 mt-1">{driver?.name} | {vehicle?.plate}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Card className="bg-slate-900 printable-card">
                             <CardContent>
                                <Section title="Resumo Financeiro">
                                    <InfoItem label="Total Frete (Receita)" value={totals.totalFreight} isCurrency />
                                    <InfoItem label="Total Recebido" value={totals.totalReceived} isCurrency />
                                    <div className="flex justify-between items-center py-2 text-sm">
                                        <span className="text-slate-400">Saldo a Receber</span>
                                        <span className={`font-medium ${totals.balanceToReceive > 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(totals.balanceToReceive)}</span>
                                    </div>
                                    <hr className="border-slate-700 my-2" />
                                    <InfoItem label="Total Combustível" value={totals.totalFueling} isCurrency />
                                    <InfoItem label="Total Outras Despesas" value={totals.totalOtherExpenses} isCurrency />
                                    <InfoItem label={`Comissão Motorista (${trip.driverCommissionRate}%)`} value={totals.driverCommission} isCurrency />
                                    <hr className="border-slate-700 my-2" />
                                    <div className="flex justify-between items-center py-2 text-lg">
                                        <span className="font-bold text-slate-300">LUCRO LÍQUIDO DA VIAGEM</span>
                                        <span className={`font-bold ${totals.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(totals.netBalance)}</span>
                                    </div>
                                     <p className="text-right text-xs text-slate-500 -mt-2">(Frete Bruto - Despesas - Comissão)</p>
                                </Section>
                            </CardContent>
                        </Card>

                        {trip.trechos && trip.trechos.length > 0 && (
                            <Card className="bg-slate-900 printable-card">
                                <CardContent>
                                    <Section title="Análise de Consumo por Trecho">
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-slate-800 p-3 rounded-lg">
                                                <p className="text-xs text-slate-400 mb-1">KM Carregado</p>
                                                <p className="text-2xl font-bold text-yellow-400">{totals.trechoMetrics.kmCarregado}</p>
                                                <p className="text-xs text-slate-500">km</p>
                                            </div>
                                            <div className="bg-slate-800 p-3 rounded-lg">
                                                <p className="text-xs text-slate-400 mb-1">KM Vazio</p>
                                                <p className="text-2xl font-bold text-blue-400">{totals.trechoMetrics.kmVazio}</p>
                                                <p className="text-xs text-slate-500">km</p>
                                            </div>
                                            <div className="bg-slate-800 p-3 rounded-lg">
                                                <p className="text-xs text-slate-400 mb-1">Litros Carregado</p>
                                                <p className="text-2xl font-bold text-yellow-300">{totals.trechoMetrics.litrosCarregado.toFixed(2)}</p>
                                                <p className="text-xs text-slate-500">L</p>
                                            </div>
                                            <div className="bg-slate-800 p-3 rounded-lg">
                                                <p className="text-xs text-slate-400 mb-1">Litros Vazio</p>
                                                <p className="text-2xl font-bold text-blue-300">{totals.trechoMetrics.litrosVazio.toFixed(2)}</p>
                                                <p className="text-xs text-slate-500">L</p>
                                            </div>
                                        </div>
                                        <hr className="border-slate-700 my-4" />
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                                                <span className="text-sm font-medium text-yellow-300">Média Carregado</span>
                                                <span className="text-lg font-bold text-yellow-300">{totals.trechoMetrics.mediaCarregado.toFixed(2)} km/l</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                                                <span className="text-sm font-medium text-blue-300">Média Vazio</span>
                                                <span className="text-lg font-bold text-blue-300">{totals.trechoMetrics.mediaVazio.toFixed(2)} km/l</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded border border-green-500/30">
                                                <span className="text-sm font-medium text-green-300">Média Geral</span>
                                                <span className="text-lg font-bold text-green-300">{totals.trechoMetrics.mediaGeral.toFixed(2)} km/l</span>
                                            </div>
                                        </div>
                                    </Section>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="bg-slate-900 printable-card">
                            <CardContent>
                                <Section title="Controle de Recebimentos">
                                     <div className="space-y-1 mb-4">
                                        {trip.receivedPayments.length > 0 ? trip.receivedPayments.map(p => (
                                            <div key={p.id} className="flex justify-between items-center py-1.5 px-2 bg-slate-800/50 rounded-md">
                                                <span className="text-sm text-slate-300">{p.type} ({p.method}) - {new Date(p.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-green-400">{formatCurrency(p.amount)}</span>
                                                    <Button variant="danger" onClick={() => handleRemoveReceivedPayment(p.id)} className="p-1 h-6 w-6 remove-btn">
                                                        <ICONS.trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )) : <p className="text-sm text-slate-500 text-center py-2">Nenhum recebimento registrado.</p>}
                                    </div>
                                    <hr className="border-slate-700 my-2" />
                                    <InfoItem label="Total Recebido" value={totals.totalReceived} isCurrency />
                                    
                                    <div id="add-received-payment-section" className="border-t border-slate-700 mt-4 pt-4">
                                         <h4 className="text-md font-semibold text-white mb-2">Adicionar Recebimento</h4>
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Select id="recType" label="Tipo" value={newReceivedPayment.type} onChange={e => setNewReceivedPayment(p => ({ ...p, type: e.target.value as ReceivedPaymentType }))}>
                                                {RECEIVED_PAYMENT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </Select>
                                            <Select id="recMethod" label="Forma Pgto." value={newReceivedPayment.method} onChange={e => setNewReceivedPayment(p => ({ ...p, method: e.target.value as PaymentMethod }))}>
                                                {PAYMENT_METHODS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </Select>
                                            <Input id="recDate" label="Data" type="date" value={newReceivedPayment.date} onChange={e => setNewReceivedPayment(p => ({ ...p, date: e.target.value }))} />
                                            <Input id="recAmount" label="Valor (R$)" type="number" step="0.01" value={newReceivedPayment.amount || ''} onChange={e => setNewReceivedPayment(p => ({ ...p, amount: e.target.valueAsNumber || 0 }))} />
                                        </div>
                                        <Button onClick={handleAddReceivedPayment} className="mt-4 w-full" variant="secondary">Adicionar Recebimento</Button>
                                    </div>
                                </Section>
                            </CardContent>
                        </Card>


                         <Card className="bg-slate-900 printable-card">
                             <CardContent>
                                <Section title="Detalhes dos Abastecimentos">
                                    <div className="space-y-1">
                                        {trip.fueling.length > 0 ? trip.fueling.map(fuel => (
                                            <div key={fuel.id} className="flex justify-between items-center py-1.5 px-2 bg-slate-800/50 rounded-md">
                                                <span className="text-sm text-slate-300">{fuel.station} ({fuel.liters}L)</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-white">{formatCurrency(fuel.totalAmount)}</span>
                                                    <Button variant="danger" onClick={() => handleRemoveFueling(fuel.id)} className="p-1 h-6 w-6 remove-btn">
                                                        <ICONS.trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )) : <p className="text-sm text-slate-500 text-center py-2">Nenhum abastecimento registrado.</p>}
                                    </div>
                                    <hr className="border-slate-700 my-2" />
                                    <InfoItem label="Total Combustível" value={totals.totalFueling} isCurrency />
                                </Section>
                             </CardContent>
                        </Card>
                        
                        <Card className="bg-slate-900 printable-card">
                             <CardContent>
                                <Section title="Detalhes das Outras Despesas">
                                    <div className="space-y-1">
                                        {trip.expenses.length > 0 ? trip.expenses.map(exp => (
                                            <div key={exp.id} className="flex justify-between items-center py-1.5 px-2 bg-slate-800/50 rounded-md">
                                                <span className="text-sm text-slate-300">{exp.category}: {exp.description}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-white">{formatCurrency(exp.amount)}</span>
                                                    <Button variant="danger" onClick={() => handleRemoveExpense(exp.id)} className="p-1 h-6 w-6 remove-btn">
                                                        <ICONS.trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )) : <p className="text-sm text-slate-500 text-center py-2">Nenhuma outra despesa registrada.</p>}
                                    </div>
                                    <hr className="border-slate-700 my-2" />
                                    <InfoItem label="Total Outras Despesas" value={totals.totalOtherExpenses} isCurrency />
                                </Section>
                             </CardContent>
                        </Card>

                        <Card id="add-expense-section" className="bg-slate-900 printable-card">
                           <CardContent>
                                <Section title="Adicionar Nova Despesa (Outras)">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Select id="expCat" label="Categoria" value={newExpense.category} onChange={e => setNewExpense(p => ({ ...p, category: e.target.value as ExpenseCategory }))}>
                                            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </Select>
                                        <Input id="expDate" label="Data" type="date" value={newExpense.date} onChange={e => setNewExpense(p => ({ ...p, date: e.target.value }))} />
                                        <AutocompleteInput 
                                            id="expDesc" 
                                            label="Descrição" 
                                            value={newExpense.description} 
                                            onChange={e => setNewExpense(p => ({ ...p, description: e.target.value.toUpperCase() }))}
                                            suggestions={expenseDescSuggestions}
                                        />
                                        <Input id="expAmount" label="Valor (R$)" type="number" step="0.01" value={newExpense.amount || ''} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.valueAsNumber || 0 }))} />
                                    </div>
                                    <Button onClick={handleAddExpense} className="mt-4 w-full" variant="secondary">Adicionar Despesa</Button>
                                </Section>
                           </CardContent>
                        </Card>

                    </div>
                    <div className="md:col-span-1 space-y-4">
                        <Card className="bg-slate-900 printable-card">
                            <CardContent>
                                <Section title="Informações da Viagem">
                                    <InfoItem label="KM Rodados" value={`${totals.totalKm} km`} />
                                    <InfoItem label="Média de Consumo" value={totals.fuelEfficiency !== 'N/A' ? `${totals.fuelEfficiency} km/L` : 'N/A'} />
                                    <InfoItem label="Data Início" value={new Date(trip.startDate + 'T00:00:00').toLocaleDateString('pt-BR')} />
                                    <InfoItem label="Data Fim" value={trip.endDate ? new Date(trip.endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'} />
                                </Section>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 printable-card">
                            <CardContent>
                                <Section title="Confirmação do Motorista">
                                    {trip.signature?.confirmed ? (
                                        <div className="text-center p-4 bg-green-900/50 border border-green-700 rounded-lg">
                                            <p className="font-bold text-green-400">Acerto Confirmado</p>
                                            <p className="text-sm text-slate-300">
                                                em {new Date(trip.signature.date).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div id="signature-action" className="text-center p-4">
                                            <p className="text-slate-400 mb-4">Aguardando confirmação do motorista para finalizar o acerto.</p>
                                            <Button onClick={handleSign} className="w-full no-print">
                                                Confirmar Acerto
                                            </Button>
                                        </div>
                                    )}
                                </Section>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
