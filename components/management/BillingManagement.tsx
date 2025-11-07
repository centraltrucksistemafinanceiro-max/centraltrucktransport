import React, { useState, useMemo } from 'react';
import { useTrips } from '../../context/TripContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ICONS } from '../../constants';
import { Button } from '../ui/Button';

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const StatCard: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = '' }) => (
    <div className={`bg-slate-800 p-4 rounded-lg ${className}`}>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

export const BillingManagement: React.FC = () => {
    const { trips, fixedExpenses, workshopExpenses, getDriver, getVehicle, vehicles } = useTrips();
    
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    });
    
    const [selectedVehicleId, setSelectedVehicleId] = useState('');

    const reportData = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);

        const monthlyTrips = trips.filter(trip => {
            if (selectedVehicleId && trip.vehicleId !== selectedVehicleId) {
                return false;
            }
            const tripDate = new Date(trip.startDate + 'T00:00:00');
            return tripDate.getFullYear() === year && tripDate.getMonth() + 1 === month;
        });

        const grossRevenue = monthlyTrips.reduce((sum, trip) => {
            return sum + trip.cargo.reduce((cargoSum, c) => cargoSum + (c.weight * c.pricePerTon), 0);
        }, 0);
        
        const netRevenue = monthlyTrips.reduce((sum, trip) => {
            const totalFreight = trip.cargo.reduce((cargoSum, c) => cargoSum + (c.weight * c.pricePerTon) - (c.tax || 0), 0);
            const totalFueling = trip.fueling.reduce((fuelSum, f) => fuelSum + f.totalAmount, 0);
            const totalOtherExpenses = trip.expenses.reduce((expSum, e) => expSum + e.amount, 0);
            const totalTripExpenses = totalFueling + totalOtherExpenses;
            const driverCommission = (totalFreight * trip.driverCommissionRate) / 100;
            const tripNetProfit = totalFreight - driverCommission - totalTripExpenses;
            return sum + tripNetProfit;
        }, 0);

        const allFixedExpenses = selectedVehicleId 
            ? fixedExpenses.filter(e => e.vehicleId === selectedVehicleId) 
            : fixedExpenses;
            
        const allWorkshopExpenses = selectedVehicleId
            ? workshopExpenses.filter(e => e.vehicleId === selectedVehicleId)
            : workshopExpenses;

        const monthlyFixedExpenses = allFixedExpenses
            .filter(expense => expense.firstPaymentDate.startsWith(selectedMonth))
            .reduce((sum, expense) => sum + expense.totalAmount, 0);

        const monthlyWorkshopExpenses = allWorkshopExpenses
            .filter(expense => expense.firstPaymentDate.startsWith(selectedMonth))
            .reduce((sum, expense) => sum + expense.totalAmount, 0);
            
        const finalProfit = netRevenue - monthlyFixedExpenses - monthlyWorkshopExpenses;
        
        // --- Vehicle Breakdown Logic ---
        const vehicleBreakdownMap = new Map<string, {
            grossRevenue: number;
            netRevenue: number;
            fixedExpenses: number;
            workshopExpenses: number;
            totalKm: number;
            totalLiters: number;
        }>();

        monthlyTrips.forEach(trip => {
            let stats = vehicleBreakdownMap.get(trip.vehicleId);
            if (!stats) {
                stats = { grossRevenue: 0, netRevenue: 0, workshopExpenses: 0, fixedExpenses: 0, totalKm: 0, totalLiters: 0 };
                vehicleBreakdownMap.set(trip.vehicleId, stats);
            }
            
            const tripGrossRevenue = trip.cargo.reduce((sum, c) => sum + (c.weight * c.pricePerTon), 0);
            const totalFreight = trip.cargo.reduce((cargoSum, c) => cargoSum + (c.weight * c.pricePerTon) - (c.tax || 0), 0);
            const totalFueling = trip.fueling.reduce((fuelSum, f) => fuelSum + f.totalAmount, 0);
            const totalOtherExpenses = trip.expenses.reduce((expSum, e) => expSum + e.amount, 0);
            const totalTripExpenses = totalFueling + totalOtherExpenses;
            const driverCommission = (totalFreight * trip.driverCommissionRate) / 100;
            const tripNetProfit = totalFreight - driverCommission - totalTripExpenses;

            stats.grossRevenue += tripGrossRevenue;
            stats.netRevenue += tripNetProfit;
            stats.totalKm += trip.endKm > 0 ? trip.endKm - trip.startKm : 0;
            stats.totalLiters += trip.fueling.reduce((sum, f) => sum + f.liters, 0);
        });

        fixedExpenses.forEach(expense => {
            if (expense.firstPaymentDate.startsWith(selectedMonth)) {
                let stats = vehicleBreakdownMap.get(expense.vehicleId);
                 if (!stats) {
                    stats = { grossRevenue: 0, netRevenue: 0, workshopExpenses: 0, fixedExpenses: 0, totalKm: 0, totalLiters: 0 };
                    vehicleBreakdownMap.set(expense.vehicleId, stats);
                }
                stats.fixedExpenses += expense.totalAmount;
            }
        });
        
        workshopExpenses.forEach(expense => {
             if (expense.firstPaymentDate.startsWith(selectedMonth)) {
                let stats = vehicleBreakdownMap.get(expense.vehicleId);
                 if (!stats) {
                    stats = { grossRevenue: 0, netRevenue: 0, workshopExpenses: 0, fixedExpenses: 0, totalKm: 0, totalLiters: 0 };
                    vehicleBreakdownMap.set(expense.vehicleId, stats);
                }
                stats.workshopExpenses += expense.totalAmount;
            }
        });

        const vehicleBreakdown = Array.from(vehicleBreakdownMap.entries()).map(([vehicleId, stats]) => {
            const vehicle = getVehicle(vehicleId);
            const fuelEfficiency = stats.totalLiters > 0 && stats.totalKm > 0 ? (stats.totalKm / stats.totalLiters).toFixed(2) : 'N/A';
            return {
                vehicleId,
                vehiclePlate: vehicle?.plate || 'Desconhecido',
                vehicleModel: vehicle?.model || '',
                ...stats,
                finalProfit: stats.netRevenue - stats.workshopExpenses - stats.fixedExpenses,
                fuelEfficiency,
            };
        }).sort((a, b) => b.finalProfit - a.finalProfit);


        return {
            grossRevenue,
            netRevenue,
            monthlyFixedExpenses,
            monthlyWorkshopExpenses,
            finalProfit,
            monthlyTrips,
            vehicleBreakdown,
        };
    }, [selectedMonth, selectedVehicleId, trips, fixedExpenses, workshopExpenses, getVehicle]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <CardTitle>Faturamento Mensal</CardTitle>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 no-print">
                            <label htmlFor="month-selector" className="text-sm font-medium text-slate-300">Mês:</label>
                            <input
                                type="month"
                                id="month-selector"
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                                className="bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                         <div className="flex items-center gap-2 no-print">
                            <label htmlFor="vehicle-selector" className="text-sm font-medium text-slate-300">Veículo:</label>
                            <select
                                id="vehicle-selector"
                                value={selectedVehicleId}
                                onChange={e => setSelectedVehicleId(e.target.value)}
                                className="bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">Todos os Veículos</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.plate}</option>
                                ))}
                            </select>
                        </div>
                        <Button onClick={() => window.print()} variant="secondary" className="no-print">
                            <ICONS.printer className="w-4 h-4 mr-2" />
                            Imprimir Relatório
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard label="Faturamento Bruto" value={formatCurrency(reportData.grossRevenue)} />
                    <StatCard label="Lucro Líquido (Viagens)" value={formatCurrency(reportData.netRevenue)} className="bg-slate-800" />
                    <StatCard label="Despesas (Mês)" value={formatCurrency(reportData.monthlyFixedExpenses)} className="bg-red-900/40" />
                    <StatCard label="Despesas Oficina (Mês)" value={formatCurrency(reportData.monthlyWorkshopExpenses)} className="bg-red-900/40" />
                    <StatCard label="Resultado Final" value={formatCurrency(reportData.finalProfit)} className={reportData.finalProfit >= 0 ? "bg-green-900/40" : "bg-red-900/40"} />
                </div>
                
                {!selectedVehicleId && (
                <div>
                    <h3 className="text-xl font-semibold text-white mt-8 mb-4">Faturamento por Veículo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reportData.vehicleBreakdown.length > 0 ? reportData.vehicleBreakdown.map(v => (
                            <div key={v.vehicleId} className="bg-slate-700 p-4 rounded-lg">
                                <p className="font-bold text-lg text-white">{v.vehiclePlate}</p>
                                <p className="text-sm text-slate-400 mb-3">{v.vehicleModel}</p>
                                
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-300">Faturamento Bruto</span>
                                        <span className="font-semibold text-white">{formatCurrency(v.grossRevenue)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-300">Lucro Líquido (Viagens)</span>
                                        <span className="font-semibold text-white">{formatCurrency(v.netRevenue)}</span>
                                    </div>
                                     <div className="flex justify-between">
                                        <span className="text-slate-300">Despesas</span>
                                        <span className="font-semibold text-red-400">-{formatCurrency(v.fixedExpenses)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-300">Despesas Oficina</span>
                                        <span className="font-semibold text-red-400">-{formatCurrency(v.workshopExpenses)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-300">Média de Consumo</span>
                                        <span className="font-semibold text-white">{v.fuelEfficiency} {v.fuelEfficiency !== 'N/A' && 'km/L'}</span>
                                    </div>
                                    <hr className="border-slate-600 my-1" />
                                    <div className="flex justify-between font-bold text-base">
                                        <span className="text-slate-200">Resultado do Veículo</span>
                                        <span className={v.finalProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                                            {formatCurrency(v.finalProfit)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-slate-400 text-center py-4 md:col-span-2">Nenhum dado de veículo para este mês.</p>
                        )}
                    </div>
                </div>
                )}

                <div>
                    <h3 className="text-lg font-semibold text-white mt-8 mb-3">Viagens Realizadas no Mês</h3>
                    <div className="space-y-3">
                        {reportData.monthlyTrips.length > 0 ? reportData.monthlyTrips.map(trip => {
                            const driver = getDriver(trip.driverId);
                            const vehicle = getVehicle(trip.vehicleId);
                            const tripGrossRevenue = trip.cargo.reduce((sum, c) => sum + (c.weight * c.pricePerTon), 0);
                            return (
                                <div key={trip.id} className="bg-slate-700 p-3 rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-white">{trip.origin} &rarr; {trip.destination}</p>
                                        <p className="text-sm text-slate-400">{driver?.name} | {vehicle?.plate} | Início: {new Date(trip.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    <p className="font-bold text-lg text-white">{formatCurrency(tripGrossRevenue)}</p>
                                </div>
                            )
                        }) : (
                            <p className="text-slate-400 text-center py-4">Nenhuma viagem encontrada para este mês.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};