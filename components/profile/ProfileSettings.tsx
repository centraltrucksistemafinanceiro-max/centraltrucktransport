import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { useNotification } from '../../context/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { View } from '../../App';

interface ProfileSettingsProps {
    setView: (view: View) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ setView }) => {
    const { session, changePassword } = useSession();
    const { showNotification } = useNotification();

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const role = session.user?.role;
    const userId = session.user?.userId || '';
    const driverId = session.user?.driverId || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showNotification('As novas senhas não correspondem.', 'error');
            return;
        }
        if ((newPassword || '').trim().length === 0) {
            showNotification('A nova senha não pode ser vazia.', 'error');
            return;
        }

        setIsLoading(true);
        let result;
        if (role === 'driver' && driverId) {
            result = await changePassword(driverId, 'driver', newPassword, oldPassword);
        } else if (role === 'admin' && userId) {
            result = await changePassword(userId, 'admin', newPassword);
        } else {
            showNotification('Perfil inválido para alterar senha.', 'error');
            setIsLoading(false);
            return;
        }

        showNotification(result.message, result.success ? 'success' : 'error');
        if (result.success) {
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setView({ type: 'dashboard' }), 1500);
        }
        setIsLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Perfil e Configurações</CardTitle>
                </CardHeader>
                <CardContent>
                    <h3 className="text-lg font-semibold text-white mb-4">Alterar Senha</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {role === 'driver' && (
                            <Input
                                id="oldPassword"
                                label="Senha Atual"
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                            />
                        )}
                        <Input
                            id="newPassword"
                            label="Nova Senha"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <Input
                            id="confirmPassword"
                            label="Confirmar Nova Senha"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <div className="flex justify-end gap-2 pt-2">
                             <Button type="button" variant="secondary" onClick={() => setView({ type: 'dashboard' })}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};