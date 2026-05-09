import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../utils/socket';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, MessageSquare, Megaphone, Clock,
  BarChart3, Settings, LogOut, Bell, Menu, X, Zap, Phone
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/leads', icon: Users, label: 'Leads' },
  { path: '/communications', icon: MessageSquare, label: 'Communications' },
  { path: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { path: '/followups', icon: Clock, label: 'Follow-ups' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (user?._id) socketService.joinRoom(user._id);

    socketService.on('lead_created', ({ lead }) => {
      toast.success(`New lead: ${lead.name}`, { icon: '🎯' });
      setNotifications(n => [{ id: Date.now(), type: 'lead', message: `New lead: ${lead.name}`, time: new Date() }, ...n.slice(0, 9)]);
    });
    socketService.on('whatsapp_received', ({ leadId, message }) => {
      toast(`WhatsApp message received`, { icon: '💬' });
      setNotifications(n => [{ id: Date.now(), type: 'whatsapp', message: `WhatsApp: ${message.substring(0, 50)}`, time: new Date() }, ...n.slice(0, 9)]);
    });
    socketService.on('followup_sent', ({ type }) => {
      setNotifications(n => [{ id: Date.now(), type: 'followup', message: `${type} follow-up sent`, time: new Date() }, ...n.slice(0, 9)]);
    });
    socketService.on('stale_leads_alert', ({ count }) => {
      toast.error(`${count} leads need attention!`, { duration: 6000, icon: '⚠️' });
    });
  }, [user]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0d0d1a', color: '#e0e0e0', fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '240px' : '64px', background: '#111128', borderRight: '1px solid #1e1e3a',
        transition: 'width 0.3s ease', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e1e3a', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={20} color="white" />
          </div>
          {sidebarOpen && <span style={{ fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '-0.5px' }}>LeadFlow</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink key={path} to={path} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              color: isActive ? '#a78bfa' : '#9ca3af', background: isActive ? 'rgba(167,139,250,0.1)' : 'transparent',
              textDecoration: 'none', transition: 'all 0.2s', fontWeight: isActive ? 600 : 400, fontSize: 14,
              whiteSpace: 'nowrap', overflow: 'hidden'
            })}>
              <Icon size={18} style={{ flexShrink: 0 }} />
              {sidebarOpen && label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #1e1e3a' }}>
          {sidebarOpen && (
            <div style={{ padding: '8px 12px', marginBottom: 4, borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#e0e0e0' }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px',
            borderRadius: 8, background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14
          }}>
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{ height: 56, background: '#111128', borderBottom: '1px solid #1e1e3a', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ flex: 1 }} />
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(!notifOpen)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', position: 'relative', display: 'flex' }}>
              <Bell size={20} />
              {notifications.length > 0 && <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: '#ef4444', borderRadius: '50%', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{notifications.length}</span>}
            </button>
            {notifOpen && (
              <div style={{ position: 'absolute', right: 0, top: 36, width: 320, background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, zIndex: 1000, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #2d2d4e', fontWeight: 600, fontSize: 14 }}>Notifications</div>
                {notifications.length === 0 ? <div style={{ padding: 16, color: '#6b7280', fontSize: 14 }}>No notifications</div> :
                  notifications.map(n => (
                    <div key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid #1e1e3a', fontSize: 13 }}>
                      <div style={{ color: '#e0e0e0' }}>{n.message}</div>
                      <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{new Date(n.time).toLocaleTimeString()}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </header>
        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
