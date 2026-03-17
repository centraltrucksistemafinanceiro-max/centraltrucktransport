import React, { useState, useMemo } from 'react';
import { useTrips } from '../../context/TripContext';
import { useSession } from '../../context/SessionContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ICONS } from '../../constants';
import { TripStatus } from '../../types';

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; className?: string }> = ({ label, value, icon, className = '' }) => (
    <div className={`bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg ${className}`}>
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 rounded-lg text-blue-400">
                {icon}
            </div>
            <div>
                <p className="text-sm text-slate-400 font-medium">{label}</p>
                <p className="text-2xl font-bold text-white mt-1">{value}</p>
            </div>
        </div>
    </div>
);

export const DriverCommissionView: React.FC = () => {
    const { trips } = useTrips();
    const { session } = useSession();
    
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    });
    const [endDate, setEndDate] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    });

    const driverId = session.user?.driverId;

    const commissionData = useMemo(() => {
        if (!driverId) return { 
            totalCommission: 0, 
            totalGrossRevenue: 0, 
            tripCount: 0, 
            monthlyTrips: [],
            monthsCount: 1,
            avgGross: 0,
            avgCommission: 0
        };

        const [startYear, startMonth] = startDate.split('-').map(Number);
        const [endYear, endMonth] = endDate.split('-').map(Number);

        // Quantidade de meses selecionados
        const monthsCount = Math.max(1, (endYear - startYear) * 12 + (endMonth - startMonth) + 1);

        // Convert to comparable numbers (YYYYMM)
        const startVal = startYear * 100 + startMonth;
        const endVal = endYear * 100 + endMonth;

        const monthlyTrips = trips.filter(trip => {
            if (trip.driverId !== driverId) return false;
            if (trip.status !== TripStatus.COMPLETED) return false;
            
            const tripDate = new Date(trip.startDate + 'T00:00:00');
            const tripYearMonth = tripDate.getFullYear() * 100 + (tripDate.getMonth() + 1);
            
            return tripYearMonth >= startVal && tripYearMonth <= endVal;
        }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

        let totalCommission = 0;
        let totalGrossRevenue = 0;

        monthlyTrips.forEach(trip => {
            const tripGross = trip.cargo.reduce((sum, c) => sum + (c.weight * c.pricePerTon), 0);
            const totalFreightNetTax = trip.cargo.reduce((cargoSum, c) => cargoSum + (c.weight * c.pricePerTon) - (c.tax || 0), 0);
            const driverCommission = (totalFreightNetTax * trip.driverCommissionRate) / 100;
            
            totalGrossRevenue += tripGross;
            totalCommission += driverCommission;
        });

        return {
            totalCommission,
            totalGrossRevenue,
            tripCount: monthlyTrips.length,
            monthlyTrips,
            monthsCount,
            avgGross: totalGrossRevenue / monthsCount,
            avgCommission: totalCommission / monthsCount,
        };
    }, [startDate, endDate, trips, driverId]);

    if (!driverId) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-4">
                    <ICONS.info className="w-12 h-12" />
                </div>
                <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
                <p className="text-slate-400 mt-2">Esta aba é exclusiva para motoristas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                <div>
                    <h2 className="text-2xl font-bold text-white">Minhas Comissões</h2>
                    <p className="text-slate-400 mt-1">Acompanhe seus ganhos por período</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="start-month" className="text-sm font-medium text-slate-300">De:</label>
                        <input
                            type="month"
                            id="start-month"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="bg-slate-700 border-slate-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="end-month" className="text-sm font-medium text-slate-300">Até:</label>
                        <input
                            type="month"
                            id="end-month"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="bg-slate-700 border-slate-600 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm"
                        />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    label={commissionData.monthsCount > 1 ? "Faturamento Bruto Total" : "Faturamento Bruto"}
                    value={formatCurrency(commissionData.totalGrossRevenue)} 
                    icon={<ICONS.truck className="w-8 h-8" />}
                    className="border-yellow-500/20"
                />
                <StatCard 
                    label={commissionData.monthsCount > 1 ? "Minha Comissão Total" : "Minha Comissão"}
                    value={formatCurrency(commissionData.totalCommission)} 
                    icon={<ICONS.currencyDollar className="w-8 h-8" />}
                    className="border-blue-500/20"
                />
                <StatCard 
                    label="Viagens No Período" 
                    value={commissionData.tripCount.toString()} 
                    icon={<ICONS.trip className="w-8 h-8" />}
                    className="border-green-500/20"
                />
            </div>

            {commissionData.monthsCount > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-blue-500/10 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Média Bruta Mensal ({commissionData.monthsCount} meses)</p>
                            <p className="text-xl font-bold text-white mt-1">{formatCurrency(commissionData.avgGross)}</p>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <ICONS.calendar className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-green-500/10 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Média de Comissão Mensal</p>
                            <p className="text-xl font-bold text-green-400 mt-1">{formatCurrency(commissionData.avgCommission)}</p>
                        </div>
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                            <ICONS.currencyDollar className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            )}

            <Card className="border-slate-700/50 shadow-xl overflow-hidden">
                <CardHeader className="bg-slate-800/30 border-b border-slate-700/50">
                    <CardTitle className="flex items-center gap-2">
                        <ICONS.list className="w-5 h-5 text-blue-400" />
                        Histórico de Viagens
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {commissionData.monthlyTrips.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Data Início</th>
                                        <th className="px-6 py-4">Trajeto</th>
                                        <th className="px-6 py-4">Fat. Bruto</th>
                                        <th className="px-6 py-4">Comissão %</th>
                                        <th className="px-6 py-4 text-right">Sua Comissão</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {commissionData.monthlyTrips.map(trip => {
                                        const tripGross = trip.cargo.reduce((sum, c) => sum + (c.weight * c.pricePerTon), 0);
                                        const totalFreightNetTax = trip.cargo.reduce((cargoSum, c) => cargoSum + (c.weight * c.pricePerTon) - (c.tax || 0), 0);
                                        const driverCommission = (totalFreightNetTax * trip.driverCommissionRate) / 100;
                                        
                                        return (
                                            <tr key={trip.id} className="hover:bg-slate-700/30 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {new Date(trip.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-white font-medium">{trip.origin}</span>
                                                        <ICONS.chevronRight className="w-3 h-3 text-slate-500" />
                                                        <span className="text-white font-medium">{trip.destination}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {formatCurrency(tripGross)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-xs font-bold">
                                                        {trip.driverCommissionRate}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-lg font-bold text-green-400 group-hover:scale-110 inline-block transition-transform">
                                                        {formatCurrency(driverCommission)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                            <ICONS.calendar className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Nenhuma viagem finalizada encontrada</p>
                            <p className="text-sm">Tente mudar o mês para ver outros registros.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
