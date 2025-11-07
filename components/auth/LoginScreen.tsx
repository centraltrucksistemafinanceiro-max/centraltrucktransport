import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ICONS } from '../../constants';

export const LoginScreen: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberUser, setRememberUser] = useState(true);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useSession();

    useEffect(() => {
        const rememberedUsername = localStorage.getItem('rememberedUser');
        if (rememberedUsername) {
            setUsername(rememberedUsername);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const uname = (username || '').trim();
        const pwd = (password || '').trim();
        if (uname.length === 0 || pwd.length === 0) {
            setError('Login ou senha inválidos.');
            return;
        }
        setIsLoading(true);
        const success = await login(uname, pwd);
        if (!success) {
            setError('Login ou senha inválidos.');
        } else {
            if (rememberUser) {
                localStorage.setItem('rememberedUser', uname);
            } else {
                localStorage.removeItem('rememberedUser');
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex flex-col items-center text-center">
                        <ICONS.trip className="w-12 h-12 text-blue-400 mb-2" />
                        <CardTitle>Gestão de Fretes</CardTitle>
                        <p className="text-slate-400 text-sm mt-1">Acesse sua conta para continuar</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <Input
                            id="username"
                            label="Login"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />
                        <Input
                            id="password"
                            label="Senha"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberUser}
                                    onChange={(e) => setRememberUser(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-500 rounded bg-slate-700"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300">
                                    Lembrar usuário
                                </label>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <Button type="submit" className="w-full" disabled={isLoading || (password || '').trim().length === 0 || (username || '').trim().length === 0}>
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};