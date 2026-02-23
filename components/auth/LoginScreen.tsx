import React, { useState, useEffect } from 'react';
import { useSession } from '../../context/SessionContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ICONS } from '../../constants';

export const LoginScreen: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberUser, setRememberUser] = useState(true);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);
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
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
            {/* Animated background elements - transport themed */}
            <div className="absolute inset-0">
                {/* Truck silhouette animation - top right */}
                <div className="absolute top-20 right-20 opacity-5 animate-pulse">
                    <svg className="w-40 h-40 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM9 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                        <path d="M17 8h-11c-.55 0-1 .45-1 1v10h2c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5h5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5h2V10.5c0-.83-.67-1.5-1.5-1.5zm-11 9V9h11v8H6z"/>
                    </svg>
                </div>

                {/* Cargo box - bottom left */}
                <div className="absolute bottom-32 left-10 opacity-5 animate-pulse" style={{animationDelay: '1s'}}>
                    <svg className="w-32 h-32 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 7l-3-3H6L3 7v10h18V7zM7 5h10v2H7V5zm12 10H5v-7h14v7z"/>
                    </svg>
                </div>

                {/* Road/path lines */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
                    <div className="absolute top-2/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
                </div>

                {/* Colored blobs - more corporate */}
                <div className="absolute top-0 right-1/4 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob"></div>
                <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-2000"></div>
            </div>

            {/* Main container */}
            <div className="relative w-full max-w-md mx-auto px-6 z-10">
                {/* Top accent bar */}
                <div className="mb-6 flex justify-center gap-1">
                    <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
                    <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
                </div>

                {/* Main card with enhanced styling */}
                <div className="backdrop-blur-2xl bg-gradient-to-b from-white/8 to-white/3 border border-white/15 rounded-3xl shadow-2xl overflow-hidden">
                    {/* Decorative header with truck icon */}
                    <div className="h-32 bg-gradient-to-r from-orange-600 via-blue-700 to-blue-900 relative overflow-hidden flex items-center justify-center">
                        {/* Animated background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_25%,rgba(255,255,255,.1)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.1)_75%,rgba(255,255,255,.1))] bg-[length:40px_40px]"></div>
                        </div>

                        {/* Truck icon/Logo in header */}
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-2 shadow-2xl overflow-hidden">
                                <img src="assets/logo.png" alt="Logo" className="w-16 h-16 object-contain" onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = document.getElementById('fallback-icon');
                                    if (fallback) fallback.style.opacity = '1';
                                }} />
                                <div id="fallback-icon" className="transition-opacity duration-300 opacity-0 absolute">
                                    <ICONS.trip className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content section */}
                    <div className="p-8 sm:p-10">
                        {/* Title and subtitle */}
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-white mb-2">Central Truck</h1>
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="h-px w-8 bg-gradient-to-r from-transparent to-orange-500"></div>
                                <p className="text-orange-400 text-sm font-semibold uppercase tracking-wider">Transportadora</p>
                                <div className="h-px w-8 bg-gradient-to-l from-transparent to-orange-500"></div>
                            </div>
                            <p className="text-slate-400 text-sm">Sistema de Gestão de Fretes e Operações</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Username input */}
                            <div className="relative group">
                                <Input
                                    id="username"
                                    label="Usuário"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onFocus={() => setFocusedField('username')}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    autoComplete="username"
                                    placeholder="Digite seu usuário"
                                    className="bg-white/5 border border-white/10 text-white placeholder:text-slate-500"
                                />
                                {focusedField === 'username' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
                                )}
                            </div>

                            {/* Password input */}
                            <div className="relative group">
                                <Input
                                    id="password"
                                    label="Senha"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="bg-white/5 border border-white/10 text-white placeholder:text-slate-500"
                                />
                                {focusedField === 'password' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
                                )}
                            </div>

                            {/* Remember me */}
                            <div className="flex items-center pt-2">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    checked={rememberUser}
                                    onChange={(e) => setRememberUser(e.target.checked)}
                                    className="h-4 w-4 rounded bg-white/10 border border-white/20 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-3 text-sm text-slate-300 cursor-pointer hover:text-orange-400 transition-colors">
                                    Lembrar meu usuário
                                </label>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-lg backdrop-blur-sm">
                                    <p className="text-red-300 text-sm text-center font-medium">{error}</p>
                                </div>
                            )}

                            {/* Login button */}
                            <button
                                type="submit"
                                disabled={isLoading || (password || '').trim().length === 0 || (username || '').trim().length === 0}
                                className="w-full mt-6 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-2xl hover:shadow-orange-500/20 uppercase tracking-wider text-sm"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <span className="animate-spin inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                                        Entrando...
                                    </span>
                                ) : (
                                    '→ Acessar Sistema'
                                )}
                            </button>

                            {/* Security footer */}
                            <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                Conexão segura e criptografada
                            </p>
                        </form>
                    </div>
                </div>

                {/* Bottom decorative elements */}
                <div className="mt-8 flex justify-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500/60"></div>
                    <div className="w-3 h-3 rounded-full bg-blue-600/60"></div>
                    <div className="w-3 h-3 rounded-full bg-orange-500/40"></div>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 50px) scale(1.05); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};