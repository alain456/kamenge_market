import React, { useState } from 'react';
import {
  Search,
  Bell,
  Menu,
  ShieldCheck,
  ChevronDown,
  Moon,
  Sun,
  UserCog,
} from 'lucide-react';
import { usePermissions } from '../../context/AuthContext';

interface TopbarProps {
  onToggleMobileMenu?: () => void;
  selectedPeriod?: 'weekly' | 'monthly' | 'yearly';
  onPeriodChange?: (period: 'weekly' | 'monthly' | 'yearly') => void;
  globalSearchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileMenu,
  selectedPeriod = 'monthly',
  onPeriodChange,
  globalSearchQuery = '',
  onSearchChange,
}) => {
  const { currentUser, currentRole, roles, switchRole } = usePermissions();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [language, setLanguage] = useState<'FR' | 'EN' | 'SW'>('FR');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <header className="flex flex-col lg:flex-row items-center justify-between gap-4 py-3 px-2 mb-2 relative z-50">
      {/* Left side: Hamburger (mobile) + User Greeting */}
      <div className="flex items-center gap-3 w-full lg:w-auto">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 bg-white rounded-xl shadow-xs text-gray-600 hover:text-gray-900"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt="Avatar"
            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white shadow-xs"
          />
          <div>
            <h2 className="text-lg lg:text-xl font-extrabold text-gray-900 leading-tight">
              Bonjour, {currentUser?.fullName.split(' ')[0] || 'Utilisateur'}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span>{currentRole?.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                En ligne
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Rounded Pill Search Input */}
      <div className="w-full lg:max-w-xs xl:max-w-sm flex-1 mx-4">
        <div className="relative">
          <input
            type="text"
            value={globalSearchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Rechercher un commerçant, local, facture..."
            className="w-full bg-white rounded-full py-2.5 pl-5 pr-10 text-xs font-semibold text-gray-800 placeholder-gray-400 shadow-xs border border-gray-100 focus:outline-none focus:ring-2 focus:ring-mint-500/40"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-4 top-3" />
        </div>
      </div>

      {/* Right side: Time Period Pill Selector + Action Icons */}
      <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto">

        {/* Time Period Selector Pills matching exact image design */}
        <div className="bg-white p-1 rounded-full shadow-xs border border-gray-100 flex items-center gap-1">
          <button
            onClick={() => onPeriodChange && onPeriodChange('weekly')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
              selectedPeriod === 'weekly'
                ? 'bg-mint-500 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => onPeriodChange && onPeriodChange('monthly')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
              selectedPeriod === 'monthly'
                ? 'bg-mint-500 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => onPeriodChange && onPeriodChange('yearly')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
              selectedPeriod === 'yearly'
                ? 'bg-mint-500 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Année
          </button>
        </div>

        {/* Language Selector */}
        <div className="hidden sm:flex bg-white p-1 rounded-full shadow-xs border border-gray-100 items-center gap-0.5">
          {['FR', 'EN', 'SW'].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang as any)}
              className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                language === lang
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Role Switcher Demo */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="p-2.5 bg-white text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full shadow-xs border border-gray-100 transition-colors relative group"
            title="Simuler un rôle de démo"
          >
            <UserCog className="w-4 h-4" />
            {/* Tooltip */}
            <span className="absolute top-10 right-0 w-32 text-[10px] bg-gray-800 text-white p-1 rounded text-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
              Mode démo
            </span>
          </button>
          
          {showRoleSwitcher && (
            <div className="absolute right-0 top-12 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-3 bg-emerald-50 border-b border-emerald-100">
                <p className="text-xs font-bold text-emerald-800">Changer de profil (Démo)</p>
                <p className="text-[10px] text-emerald-600">Simuler une connexion</p>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => {
                      switchRole(role.id);
                      setShowRoleSwitcher(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors mb-1 ${
                      currentRole?.id === role.id ? 'bg-mint-50 text-mint-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {role.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2.5 bg-white text-gray-600 hover:text-gray-900 rounded-full shadow-xs border border-gray-100 transition-colors"
          title="Basculer le thème"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <button
          className="relative p-2.5 bg-white text-gray-600 hover:text-gray-900 rounded-full shadow-xs border border-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>


        {/* Profile Avatar */}
        <img
          src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
          alt="User Profile"
          className="w-9 h-9 rounded-full object-cover ring-2 ring-mint-400 shadow-xs hidden sm:block"
        />
      </div>
    </header>
  );
};
