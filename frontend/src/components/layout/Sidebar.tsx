import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, FileText, Upload, Download,
  ClipboardList, Settings, LogOut, ChevronRight, Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Catalogo', icon: Package, to: '/catalog' },
  { label: 'RdO & Trattative', icon: ClipboardList, to: '/rdo' },
  { label: 'Import CSV', icon: Upload, to: '/import' },
  { label: 'Export MePA', icon: Download, to: '/export' },
  { label: 'Ottimizzazione AI', icon: Zap, to: '/ai' },
];

const bottomItems = [
  { label: 'Impostazioni', icon: Settings, to: '/settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-foreground">MepaFlow</span>
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">MePA Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-primary' : '')} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="h-3 w-3 text-primary" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border px-3 py-3 space-y-1">
        {bottomItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* User */}
        <div className="mt-2 flex items-center gap-3 rounded-md px-3 py-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
