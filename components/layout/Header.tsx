
import React from 'react';
import { useSession } from '../../context/SessionContext';
import { ICONS } from '../../constants';
import { View } from '../../App';
import { Button } from '../ui/Button';

export const Header: React.FC<{ setView: (view: View) => void; onMenuClick: () => void; }> = ({ setView, onMenuClick }) => {
  const { session, logout } = useSession();

  const handleLogout = () => {
    logout();
    // App will re-render to the login screen automatically
  };

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4 flex justify-between lg:justify-end items-center sticky top-0 z-10">
      <button onClick={onMenuClick} className="lg:hidden text-slate-300 hover:text-white" aria-label="Abrir menu">
        <ICONS.menu className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            setView({ type: 'profileSettings' });
          }}
          className={"flex items-center gap-2 text-right cursor-pointer hover:bg-slate-700 p-2 rounded-md transition-colors"}
          title={'Editar perfil'}
        >
          <ICONS.user className="w-6 h-6 text-slate-400" />
          <div>
            <p className="font-semibold text-white">{session.user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{session.user?.role === 'admin' ? 'Administrador' : 'Motorista'}</p>
          </div>
        </button>
        <Button variant="secondary" onClick={handleLogout}>
          Sair
        </Button>
      </div>
    </header>
  );
};
