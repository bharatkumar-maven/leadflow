import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV = [
  { to: '/',          icon: '📊', label: 'Dashboard'  },
  { to: '/leads',     icon: '👥', label: 'Leads'      },
  { to: '/tasks',     icon: '✅', label: 'Tasks'      },
  { to: '/campaigns', icon: '📢', label: 'Campaigns'  },
  { to: '/settings',  icon: '⚙️',  label: 'Settings'  },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>Lead<span>Flow</span></h2>
          <p>Smart CRM Platform</p>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to==='/'} className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div><div className="user-name">{user?.name}</div><div className="user-role">{user?.role}</div></div>
            <button className="logout-btn" onClick={() => { logout(); navigate('/login'); }} title="Logout">✕</button>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <Outlet/>
      </main>
    </div>
  );
}
