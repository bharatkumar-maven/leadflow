import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('password123');
  const [showPwd, setShowPwd] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) { toast.success('Welcome back!'); navigate('/dashboard'); }
    else toast.error(result.message);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Zap size={28} color="white" />
          </div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.5px' }}>LeadFlow CRM</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Multi-channel lead management & automation</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ background: '#111128', border: '1px solid #1e1e3a', borderRadius: 16, padding: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#9ca3af', marginBottom: 8 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
              style={{ width: '100%', padding: '10px 14px', background: '#0d0d1a', border: '1px solid #2d2d4e', borderRadius: 8, color: '#e0e0e0', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 24, position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#9ca3af', marginBottom: 8 }}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type={showPwd ? 'text' : 'password'} required
              style={{ width: '100%', padding: '10px 40px 10px 14px', background: '#0d0d1a', border: '1px solid #2d2d4e', borderRadius: 8, color: '#e0e0e0', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
            <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: 36, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" disabled={isLoading} style={{
            width: '100%', padding: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
            borderRadius: 8, color: 'white', fontWeight: 600, fontSize: 15, cursor: 'pointer', opacity: isLoading ? 0.7 : 1
          }}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', color: '#4b5563', fontSize: 12, marginTop: 16 }}>
          Default: admin@company.com / password123
        </p>
      </div>
    </div>
  );
}
