import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Users,
  FileText,
  CalendarCheck,
  CreditCard,
  AlertOctagon,
  Calculator,
  BarChart3,
  UserCheck,
  Settings,
  History,
  Rocket,
  LogOut,
  X,
} from 'lucide-react';
import { usePermissions } from '../../context/AuthContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { logout, currentUser, hasPermission, canAccessDomain } = usePermissions();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, show: true },
    { to: '/commerce', label: 'Commerce', icon: Store, show: canAccessDomain('commerce') },
    { to: '/espaces', label: 'Espaces', icon: LayoutDashboard, show: canAccessDomain('espaces') },
    { to: '/finances', label: 'Finances', icon: Calculator, show: canAccessDomain('finances') },
    { to: '/ressources-humaines', label: 'Ressources humaines', icon: Users, show: canAccessDomain('rh') },
    { to: '/infrastructures', label: 'Infrastructures', icon: Settings, show: canAccessDomain('infrastructures') },
    { to: '/securite', label: 'Sécurité', icon: AlertOctagon, show: canAccessDomain('securite') },
    { to: '/documents', label: 'Documents', icon: FileText, show: canAccessDomain('documents') },
    { to: '/plaintes', label: 'Plaintes', icon: AlertOctagon, show: canAccessDomain('plaintes') },
    { to: '/administration/utilisateurs', label: 'Administration des accès', icon: UserCheck, show: hasPermission('rh.validate') },
  ].filter(item => item.show);

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:rounded-3xl md:my-4 md:ml-4 shadow-sm border border-gray-100 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Logo */}
        <div>
          <div className="flex items-center justify-between px-2 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-mint-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                MK
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-gray-900 tracking-tight leading-tight">
                  Mall Kamenge
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  Back-Office Admin
                </span>
              </div>
            </div>
            {mobileOpen && (
              <button
                onClick={onCloseMobile}
                className="md:hidden text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 overflow-y-auto max-h-[55vh] pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Card - Green Rocket Shortcut exact match to reference image */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex-1 flex flex-col justify-end">
          {hasPermission('commerce.create') && (
            <div className="bg-mint-500 text-white rounded-3xl p-4 text-center relative overflow-hidden shadow-md mb-4">
              {/* Circular Badge Floating Icon */}
              <div className="w-12 h-12 bg-white text-mint-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                <Rocket className="w-6 h-6 transform -rotate-45 text-mint-500" />
              </div>
              <h4 className="text-xs font-extrabold leading-tight mb-1">
                Nouveau Contrat
              </h4>
              <p className="text-[10px] text-emerald-100 font-medium leading-tight mb-3">
                Attribuer un emplacement & générer la caution
              </p>
              <button
                onClick={() => {
                  if (onCloseMobile) onCloseMobile();
                  navigate('/contracts/new');
                }}
                className="w-full bg-white text-mint-600 hover:bg-emerald-50 text-xs font-black py-2 px-3 rounded-full transition-colors shadow-xs"
              >
                Attribuer un local
              </button>
            </div>
          )}


          {/* User Profile & Logout */}
          <div className="mt-4 flex items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-200 shrink-0"
              />
              <div className="truncate min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {currentUser?.fullName || 'Utilisateur'}
                </p>
                <p className="text-[10px] font-semibold text-gray-400 truncate">
                  {currentUser?.roleId}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Déconnexion"
              className="text-gray-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
