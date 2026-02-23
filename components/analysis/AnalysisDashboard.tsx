import React, { useState, useMemo } from 'react';
import { useTrips } from '../../context/TripContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { LineChart } from '../charts/LineChart';
import { FixedExpense, WorkshopExpense } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { ICONS } from '../../constants';
import { calculateTrechoMetrics } from '../../utils/tripMetrics';

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const KPICard: React.FC<{ title: string; value: number; colorClass?: string; tooltipText: string }> = ({ title, value, colorClass = 'text-white', tooltipText }) => (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-1.5 mb-1">
            <p className="text-sm text-slate-400">{title}</p>
            <Tooltip text={tooltipText}>
                <ICONS.info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
            </Tooltip>
        </div>
        <p className={`text-2xl font-bold ${colorClass}`}>{formatCurrency(value)}</p>
    </div>
);


export const AnalysisDashboard: React.FC = () => {
    const { trips, fixedExpenses, workshopExpenses, getVehicle, vehicles } = useTrips();
    
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const formatToMonthString = (date: Date) => `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    const [selectedVehicleId, setSelectedVehicleId] = useState<string>(''); // '' means all
    const [startDate, setStartDate] = useState<string>(formatToMonthString(today));
    const [endDate, setEndDate] = useState<string>(formatToMonthString(today));

    const [lineTooltip, setLineTooltip] = useState<{ visible: boolean; data: any; x: number; y: number } | null>(null);

    const filteredData = useMemo(() => {
        const [startYear, startMonth] = startDate.split('-').map(Number);
        const [endYear, endMonth] = endDate.split('-').map(Number);
        
        // First day of start month, UTC
        const start = new Date(Date.UTC(startYear, startMonth - 1, 1));
        // Last day of end month, UTC, at the very end of the day
        const end = new Date(Date.UTC(endYear, endMonth, 0, 23, 59, 59, 999));
        
        const filteredTrips = trips.filter(trip => {
            // Treat stored dates as UTC to prevent timezone shifts
            const tripDate = new Date(`${trip.startDate}T00:00:00Z`);
            const vehicleMatch = !selectedVehicleId || trip.vehicleId === selectedVehicleId;
            const dateMatch = tripDate >= start && tripDate <= end;
            return vehicleMatch && dateMatch;
        });

        const getExpensesInRange = (expenses: (FixedExpense | WorkshopExpense)[]) => {
            const relevantExpenses: { date: Date, amount: number, vehicleId: string }[] = [];
            const source = selectedVehicleId ? expenses.filter(e => e.vehicleId === selectedVehicleId) : expenses;

            source.forEach(expense => {
                const installmentAmount = expense.totalAmount / expense.installments;
                const firstPaymentDate = new Date(`${expense.firstPaymentDate}T00:00:00Z`);

                for (let i = 0; i < expense.installments; i++) {
                    const paymentDate = new Date(firstPaymentDate);
                    // Use setUTCMonth for consistency across timezones
                    paymentDate.setUTCMonth(paymentDate.getUTCMonth() + i);

                    if (paymentDate >= start && paymentDate <= end) {
                        relevantExpenses.push({
                            date: paymentDate,
                            amount: installmentAmount,
                            vehicleId: expense.vehicleId,
                        });
                    }
                }
            });
            return relevantExpenses;
        };
        
        const filteredFixedExpenses = getExpensesInRange(fixedExpenses);
        const filteredWorkshopExpenses = getExpensesInRange(workshopExpenses);

        return { filteredTrips, filteredFixedExpenses, filteredWorkshopExpenses };
    }, [startDate, endDate, selectedVehicleId, trips, fixedExpenses, workshopExpenses]);

    const kpiData = useMemo(() => {
        const totalRevenue = filteredData.filteredTrips.reduce((sum, trip) => {
            return sum + trip.cargo.reduce((cargoSum, c) => cargoSum + (c.weight * c.pricePerTon), 0);
        }, 0);

        const tripCosts = filteredData.filteredTrips.reduce((sum, trip) => {
            const tripNetRevenue = trip.cargo.reduce((cargoSum, c) => cargoSum + (c.weight * c.pricePerTon) - (c.tax || 0), 0);
            const tripFueling = trip.fueling.reduce((fuelSum, f) => fuelSum + f.totalAmount, 0);
            const tripOtherExpenses = trip.expenses.reduce((expSum, e) => expSum + e.amount, 0);
            const driverCommission = (tripNetRevenue * trip.driverCommissionRate) / 100;
            return sum + tripFueling + tripOtherExpenses + driverCommission;
        }, 0);

        const totalFixedExpenses = filteredData.filteredFixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalWorkshopExpenses = filteredData.filteredWorkshopExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        const totalProfit = totalRevenue - tripCosts - totalFixedExpenses - totalWorkshopExpenses;

        return {
            totalRevenue,
            tripCosts,
            totalFixedExpenses,
            totalWorkshopExpenses,
            totalProfit
        };
    }, [filteredData]);

    const monthlyAnalysisData = useMemo(() => {
        const [startYear, startMonth] = startDate.split('-').map(Number);
        const [endYear, endMonth] = endDate.split('-').map(Number);

        const monthlyDataMap = new Map<string, { revenue: number; expenses: number }>();
        
        const finalMonth = new Date(Date.UTC(endYear, endMonth - 1, 1));
        let currentMonth = new Date(Date.UTC(startYear, startMonth - 1, 1));
        
        while (currentMonth <= finalMonth) {
            const key = `${currentMonth.getUTCFullYear()}-${(currentMonth.getUTCMonth() + 1).toString().padStart(2, '0')}`;
            monthlyDataMap.set(key, { revenue: 0, expenses: 0 });
            currentMonth.setUTCMonth(currentMonth.getUTCMonth() + 1);
        }

        filteredData.filteredTrips.forEach(trip => {
            const tripDate = new Date(`${trip.startDate}T00:00:00Z`);
            const key = `${tripDate.getUTCFullYear()}-${(tripDate.getUTCMonth() + 1).toString().padStart(2, '0')}`;
            const monthData = monthlyDataMap.get(key);

            if (monthData) {
                const tripGrossRevenue = trip.cargo.reduce((sum, c) => sum + (c.weight * c.pricePerTon), 0);
                const tripNetRevenue = trip.cargo.reduce((sum, c) => sum + (c.weight * c.pricePerTon) - (c.tax || 0), 0);
                const tripFueling = trip.fueling.reduce((sum, f) => sum + f.totalAmount, 0);
                const tripOtherExpenses = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
                const driverCommission = (tripNetRevenue * trip.driverCommissionRate) / 100;
                const totalTripExpenses = tripFueling + tripOtherExpenses + driverCommission;

                monthData.revenue += tripGrossRevenue;
                monthData.expenses += totalTripExpenses;
            }
        });

        [...filteredData.filteredFixedExpenses, ...filteredData.filteredWorkshopExpenses].forEach(expense => {
            const key = `${expense.date.getUTCFullYear()}-${(expense.date.getUTCMonth() + 1).toString().padStart(2, '0')}`;
            const monthData = monthlyDataMap.get(key);
            if (monthData) {
                monthData.expenses += expense.amount;
            }
        });

        const sortedKeys = Array.from(monthlyDataMap.keys()).sort();
        const labels: string[] = [];
        const revenue: number[] = [];
        const expenses: number[] = [];
        const profit: number[] = [];

        sortedKeys.forEach(key => {
            const data = monthlyDataMap.get(key)!;
            const [year, month] = key.split('-');
            labels.push(`${month}/${year.slice(2)}`);
            revenue.push(data.revenue);
            expenses.push(data.expenses);
            profit.push(data.revenue - data.expenses);
        });

        return { labels, revenue, expenses, profit };
    }, [filteredData, startDate, endDate]);
    
    const monthlyChartDatasets = [
        { label: 'Faturamento', data: monthlyAnalysisData.revenue, color: '#2DD4BF' },
        { label: 'Despesas', data: monthlyAnalysisData.expenses, color: '#FBBF24' },
        { label: 'Resultado Final', data: monthlyAnalysisData.profit, color: '#60A5FA' },
    ];

    const hasData = monthlyAnalysisData.labels.length > 0;

    return (
        <div className="space-y-6 relative">
             {lineTooltip?.visible && (
                <div 
                    className="absolute z-10 p-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl text-sm pointer-events-none"
                    style={{ left: lineTooltip.x, top: lineTooltip.y, transform: 'translate(-50%, -110%)' }}
                >
                    <p className="font-bold mb-2 text-white">{lineTooltip.data.index < monthlyAnalysisData.labels.length ? monthlyAnalysisData.labels[lineTooltip.data.index] : ''}</p>
                    {monthlyChartDatasets.map(ds => (
                         <div key={ds.label} className="flex justify-between items-center gap-4">
                            <div className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: ds.color }}></span>
                                <span className="text-slate-300">{ds.label}</span>
                            </div>
                            <span className="font-semibold text-white">{formatCurrency(ds.data[lineTooltip.data.index])}</span>
                        </div>
                    ))}
                </div>
            )}
           
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <CardTitle>Análise de Frota</CardTitle>
                        <div className="flex flex-wrap items-center gap-4">
                             <select
                                id="vehicle-selector"
                                value={selectedVehicleId}
                                onChange={e => setSelectedVehicleId(e.target.value)}
                                className="bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="">Todos os Veículos</option>
                                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate}</option>)}
                            </select>
                            <input
                                type="month"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                            <input
                                type="month"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="bg-slate-700 border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {hasData ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <KPICard 
                                    title="Faturamento Bruto" 
                                    value={kpiData.totalRevenue} 
                                    colorClass="text-green-400" 
                                    tooltipText="Soma do valor total do frete (peso x valor/tonelada) de todas as viagens no período, sem descontar impostos."
                                />
                                <KPICard 
                                    title="Custos de Viagem" 
                                    value={kpiData.tripCosts} 
                                    colorClass="text-yellow-400"
                                    tooltipText="Soma de todos os custos diretos da viagem: combustível, despesas de rota (pedágio, etc) e comissão do motorista."
                                />
                                <KPICard 
                                    title="Despesas Fixas" 
                                    value={kpiData.totalFixedExpenses} 
                                    colorClass="text-orange-400"
                                    tooltipText="Soma das parcelas de despesas fixas (pneus, seguro, etc.) com vencimento dentro do período selecionado."
                                />
                                <KPICard 
                                    title="Despesas Oficina" 
                                    value={kpiData.totalWorkshopExpenses} 
                                    colorClass="text-red-400"
                                    tooltipText="Soma das parcelas de despesas de oficina com vencimento dentro do período selecionado."
                                />
                                <KPICard 
                                  title="Resultado Final" 
                                  value={kpiData.totalProfit} 
                                  colorClass={kpiData.totalProfit >= 0 ? 'text-blue-400' : 'text-red-500'} 
                                  tooltipText="Resultado líquido da operação: Faturamento Bruto - (Custos de Viagem + Despesas Fixas + Despesas Oficina)."
                                />
                            </div>
                            
                            {/* Consumo por Trecho */}
                            {filteredData.filteredTrips.some(t => t.trechos && t.trechos.length > 0) && (
                                <div className="pt-6 border-t border-slate-700">
                                    <h3 className="text-lg font-semibold text-white mb-4">Análise de Consumo por Trecho</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {(() => {
                                            let totalKmCarregado = 0;
                                            let totalKmVazio = 0;
                                            let totalLiters = 0;
                                            let totalKm = 0;

                                            filteredData.filteredTrips.forEach(trip => {
                                                const tripTotalLiters = trip.fueling.reduce((sum, f) => sum + f.liters, 0);
                                                const tripTotalKm = trip.endKm > trip.startKm ? trip.endKm - trip.startKm : 0;
                                                const trechos = calculateTrechoMetrics(trip.trechos, tripTotalLiters, tripTotalKm);
                                                
                                                totalKmCarregado += trechos.kmCarregado;
                                                totalKmVazio += trechos.kmVazio;
                                                totalLiters += tripTotalLiters;
                                                totalKm += tripTotalKm;
                                            });

                                            const overallTrechos = calculateTrechoMetrics([], totalLiters, totalKm);

                                            return (
                                                <>
                                                    <div className="bg-slate-800 p-4 rounded-lg">
                                                        <p className="text-xs text-slate-400 mb-2">KM Carregado</p>
                                                        <p className="text-3xl font-bold text-yellow-400">{totalKmCarregado}</p>
                                                        <p className="text-xs text-slate-500">km</p>
                                                    </div>
                                                    <div className="bg-slate-800 p-4 rounded-lg">
                                                        <p className="text-xs text-slate-400 mb-2">KM Vazio</p>
                                                        <p className="text-3xl font-bold text-blue-400">{totalKmVazio}</p>
                                                        <p className="text-xs text-slate-500">km</p>
                                                    </div>
                                                    <div className="bg-slate-800 p-4 rounded-lg border border-green-500/30">
                                                        <p className="text-xs text-slate-400 mb-2">Total Geral</p>
                                                        <p className="text-3xl font-bold text-green-400">{totalKm}</p>
                                                        <p className="text-xs text-slate-500">km</p>
                                                    </div>
                                                    <div className="bg-slate-800 p-4 rounded-lg">
                                                        <p className="text-xs text-slate-400 mb-2">Média Carregado</p>
                                                        <p className="text-3xl font-bold text-yellow-300">{totalKmCarregado > 0 && totalLiters > 0 ? (totalKmCarregado / (totalLiters * (totalKmCarregado / totalKm))).toFixed(2) : '0.00'}</p>
                                                        <p className="text-xs text-slate-500">km/l</p>
                                                    </div>
                                                    <div className="bg-slate-800 p-4 rounded-lg">
                                                        <p className="text-xs text-slate-400 mb-2">Média Vazio</p>
                                                        <p className="text-3xl font-bold text-blue-300">{totalKmVazio > 0 && totalLiters > 0 ? (totalKmVazio / (totalLiters * (totalKmVazio / totalKm))).toFixed(2) : '0.00'}</p>
                                                        <p className="text-xs text-slate-500">km/l</p>
                                                    </div>
                                                    <div className="bg-slate-800 p-4 rounded-lg border border-green-500/30">
                                                        <p className="text-xs text-slate-400 mb-2">Média Geral</p>
                                                        <p className="text-3xl font-bold text-green-300">{totalKm > 0 && totalLiters > 0 ? (totalKm / totalLiters).toFixed(2) : '0.00'}</p>
                                                        <p className="text-xs text-slate-500">km/l</p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            <div className="pt-6">
                                <h3 className="text-lg font-semibold text-white mb-4 text-center">Evolução Mensal ({selectedVehicleId ? getVehicle(selectedVehicleId)?.plate : 'Frota'})</h3>
                                <div style={{ height: '400px' }}>
                                    <LineChart labels={monthlyAnalysisData.labels} datasets={monthlyChartDatasets} onHover={setLineTooltip}/>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-slate-400 py-8">Não há dados de viagens para exibir a análise no período selecionado.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};