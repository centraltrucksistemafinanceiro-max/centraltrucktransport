
import React, { useState, useEffect } from 'react';
import { useTrips } from '../../context/TripContext';
import { useSession } from '../../context/SessionContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { ICONS } from '../../constants';
import { Admin } from '../../types';

const AdminRow: React.FC<{ admin: Admin }> = ({ admin }) => {
    const { admins, updateAdmin, deleteAdmin } = useTrips();
    const { session, changePassword } = useSession();
    const { showNotification } = useNotification();

    const [isEditing, setIsEditing] = useState(false);
    const [adminData, setAdminData] = useState(admin);
    const [isSaving, setIsSaving] = useState(false);
    
    const isSelf = session.user?.userId === admin.id;
    const isLastAdmin = admins.length <= 1;

    useEffect(() => {
        setAdminData(admin);
    }, [admin]);

    const handleSave = async () => {
        if(adminData.name.trim()) {
            setIsSaving(true);
            await updateAdmin(adminData);
            setIsSaving(false);
            setIsEditing(false);
        } else {
            showNotification('O nome não pode ficar em branco.', 'error');
        }
    };

    const handleDelete = async () => {
        if (!isSelf && !isLastAdmin && window.confirm(`Tem certeza que deseja excluir o administrador ${admin.name}? Esta ação não pode ser desfeita.`)) {
            await deleteAdmin(admin.id);
            showNotification('Administrador excluído com sucesso.', 'success');
        }
    };

    const handleResetPassword = async () => {
        const newPassword = prompt(`Digite a nova senha para ${admin.name}.`);
        if (newPassword && newPassword.trim().length > 0) {
            const result = await changePassword(admin.id, 'admin', newPassword.trim());
            showNotification(result.message, result.success ? 'success' : 'error');
        }
    };

    if (isEditing) {
        return (
            <div className="bg-slate-700 p-4 rounded-md space-y-3">
                <Input id={`name-${admin.id}`} label="Nome" value={adminData.name} onChange={e => setAdminData(d => ({ ...d, name: e.target.value.toUpperCase() }))} />
                <div className="flex gap-2 justify-end mt-2">
                    <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-700 p-4 rounded-md flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
                <p className="font-semibold text-white flex items-center gap-2">
                    {admin.name}
                    {isSelf && <span className="text-xs text-blue-400">(Você)</span>}
                </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 md:mt-0 justify-start md:justify-end">
                <Button variant="secondary" onClick={() => setIsEditing(true)}>Editar</Button>
                <Button variant="secondary" onClick={handleResetPassword}>Resetar Senha</Button>
                <Button 
                    variant="danger" 
                    onClick={handleDelete} 
                    disabled={isSelf || isLastAdmin} 
                    title={isSelf ? "Você não pode excluir a si mesmo." : isLastAdmin ? "Não é possível excluir o único administrador." : "Excluir administrador"}
                >
                    Excluir
                </Button>
            </div>
        </div>
    );
};


export const AdminManagement: React.FC = () => {
  const { admins, addAdmin } = useTrips();
  const { showNotification } = useNotification();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name && password) {
      setIsLoading(true);
      await addAdmin({ name, password });
      setName('');
      setPassword('');
      showNotification('Administrador adicionado com sucesso!', 'success');
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Administrador</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="adminName"
                label="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                required
              />
              <Input
                id="adminPassword"
                label="Senha Provisória"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                    'Adicionando...'
                ) : (
                    <>
                        <ICONS.plus className="w-5 h-5 mr-2" />
                        Adicionar
                    </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Administradores Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {admins.length > 0 ? (
                [...admins].sort((a, b) => a.name.localeCompare(b.name)).map((admin) => (
                  <AdminRow key={admin.id} admin={admin} />
                ))
              ) : (
                <p className="text-slate-400 text-center py-4">Nenhum administrador cadastrado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
