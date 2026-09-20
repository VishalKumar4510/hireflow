import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sparkles, Mail, Lock, ArrowRight, Loader2, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(getApiBaseUrl());
  const [testState, setTestState] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
      setShowConfig(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await login('demo@hireflow.ai', 'demo123');
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
      setShowConfig(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiUrl = async () => {
    const trimmed = customApiUrl.trim().replace(/\/+$/, '');
    setApiBaseUrl(trimmed);
    setTestState({ status: 'testing', message: 'Testing connection...' });
    const targetUrl = trimmed ? (trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`) : '/api';

    try {
      const res = await fetch(`${targetUrl}/health`);
      if (res.ok) {
        setTestState({ status: 'success', message: 'Backend connected successfully!' });
        setError('');
      } else {
        setTestState({ status: 'error', message: `Server responded with ${res.status}` });
      }
    } catch (err) {
      setTestState({
        status: 'error',
        message: 'Could not connect. Ensure your Render backend is deployed and active.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--color-navy-950)' }}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, var(--color-accent-blue), transparent)',
            top: '-200px',
            right: '-200px',
            animation: 'pulse-glow 4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, var(--color-accent-violet), transparent)',
            bottom: '-150px',
            left: '-150px',
            animation: 'pulse-glow 5s ease-in-out infinite 1s',
          }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        <div className="glass-card-static p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-1.5">HireFlow</h1>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              AI-Powered Recruitment Intelligence
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl text-xs sm:text-sm leading-relaxed" style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              color: '#fb7185',
            }}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Connection Error</p>
                  <p className="mt-1 opacity-90">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  type="email"
                  className="input-field pl-11 text-sm"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  type="password"
                  className="input-field pl-11 text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-2.5 text-sm" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--color-glass-border)' }}>
            <button
              onClick={handleDemo}
              className="btn-secondary w-full justify-center text-sm py-2.5"
              disabled={loading}
            >
              <Sparkles className="w-4 h-4" />
              Try Demo Account
            </button>
            <p className="text-[11px] text-center mt-2 font-mono text-slate-400">
              demo@hireflow.ai / demo123
            </p>
          </div>

          {/* Backend Connection Settings Toggle */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center justify-between w-full transition"
            >
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span>Backend API URL</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono underline">
                {showConfig ? 'Hide' : 'Configure'}
              </span>
            </button>

            {showConfig && (
              <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs animate-fade-in">
                <p className="text-[11px] text-slate-400">
                  Paste your Render backend URL (e.g. <code className="text-blue-300">https://hireflow-backend.onrender.com</code>):
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customApiUrl}
                    onChange={e => setCustomApiUrl(e.target.value)}
                    placeholder="https://hireflow-backend.onrender.com"
                    className="input-field text-xs py-1.5 px-2.5 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleSaveApiUrl}
                    disabled={testState.status === 'testing'}
                    className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0"
                  >
                    {testState.status === 'testing' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                  </button>
                </div>
                {testState.message && (
                  <p className={`text-[11px] flex items-center gap-1 mt-1 ${testState.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {testState.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {testState.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center mt-4 text-[11px] text-slate-500">
          HireFlow assists recruiters with evidence-based insights.
          <br />All hiring decisions remain with you.
        </p>
      </div>
    </div>
  );
}

