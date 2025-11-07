import React, { useState } from 'react';
import { useTrips } from '../../context/TripContext';
import { FixedExpense, FixedExpenseCategory, FixedExpensePayment } from '../../types';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ICONS, FIXED_EXPENSE_CATEGORIES } from '../../constants';
import { AutocompleteInput } from '../ui/AutocompleteInput';

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const FixedExpenseManagement: React.FC = () => {
  const { vehicles, fixedExpenses, addFixedExpense, updateFixedExpense, getVehicle } = useTrips();
  // FIX: Added today's date for default form values.
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  
  const [newExpense, setNewExpense] = useState<Omit<FixedExpense, 'id' | 'createdAt' | 'payments'>>({
    vehicleId: '',
    description: '',
    category: FixedExpenseCategory.OTHER,
    totalAmount: 0,
    installments: 1,
    // FIX: Added missing 'firstPaymentDate' property to initial state.
    firstPaymentDate: today,
  });

  const descSuggestions = [...new Set(fixedExpenses.map(fe => fe.description))];
  const activeVehicles = vehicles.filter(v => v.status === 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.vehicleId && newExpense.description && newExpense.totalAmount > 0 && newExpense.installments > 0) {
      addFixedExpense(newExpense);
      setNewExpense({
        vehicleId: '',
        description: '',
        category: FixedExpenseCategory.OTHER,
        totalAmount: 0,
        installments: 1,
        // FIX: Added missing 'firstPaymentDate' property when resetting the form.
        firstPaymentDate: today,
      });
    } else {
        alert("Preencha todos os campos obrigatórios.");
    }
  };

  const handleRegisterPayment = (expense: FixedExpense) => {
    if(expense.payments.length >= expense.installments) return;

    const installmentAmount = expense.totalAmount / expense.installments;
    const newPayment: FixedExpensePayment = {
        id: '' + Math.random(),
        date: new Date().toISOString(),
        amount: installmentAmount,
    };

    const updatedExpense = {
        ...expense,
        payments: [...expense.payments, newPayment]
    };
    updateFixedExpense(updatedExpense);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Despesa Fixa</CardTitle>
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
              <Select
                id="category"
                label="Categoria"
                value={newExpense.category}
                onChange={(e) => setNewExpense(p => ({...p, category: e.target.value as FixedExpenseCategory}))}
                required
              >
                {FIXED_EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <AutocompleteInput
                id="description"
                label="Descrição"
                value={newExpense.description}
                onChange={(e) => setNewExpense(p => ({...p, description: e.target.value.toUpperCase()}))}
                suggestions={descSuggestions}
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
              {/* FIX: Added input for firstPaymentDate */}
               <Input
                id="firstPaymentDate"
                label="Data do 1º Pagamento"
                type="date"
                value={newExpense.firstPaymentDate}
                onChange={(e) => setNewExpense(p => ({...p, firstPaymentDate: e.target.value}))}
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
            <CardTitle>Controle de Despesas Fixas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fixedExpenses.length > 0 ? (
                fixedExpenses.map((expense) => {
                    const vehicle = getVehicle(expense.vehicleId);
                    const amountPaid = expense.payments.reduce((sum, p) => sum + p.amount, 0);
                    const remainingBalance = expense.totalAmount - amountPaid;
                    const isPaidOff = expense.payments.length >= expense.installments;

                    return (
                        <div key={expense.id} className="bg-slate-700 p-4 rounded-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-white">{expense.description}</p>
                                    <p className="text-sm text-slate-300">{vehicle?.plate} ({vehicle?.model}) | {expense.category}</p>
                                    <p className="text-sm text-slate-400">Total: {formatCurrency(expense.totalAmount)}</p>
                                </div>
                                {isPaidOff ? (
                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-500 text-white">
                                        Quitado
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500 text-black">
                                       Parcela {expense.payments.length + 1} de {expense.installments}
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 bg-slate-800 p-3 rounded-md">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-slate-400">Valor Pago</p>
                                        <p className="font-semibold text-green-400">{formatCurrency(amountPaid)}</p>
                                    </div>
                                     <div>
                                        <p className="text-slate-400">Saldo Devedor</p>
                                        <p className="font-semibold text-red-400">{formatCurrency(remainingBalance)}</p>
                                    </div>
                                </div>
                                {!isPaidOff && (
                                     <Button 
                                        onClick={() => handleRegisterPayment(expense)}
                                        className="w-full mt-3" 
                                        variant="secondary"
                                        disabled={isPaidOff}
                                    >
                                        Registrar Pagamento ({formatCurrency(expense.totalAmount/expense.installments)})
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                })
              ) : (
                <p className="text-slate-400 text-center py-4">Nenhuma despesa fixa cadastrada.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};