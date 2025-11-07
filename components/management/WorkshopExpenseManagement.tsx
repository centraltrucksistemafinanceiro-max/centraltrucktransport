import React, { useState, useEffect } from 'react';
import { useTrips } from '../../context/TripContext';
import { WorkshopExpense, FixedExpensePayment, Vehicle } from '../../types';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ICONS } from '../../constants';
import { AutocompleteInput } from '../ui/AutocompleteInput';
import { Modal } from '../ui/Modal';

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (date: Date | string) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(`${date}T00:00:00Z`) : date;
    // Add time zone offset to display the correct local date
    const correctedDate = new Date(dateObj.valueOf() + dateObj.getTimezoneOffset() * 60 * 1000);
    return correctedDate.toLocaleDateString('pt-BR');
};


export const WorkshopExpenseManagement: React.FC = () => {
    const { vehicles, workshopExpenses, addWorkshopExpense, updateWorkshopExpense, deleteWorkshopExpense, getVehicle } = useTrips();
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<WorkshopExpense | null>(null);
    const [editFormData, setEditFormData] = useState<WorkshopExpense | null>(null);

    const [newExpense, setNewExpense] = useState<Omit<WorkshopExpense, 'id' | 'createdAt' | 'payments'>>({
        vehicleId: '',
        description: '',
        totalAmount: 0,
        installments: 1,
        serviceDate: today,
        firstPaymentDate: today,
    });

    useEffect(() => {
        if (selectedExpense) {
            setEditFormData(selectedExpense);
        }
    }, [selectedExpense]);

    const activeVehicles = vehicles.filter(v => v.status === 'active');
    const descSuggestions = [...new Set(workshopExpenses.map(we => we.description))];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newExpense.vehicleId && newExpense.description && newExpense.totalAmount > 0 && newExpense.installments > 0) {
            addWorkshopExpense(newExpense);
            setNewExpense({
                vehicleId: '',
                description: '',
                totalAmount: 0,
                installments: 1,
                serviceDate: today,
                firstPaymentDate: today,
            });
        } else {
            alert("Preencha todos os campos obrigatórios.");
        }
    };
    
    const handleRegisterPayment = (expense: WorkshopExpense) => {
        if (expense.payments.length >= expense.installments) return;
        const installmentAmount = expense.totalAmount / expense.installments;
        const newPayment: FixedExpensePayment = {
            id: '' + Math.random(),
            date: new Date().toISOString(),
            amount: installmentAmount,
        };
        const updatedExpense = { ...expense, payments: [...expense.payments, newPayment] };
        updateWorkshopExpense(updatedExpense);
    };

    const handleDelete = (expenseId: string) => {
        if (window.confirm(`Tem certeza que deseja excluir esta despesa?`)) {
            deleteWorkshopExpense(expenseId);
        }
    };

    const openEditModal = (expense: WorkshopExpense) => {
        setSelectedExpense(expense);
        setIsEditModalOpen(true);
    };

    const handleSaveChanges = () => {
        if (editFormData) {
            updateWorkshopExpense(editFormData);
        }
        setIsEditModalOpen(false);
        setSelectedExpense(null);
    };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Despesa de Oficina</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                id="vehicleId"
                label="Veículo"
                value={newExpense.vehicleId}
                onChange={(e) => setNewExpense(p => ({...p, vehicleId: e.target.value}))}
                required
              >
                <option value="">Selecione o veículo</option>
                {activeVehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
              </Select>
              <AutocompleteInput
                id="description"
                label="Descrição do Serviço"
                value={newExpense.description}
                onChange={(e) => setNewExpense(p => ({...p, description: e.target.value.toUpperCase()}))}
                suggestions={descSuggestions}
                required
              />
               <Input
                id="serviceDate"
                label="Data do Serviço"
                type="date"
                value={newExpense.serviceDate}
                onChange={(e) => setNewExpense(p => ({...p, serviceDate: e.target.value}))}
                required
              />
               <Input
                id="firstPaymentDate"
                label="Data do 1º Pagamento"
                type="date"
                value={newExpense.firstPaymentDate}
                onChange={(e) => setNewExpense(p => ({...p, firstPaymentDate: e.target.value}))}
                required
              />
              <Input
                id="totalAmount"
                label="Valor Total (R$)"
                type="number"
                step="0.01"
                value={newExpense.totalAmount || ''}
                onChange={(e) => setNewExpense(p => ({...p, totalAmount: e.target.valueAsNumber || 0}))}
                required
              />
               <Input
                id="installments"
                label="Nº de Parcelas"
                type="number"
                min="1"
                step="1"
                value={newExpense.installments || ''}
                onChange={(e) => setNewExpense(p => ({...p, installments: parseInt(e.target.value) || 1}))}
                required
              />
              <Button type="submit" className="w-full">
                <ICONS.plus className="w-5 h-5 mr-2" />
                Adicionar Despesa
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Controle de Despesas da Oficina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {workshopExpenses.length > 0 ? (
                <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-700">
                        <tr>
                            <th scope="col" className="px-4 py-3">Veículo</th>
                            <th scope="col" className="px-4 py-3">Descrição</th>
                            <th scope="col" className="px-4 py-3">Valor Total</th>
                            <th scope="col" className="px-4 py-3">Progresso</th>
                            <th scope="col" className="px-4 py-3">Próx. Venc.</th>
                            <th scope="col" className="px-4 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                    {[...workshopExpenses].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((expense) => {
                        const vehicle = getVehicle(expense.vehicleId);
                        const isPaidOff = expense.payments.length >= expense.installments;
                        const installmentAmount = expense.totalAmount / expense.installments;
                        
                        const nextPaymentDate = new Date(`${expense.firstPaymentDate}T00:00:00`);
                        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + expense.payments.length);

                        return (
                             <tr key={expense.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                                <td className="px-4 py-3 font-medium text-white">{vehicle?.plate}</td>
                                <td className="px-4 py-3">
                                    <span className="font-semibold">{expense.description}</span>
                                    <span className="block text-xs text-slate-400">Serviço: {formatDate(expense.serviceDate)}</span>
                                </td>
                                <td className="px-4 py-3">{formatCurrency(expense.totalAmount)}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isPaidOff ? 'bg-green-500 text-white' : 'bg-slate-600 text-white'}`}>
                                        {expense.payments.length} / {expense.installments}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {isPaidOff ? 
                                        <span className="font-semibold text-green-400">Quitado</span> : 
                                        formatDate(nextPaymentDate)
                                    }
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-center gap-2">
                                        {!isPaidOff && (
                                            /* FIX: Removed unsupported 'size' prop */
                                            <Button onClick={() => handleRegisterPayment(expense)} variant="secondary" className="text-xs px-2 py-1">
                                                Pagar {formatCurrency(installmentAmount)}
                                            </Button>
                                        )}
                                        {/* FIX: Removed unsupported 'size' prop */}
                                        <Button onClick={() => openEditModal(expense)} variant="secondary" className="p-2">
                                            <ICONS.pencil className="w-4 h-4"/>
                                        </Button>
                                        {/* FIX: Removed unsupported 'size' prop */}
                                        <Button onClick={() => handleDelete(expense.id)} variant="danger" className="p-2">
                                            <ICONS.trash className="w-4 h-4"/>
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
              ) : (
                <p className="text-slate-400 text-center py-4">Nenhuma despesa de oficina cadastrada.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    {isEditModalOpen && selectedExpense && editFormData && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Despesa de Oficina">
            <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Select id={`edit-vehicleId-${editFormData.id}`} label="Veículo" value={editFormData.vehicleId} onChange={e => setEditFormData(d => d ? { ...d, vehicleId: e.target.value } : null)}>
                        {[...activeVehicles, vehicles.find(v => v.id === editFormData.vehicleId && v.status === 'inactive')].filter(Boolean).map(v => <option key={v.id} value={v.id}>{v.plate} {v.status === 'inactive' ? '(Inativo)' : ''}</option>)}
                     </Select>
                     <AutocompleteInput id={`edit-desc-${editFormData.id}`} label="Descrição" value={editFormData.description} onChange={e => setEditFormData(d => d ? { ...d, description: e.target.value.toUpperCase() } : null)} suggestions={descSuggestions}/>
                     <Input id={`edit-serviceDate-${editFormData.id}`} label="Data do Serviço" type="date" value={editFormData.serviceDate} onChange={e => setEditFormData(d => d ? { ...d, serviceDate: e.target.value } : null)} />
                     <Input id={`edit-firstPaymentDate-${editFormData.id}`} label="Data 1º Venc." type="date" value={editFormData.firstPaymentDate} onChange={e => setEditFormData(d => d ? { ...d, firstPaymentDate: e.target.value } : null)} />
                     <Input id={`edit-amount-${editFormData.id}`} label="Valor Total" type="number" step="0.01" value={editFormData.totalAmount || ''} onChange={e => setEditFormData(d => d ? { ...d, totalAmount: e.target.valueAsNumber || 0 } : null)} />
                     <Input id={`edit-installments-${editFormData.id}`} label="Parcelas" type="number" value={editFormData.installments || ''} onChange={e => setEditFormData(d => d ? { ...d, installments: Number(e.target.value) } : null)} />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
                </div>
            </div>
        </Modal>
    )}
    </>
  );
};