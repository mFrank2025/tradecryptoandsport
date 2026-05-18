import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  Calendar,
  Dumbbell,
  BarChart2,
  Settings,
  Zap,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/teams', icon: Shield, label: 'Squadre' },
  { to: '/players', icon: Users, label: 'Giocatori' },
  { to: '/matches', icon: Calendar, label: 'Partite' },
  { to: '/training', icon: Dumbbell, label: 'Allenamenti' },
  { to: '/analysis', icon: BarChart2, label: 'Analisi AI' },
  { to: '/settings', icon: Settings, label: 'Impostazioni' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-sm">Football</span>
            <span className="text-emerald-400 font-bold text-sm"> Analyzer</span>
            <div className="text-xs text-gray-500">Analisi Tattica AI</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0 w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-600 text-center">
          v1.0.0 · Football Analyzer
        </div>
      </div>
    </aside>
  );
}
