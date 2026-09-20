import { useState } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, Briefcase, Search, ClipboardList,
  LogOut, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/jobs/new', icon: Briefcase, label: 'Create Job' },
  { path: '/search', icon: Search, label: 'Search' },
  { path: '/audit', icon: ClipboardList, label: 'Audit Trail' },
];

export default function Layout() {
  const { isAuthenticated, recruiter, logout, loading } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-navy-950)' }}>
        <div className="animate-pulse-glow glass-card-static p-8">
          <Sparkles className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-accent-blue)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading HireFlow...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-navy-950)' }}>
      {/* Sidebar */}
      <aside
        className="glass-card-static flex flex-col border-r"
        style={{
          width: collapsed ? '72px' : '260px',
          borderRadius: 0,
          borderLeft: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b" style={{ borderColor: 'var(--color-glass-border)' }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center gradient-bg"
            style={{ flexShrink: 0 }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold gradient-text">HireFlow</h1>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>AI Recruitment Intelligence</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5" style={{ flexShrink: 0 }} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User / Collapse */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--color-glass-border)' }}>
          {!collapsed && recruiter && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {(recruiter as Record<string, string>).name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                {(recruiter as Record<string, string>).email}
              </p>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button onClick={logout} className="btn-ghost flex-1" title="Logout">
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Logout</span>}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="btn-ghost"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto" style={{ maxHeight: '100vh' }}>
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
