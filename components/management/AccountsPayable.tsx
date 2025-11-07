import React, { useState, useMemo, useEffect } from 'react';
import { useTrips } from '../../context/TripContext';
import { FixedExpense, WorkshopExpense, FixedExpensePayment, FixedExpenseCategory } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { ICONS } from '../../constants';
import { useNotification } from '../../context/NotificationContext';

type PayableItem = {
    id: string;
    type: 'fixed' | 'workshop';
    description: string;
    category: 'Despesas' | 'Despesas Oficina';
    vehicleId: string;
    totalAmount: number;
    dueDate: Date | null;
    originalExpense: FixedExpense | WorkshopExpense;
};

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatMonthYear = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric', timeZone: 'UTC' });
};

const initialFormState = {
    description: '',
    dueDate: '', // YYYY-MM
    amount: 0,
    category: 'Despesas' as 'Despesas' | 'Despesas Oficina',
    vehicleId: '',
};

export const AccountsPayable: React.FC = () => {
    const { 
        vehicles, fixedExpenses, workshopExpenses, getVehicle, 
        addFixedExpense, addWorkshopExpense, 
        deleteFixedExpense, deleteWorkshopExpense,
        updateFixedExpense, updateWorkshopExpense
    } = useTrips();
    const { showNotification } = useNotification();
    
    // Filtros e busca
    const [searchTerm, setSearchTerm] = useState('');
    const [plateFilter, setPlateFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    
    // Estado para modais
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Estado para dados de formulários
    const [newExpenseData, setNewExpenseData] = useState(initialFormState);
    const [editingItem, setEditingItem] = useState<PayableItem | null>(null);
    const [editFormData, setEditFormData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (editingItem) {
            setEditFormData({
                description: editingItem.description,
                dueDate: editingItem.dueDate ? editingItem.dueDate.toISOString().slice(0, 7) : '',
                amount: editingItem.totalAmount,
                category: editingItem.category,
                vehicleId: editingItem.vehicleId,
            });
        }
    }, [editingItem]);


    const allPayableItems = useMemo<PayableItem[]>(() => {
        const combined: Omit<PayableItem, 'dueDate'>[] = [
            ...fixedExpenses.map(e => ({
                id: e.id, 
                // FIX: Use 'as const' to ensure TypeScript infers a literal type, not string.
                type: 'fixed' as const, 
                description: e.description,
                category: 'Despesas' as const, 
                vehicleId: e.vehicleId,
                totalAmount: e.totalAmount, 
                originalExpense: e,
            })),
            ...workshopExpenses.map(e => ({
                id: e.id, 
                // FIX: Use 'as const' to ensure TypeScript infers a literal type, not string.
                type: 'workshop' as const, 
                description: e.description,
                category: 'Despesas Oficina' as const, 
                vehicleId: e.vehicleId,
                totalAmount: e.totalAmount, 
                originalExpense: e,
            })),
        ];
        
        return combined.map(item => {
            // Use UTC to prevent timezone shifts
             const firstPaymentDate = new Date(`${item.originalExpense.firstPaymentDate}T00:00:00Z`);
             return { ...item, dueDate: firstPaymentDate };
        }).sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0));
    }, [fixedExpenses, workshopExpenses]);

    const filteredItems = useMemo(() => {
        return allPayableItems.filter(item => {
            const vehicle = getVehicle(item.vehicleId);
            const dueDate = item.dueDate;
            // Use UTC for consistent date filtering
            const start = startDate ? new Date(`${startDate}-01T00:00:00Z`) : null;
            const end = endDate ? new Date(new Date(`${endDate}-01T00:00:00Z`).setUTCMonth(new Date(`${endDate}-01T00:00:00Z`).getUTCMonth() + 1) - 1) : null;

            if (start && dueDate && dueDate < start) return false;
            if (end && dueDate && dueDate > end) return false;
            if (categoryFilter && item.category !== categoryFilter) return false;
            if (searchTerm && !item.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (plateFilter && vehicle && !vehicle.plate.toLowerCase().includes(plateFilter.toLowerCase())) return false;
            
            return true;
        });
    }, [allPayableItems, searchTerm, plateFilter, startDate, endDate, categoryFilter, getVehicle]);

    const filteredTotal = useMemo(() => {
        return filteredItems.reduce((sum, item) => sum + item.totalAmount, 0);
    }, [filteredItems]);
    
    const handleDelete = async (item: PayableItem) => {
         if (window.confirm(`Tem certeza que deseja excluir a despesa "${item.description}"?`)) {
            if (item.type === 'fixed') {
                await deleteFixedExpense(item.id);
            } else {
                await deleteWorkshopExpense(item.id);
            }
            showNotification('Despesa excluída com sucesso!', 'success');
         }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const { description, dueDate, amount, category, vehicleId } = newExpenseData;

        if (!description || !dueDate || amount <= 0 || !category || !vehicleId) {
            showNotification("Por favor, preencha todos os campos.", "error");
            return;
        }
    
        setIsSaving(true);
        const paymentDate = `${dueDate}-01`; 
    
        if (category === 'Despesas Oficina') {
            await addWorkshopExpense({
                description, vehicleId,
                totalAmount: amount, installments: 1,
                serviceDate: paymentDate, firstPaymentDate: paymentDate,
            });
        } else {
            await addFixedExpense({
                description, vehicleId,
                totalAmount: amount, installments: 1,
                category: FixedExpenseCategory.FORNECEDOR,
                firstPaymentDate: paymentDate,
            });
        }
    
        showNotification('Nova despesa adicionada com sucesso!', 'success');
        setIsAddModalOpen(false);
        setNewExpenseData(initialFormState);
        setIsSaving(false);
    };

    const handleEditClick = (item: PayableItem) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
    };
    
    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || !editFormData) return;

        const { description, dueDate, amount, category, vehicleId } = editFormData;
        if (!description || !dueDate || amount <= 0 || !category || !vehicleId) {
            showNotification("Por favor, preencha todos os campos do formulário de edição.", "error");
            return;
        }

        setIsSaving(true);
        const paymentDate = `${dueDate}-01`;

        if (editingItem.type === 'fixed') {
            const original = editingItem.originalExpense as FixedExpense;
            await updateFixedExpense({
                ...original,
                description, vehicleId,
                totalAmount: amount,
                firstPaymentDate: paymentDate,
            });
        } else {
            const original = editingItem.originalExpense as WorkshopExpense;
            await updateWorkshopExpense({
                ...original,
                description, vehicleId,
                totalAmount: amount,
                firstPaymentDate: paymentDate,
                serviceDate: paymentDate, // Assume service date is linked to first payment date
            });
        }

        showNotification("Despesa atualizada com sucesso!", 'success');
        setIsEditModalOpen(false);
        setEditingItem(null);
        setIsSaving(false);
    };


    return (
        <>
        <Card>
            <CardHeader className="border-b-0">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <CardTitle>Contas a Pagar</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                            <Input id="search" label="" placeholder="Buscar por descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            <Input id="plateFilter" label="" placeholder="Buscar por placa..." value={plateFilter} onChange={e => setPlateFilter(e.target.value)} />
                            <Input id="startDate" label="" type="month" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <Input id="endDate" label="" type="month" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            <Select id="categoryFilter" label="" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                                <option value="">Todas Categorias</option>
                                <option value="Despesas">Despesas</option>
                                <option value="Despesas Oficina">Despesas Oficina</option>
                            </Select>
                        </div>
                    </div>
                     <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-slate-400">TOTAL FILTRADO</p>
                            <p className="text-2xl font-bold text-yellow-400">{formatCurrency(filteredTotal)}</p>
                        </div>
                        <div className="flex gap-2">
                             <Button onClick={() => setIsAddModalOpen(true)}>
                                <ICONS.plus className="w-4 h-4 mr-2"/>
                                Nova Despesa
                            </Button> 
                            <Button variant="secondary" onClick={() => window.print()}>
                                <ICONS.printer className="w-4 h-4 mr-2"/>
                                Imprimir
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-700/50 text-xs uppercase text-slate-400">
                            <tr>
                                <th className="p-3">Descrição</th>
                                <th className="p-3">Placa</th>
                                <th className="p-3">Vlr Total</th>
                                <th className="p-3">Categoria</th>
                                <th className="p-3">Vencimento</th>
                                <th className="p-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => {
                                const vehicle = getVehicle(item.vehicleId);
                                return (
                                    <tr key={item.id} onDoubleClick={() => handleEditClick(item)} className="border-b border-slate-700 hover:bg-slate-800/50 cursor-pointer">
                                        <td className="p-3 font-medium text-white">{item.description}</td>
                                        <td className="p-3">{vehicle?.plate}</td>
                                        <td className="p-3">{formatCurrency(item.totalAmount)}</td>
                                        <td className="p-3">{item.category}</td>
                                        <td className="p-3">{formatMonthYear(item.dueDate)}</td>
                                        <td className="p-3">
                                            <div className="flex justify-center items-center gap-2 text-xs font-semibold">
                                                <button onClick={() => handleEditClick(item)} className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">Editar</button>
                                                <span className="text-slate-600">|</span>
                                                <button onClick={() => handleDelete(item)} className="text-red-400 hover:text-red-300 transition-colors">Excluir</button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                     {filteredItems.length === 0 && (
                        <p className="text-center text-slate-400 py-8">Nenhuma despesa encontrada com os filtros atuais.</p>
                    )}
                </div>
            </CardContent>
        </Card>

        {/* Modal Adicionar */}
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Nova Conta a Pagar">
             <form onSubmit={handleAddExpense} className="space-y-4">
                <Input
                    id="new-desc" label="Descrição" value={newExpenseData.description}
                    onChange={e => setNewExpenseData(p => ({...p, description: e.target.value.toUpperCase()}))} required
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        id="new-dueDate" label="Data Vencimento" type="month" value={newExpenseData.dueDate}
                        onChange={e => setNewExpenseData(p => ({...p, dueDate: e.target.value}))} required
                    />
                    <Input
                        id="new-amount" label="Valor (R$)" type="number" step="0.01" value={newExpenseData.amount || ''}
                        onChange={e => setNewExpenseData(p => ({...p, amount: e.target.valueAsNumber || 0}))} required
                    />
                </div>
                <Select
                    id="new-category" label="Categoria" value={newExpenseData.category}
                    onChange={e => setNewExpenseData(p => ({...p, category: e.target.value as any}))} required
                >
                    <option value="Despesas">Despesas</option>
                    <option value="Despesas Oficina">Despesas Oficina</option>
                </Select>
                <Select
                    id="new-vehicle" label="Veículo" value={newExpenseData.vehicleId}
                    onChange={e => setNewExpenseData(p => ({...p, vehicleId: e.target.value}))} required
                >
                    <option value="">Selecione o veículo</option>
                    {vehicles.filter(v => v.status === 'active').map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                </Select>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? 'Adicionando...' : 'Adicionar Despesa'}</Button>
                </div>
            </form>
        </Modal>

        {/* Modal Editar */}
        {editingItem && editFormData && (
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Conta a Pagar">
                <form onSubmit={handleSaveChanges} className="space-y-4">
                    <Input
                        id="edit-desc" label="Descrição" value={editFormData.description}
                        onChange={e => setEditFormData(p => ({...p, description: e.target.value.toUpperCase()}))} required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            id="edit-dueDate" label="Data Vencimento" type="month" value={editFormData.dueDate}
                            onChange={e => setEditFormData(p => ({...p, dueDate: e.target.value}))} required
                        />
                        <Input
                            id="edit-amount" label="Valor (R$)" type="number" step="0.01" value={editFormData.amount || ''}
                            onChange={e => setEditFormData(p => ({...p, amount: e.target.valueAsNumber || 0}))} required
                        />
                    </div>
                    <Select
                        id="edit-category" label="Categoria" value={editFormData.category}
                        onChange={e => setEditFormData(p => ({...p, category: e.target.value as any}))} required
                    >
                        <option value="Despesas">Despesas</option>
                        <option value="Despesas Oficina">Despesas Oficina</option>
                    </Select>
                    <Select
                        id="edit-vehicle" label="Veículo" value={editFormData.vehicleId}
                        onChange={e => setEditFormData(p => ({...p, vehicleId: e.target.value}))} required
                    >
                        <option value="">Selecione o veículo</option>
                        {vehicles.filter(v => v.status === 'active' || v.id === editFormData.vehicleId).map(v => 
                            <option key={v.id} value={v.id}>{v.plate} - {v.model} {v.status === 'inactive' ? '(Inativo)' : ''}</option>
                        )}
                    </Select>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</Button>
                    </div>
                </form>
            </Modal>
        )}
        </>
    );
};