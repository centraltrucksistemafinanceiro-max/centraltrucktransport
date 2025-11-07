import React, { useState, useEffect } from 'react';
import { ICONS } from '../../constants';
import type { View } from '../../App';
import { Button } from '../ui/Button';
import { useSession } from '../../context/SessionContext';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface NavItemProps {
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <li>
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center p-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
      <span className="ml-3 font-medium">{label}</span>
    </a>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen }) => {
  const { session } = useSession();
  const isAdmin = session.user?.role === 'admin';
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const settingsViews: Array<View['type']> = ['drivers', 'admins', 'vehicles'];
    if (settingsViews.includes(currentView.type)) {
      setIsSettingsOpen(true);
    }
  }, [currentView]);

  const handleItemClick = (view: View) => {
    setView(view);
    setIsOpen(false); // Fecha a sidebar ao selecionar um item no modo mobile
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>
      
      {/* Main Sidebar */}
      <aside className={`w-64 bg-slate-800 p-4 flex flex-col fixed top-0 left-0 h-full z-40 transform transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center mb-8">
          <ICONS.trip className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-bold ml-2 text-white">Gestão Fretes</h1>
        </div>
        <nav>
          <ul className="space-y-2">
            <NavItem
              icon={<ICONS.dashboard />}
              label="Dashboard"
              isActive={currentView.type === 'dashboard'}
              onClick={() => handleItemClick({ type: 'dashboard' })}
            />
            <NavItem
              icon={<ICONS.trip />}
              label="Viagens"
              isActive={currentView.type === 'tripList' || currentView.type === 'newTrip' || currentView.type === 'editTrip' || currentView.type === 'viewTrip' || currentView.type === 'activeTrip'}
              onClick={() => handleItemClick({ type: 'tripList' })}
            />
            {isAdmin && (
              <>
                <NavItem
                  icon={<ICONS.currencyDollar />}
                  label="Contas a Pagar"
                  isActive={currentView.type === 'accountsPayable'}
                  onClick={() => handleItemClick({ type: 'accountsPayable' })}
                />
                <NavItem
                  icon={<ICONS.chartBar />}
                  label="Faturamento"
                  isActive={currentView.type === 'billing'}
                  onClick={() => handleItemClick({ type: 'billing' })}
                />
                <NavItem
                  icon={<ICONS.chartPie />}
                  label="Análise de Frota"
                  isActive={currentView.type === 'analysis'}
                  onClick={() => handleItemClick({ type: 'analysis' })}
                />
              </>
            )}
          </ul>
        </nav>
        <div className="mt-auto">
          {isAdmin && (
             <nav className="mb-4">
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                      className="flex items-center justify-between w-full p-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <div className="flex items-center">
                        <ICONS.settings className="w-6 h-6" />
                        <span className="ml-3 font-medium">Configurações</span>
                      </div>
                      <ICONS.chevronDown className={`w-5 h-5 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isSettingsOpen && (
                      <ul className="pl-6 mt-2 space-y-2">
                        <NavItem
                          icon={<ICONS.driver />}
                          label="Motoristas"
                          isActive={currentView.type === 'drivers'}
                          onClick={() => handleItemClick({ type: 'drivers' })}
                        />
                        <NavItem
                          icon={<ICONS.users />}
                          label="Administradores"
                          isActive={currentView.type === 'admins'}
                          onClick={() => handleItemClick({ type: 'admins' })}
                        />
                        <NavItem
                          icon={<ICONS.vehicle />}
                          label="Veículos"
                          isActive={currentView.type === 'vehicles'}
                          onClick={() => handleItemClick({ type: 'vehicles' })}
                        />
                      </ul>
                    )}
                  </li>
                </ul>
            </nav>
          )}
           <Button onClick={() => handleItemClick({ type: 'newTrip' })} className="w-full">
              <ICONS.plus className="w-5 h-5 mr-2" />
              Nova Viagem
          </Button>
        </div>
      </aside>
    </>
  );
};