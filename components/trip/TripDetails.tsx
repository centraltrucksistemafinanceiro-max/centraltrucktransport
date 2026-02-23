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
                    #trip-details-header, #add-expense-section, #add-received-payment-section, .remove-btn, .no-print, #signature-action {
                        display: none !important;
                    }
                    .printable-card {
                        background-color: white !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        color: black !important;
                    }
                    .printable-card * {
                        color: black !important;
                        border-color: #ddd !important;
                        background-color: transparent !important;
                    }
                    /* Headers */
                    .print-header {
                        display: block !important;
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }
                    .print-header h1 {
                        font-size: 20pt;
                        font-bold: true;
                        margin: 0;
                    }
                    .print-header p {
                        font-size: 10pt;
                        margin: 2px 0;
                    }
                    /* Sections */
                    .print-section-title {
                        font-size: 12pt !important;
                        font-weight: bold !important;
                        background-color: #f3f4f6 !important;
                        padding: 4px 8px !important;
                        margin-top: 15px !important;
                        margin-bottom: 8px !important;
                        border: 1px solid #ccc !important;
                        color: black !important;
                    }
                    /* Tables */
                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10pt;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid #ddd;
                        padding: 6px;
                        text-align: left;
                    }
                    .print-table th {
                        background-color: #f9fafb !important;
                    }
                    /* Totals */
                    .print-total-row {
                        font-weight: bold;
                        font-size: 11pt;
                    }
                    .print-grand-total {
                        font-size: 14pt !important;
                        padding: 10px !important;
                        border: 2px solid #000 !important;
                        margin-top: 20px !important;
                        text-align: center !important;
                    }
                    /* Grid adjustments */
                    .card-content-grid {
                        display: block !important;
                    }
                    .md\\:col-span-2, .md\\:col-span-1 {
                        width: 100% !important;
                    }
                    /* Hide unnecessary gaps */
                    .gap-6 {
                        gap: 0 !important;
                    }
                }
                .print-header { display: none; }
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

            <Card className="printable-card overflow-hidden">
                {/* Print Only Header */}
                <div className="print-header">
                    <h1>CENTRAL TRUCK</h1>
                    <p>Comprovante de Acerto de Viagem</p>
                    <p>Emissão: {new Date().toLocaleString('pt-BR')}</p>
                </div>

                <CardHeader className="border-b border-slate-700/50 pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                            <CardTitle className="text-xl md:text-2xl">
                                Acerto: {trip.origin} &larr;&rarr; {trip.destination}
                            </CardTitle>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-slate-400 text-sm">
                                <span className="flex items-center gap-1.5"><ICONS.driver className="w-4 h-4" /> {driver?.name}</span>
                                <span className="flex items-center gap-1.5"><ICONS.truck className="w-4 h-4" /> {vehicle?.plate}</span>
                                {trip.monthlyTripNumber && <span className="text-blue-400 font-semibold">{trip.monthlyTripNumber}ª Viagem do Mês</span>}
                            </div>
                        </div>
                        <div className="hidden md:block text-right">
                             <p className="text-xs text-slate-500">ID: {trip.id.slice(0,8)}</p>
                             <div className={`mt-1 px-3 py-1 rounded-full text-xs font-bold inline-block ${trip.signature?.confirmed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                {trip.signature?.confirmed ? 'FINALIZADO' : 'EM ABERTO'}
                             </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 card-content-grid">
                    <div className="md:col-span-2 space-y-8">
                        
                        {/* Summary Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 print-section-title">
                                <ICONS.bank className="w-5 h-5 text-blue-400 no-print" /> 
                                Resumo Financeiro
                            </h3>
                            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 space-y-3">
                                <InfoItem label="Total Frete (Receita Bruta)" value={totals.totalFreight} isCurrency />
                                <InfoItem label="Total Recebido (Adiantamentos/Saldos)" value={totals.totalReceived} isCurrency />
                                <div className="flex justify-between items-center py-2 text-sm border-t border-slate-700/50 mt-1">
                                    <span className="text-slate-400 font-medium">Saldo pendente de recebimento</span>
                                    <span className={`text-lg font-bold ${totals.balanceToReceive > 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(totals.balanceToReceive)}</span>
                                </div>
                                <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-700/50">
                                    <div className="p-3 bg-slate-900/50 rounded-lg">
                                        <p className="text-xs text-slate-400 mb-1">Combustível</p>
                                        <p className="text-sm font-semibold">{formatCurrency(totals.totalFueling)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-900/50 rounded-lg">
                                        <p className="text-xs text-slate-400 mb-1">Outras Despesas</p>
                                        <p className="text-sm font-semibold">{formatCurrency(totals.totalOtherExpenses)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-900/50 rounded-lg">
                                        <p className="text-xs text-slate-400 mb-1">Comissão ({trip.driverCommissionRate}%)</p>
                                        <p className="text-sm font-semibold">{formatCurrency(totals.driverCommission)}</p>
                                    </div>
                                </div>
                                <div className="pt-6 flex flex-col items-center justify-center bg-blue-600/10 border-2 border-blue-500/20 rounded-xl p-4 mt-2 print-grand-total">
                                    <span className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1">Lucro Líquido da Operação</span>
                                    <span className={`text-2xl font-black ${totals.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(totals.netBalance)}
                                    </span>
                                </div>

                                {/* Detailed Calculation Breakdown */}
                                <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 no-print">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <ICONS.info className="w-3 h-3" />
                                        Como foi calculado?
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between items-center text-slate-300">
                                            <span>(+) Total Frete (Receita)</span>
                                            <span className="font-medium">{formatCurrency(totals.totalFreight)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-red-400/80">
                                            <span>(-) Comissão Motorista ({trip.driverCommissionRate}%)</span>
                                            <span className="font-medium">{formatCurrency(totals.driverCommission)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-red-400/80">
                                            <span>(-) Combustível Total</span>
                                            <span className="font-medium">{formatCurrency(totals.totalFueling)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-red-400/80">
                                            <span>(-) Outras Despesas</span>
                                            <span className="font-medium">{formatCurrency(totals.totalOtherExpenses)}</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-700 flex justify-between items-center font-bold text-sm text-white">
                                            <span>(=) Resultado da Viagem</span>
                                            <span className={totals.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                {formatCurrency(totals.netBalance)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cargo Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 print-section-title">
                                <ICONS.trip className="w-5 h-5 text-blue-400 no-print" /> 
                                Detalhamento de Cargas
                            </h3>
                            <table className="print-table w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-800 text-slate-300 text-left">
                                        <th className="p-3 rounded-tl-lg">Tipo da Carga</th>
                                        <th className="p-3">Peso</th>
                                        <th className="p-3">Valor/t</th>
                                        <th className="p-3">Imposto</th>
                                        <th className="p-3 text-right rounded-tr-lg">Total Líquido</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trip.cargo.length > 0 ? trip.cargo.map(cargo => (
                                        <tr key={cargo.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                                            <td className="p-3 text-white">{cargo.type}</td>
                                            <td className="p-3">{cargo.weight}t</td>
                                            <td className="p-3">{formatCurrency(cargo.pricePerTon)}</td>
                                            <td className="p-3 text-red-400">{cargo.tax ? formatCurrency(cargo.tax) : '-'}</td>
                                            <td className="p-3 text-right font-bold text-white">{formatCurrency((cargo.weight * cargo.pricePerTon) - (cargo.tax || 0))}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="p-6 text-center text-slate-500 italic">Nenhuma carga registrada</td></tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-800/50 font-bold">
                                    <tr>
                                        <td colSpan={4} className="p-3 text-right text-slate-400">TOTAL FRETE:</td>
                                        <td className="p-3 text-right text-green-400 text-lg">{formatCurrency(totals.totalFreight)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Expenses Section */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-md font-bold text-white flex items-center gap-2 print-section-title">Combustível</h3>
                                <table className="print-table w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-slate-400 border-b border-slate-700">
                                            <th className="pb-2">Posto / Local</th>
                                            <th className="pb-2">Litrarem</th>
                                            <th className="pb-2 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trip.fueling.map(fuel => (
                                            <tr key={fuel.id} className="border-b border-slate-800/50">
                                                <td className="py-2 text-slate-300">
                                                    <div className="font-medium text-white">{fuel.station}</div>
                                                    <div className="text-[10px]">{fuel.km} km</div>
                                                </td>
                                                <td className="py-2">{fuel.liters} L</td>
                                                <td className="py-2 text-right font-medium">{formatCurrency(fuel.totalAmount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-md font-bold text-white flex items-center gap-2 print-section-title">Outras Despesas</h3>
                                <table className="print-table w-full text-xs">
                                    <thead>
                                        <tr className="text-left text-slate-400 border-b border-slate-700">
                                            <th className="pb-2">Descrição</th>
                                            <th className="pb-2 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trip.expenses.map(exp => (
                                            <tr key={exp.id} className="border-b border-slate-800/50">
                                                <td className="py-2 text-slate-300">
                                                    <div className="font-medium text-white">{exp.description}</div>
                                                    <div className="text-[10px] uppercase text-slate-500">{exp.category}</div>
                                                </td>
                                                <td className="py-2 text-right font-medium">{formatCurrency(exp.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Signatures for Print */}
                        <div className="hidden print:grid grid-cols-2 gap-20 mt-20 pt-10 border-t border-slate-300">
                            <div className="text-center">
                                <div className="border-t border-black w-full mb-2"></div>
                                <p className="text-sm font-bold">{driver?.name}</p>
                                <p className="text-xs">Motorista</p>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-black w-full mb-2"></div>
                                <p className="text-sm font-bold">CENTRAL TRUCK</p>
                                <p className="text-xs">Responsável</p>
                            </div>
                        </div>

                    </div>

                    {/* Sidebar Information */}
                    <div className="space-y-6">
                        <section className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 space-y-4">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider print-section-title">Dados da Viagem</h3>
                            <div className="space-y-2">
                                <InfoItem label="Início" value={new Date(trip.startDate + 'T00:00:00').toLocaleDateString('pt-BR')} />
                                <InfoItem label="Fim" value={trip.endDate ? new Date(trip.endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Em curso'} />
                                <hr className="border-slate-700/50 my-1" />
                                <InfoItem label="KM Inicial" value={`${trip.startKm} km`} />
                                <InfoItem label="KM Final" value={trip.endKm > 0 ? `${trip.endKm} km` : '-'} />
                                <InfoItem label="KM Rodados" value={`${totals.totalKm} km`} />
                                <hr className="border-slate-700/50 my-1" />
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-xs text-slate-400">Média Geral</span>
                                    <span className="text-md font-bold text-green-400">{totals.fuelEfficiency} km/L</span>
                                </div>
                            </div>
                        </section>

                        <section className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 space-y-4">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider print-section-title">Pagamentos Recebidos</h3>
                            <div className="space-y-1">
                                {trip.receivedPayments.map(p => (
                                    <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-0">
                                        <div className="text-[11px]">
                                            <div className="text-white font-medium">{p.type}</div>
                                            <div className="text-slate-500">{p.method} | {new Date(p.date + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                                        </div>
                                        <span className="text-sm font-bold text-green-400">{formatCurrency(p.amount)}</span>
                                    </div>
                                ))}
                            </div>
                            <div id="add-received-payment-section" className="pt-4 border-t border-slate-700">
                                <Button variant="secondary" className="w-full text-xs py-1 h-auto" onClick={() => setView({type: 'viewTrip', tripId: trip.id})}>
                                    Gerenciar Recebimentos
                                </Button>
                            </div>
                        </section>

                        <section className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 space-y-4 no-print">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Status do Acerto</h3>
                            {trip.signature?.confirmed ? (
                                <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <p className="font-bold text-green-400 text-sm">Confirmado</p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {new Date(trip.signature.date).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            ) : (
                                <div id="signature-action" className="text-center">
                                    <Button onClick={handleSign} className="w-full text-sm">
                                        Confirmar Acerto
                                    </Button>
                                </div>
                            )}
                        </section>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
