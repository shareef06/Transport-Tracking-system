/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { LogIn, UserPlus, Key, Info, HelpCircle, Shield, Radio, CheckCircle, AlertTriangle } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('PASSENGER');

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState('');
  
  // Messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Demo direct login helpers
  const handleQuickLogin = async (role: UserRole) => {
    clearMessages();
    setLoading(true);
    let email = 'passenger@gmail.com';
    let password = 'password123';
    if (role === 'OPERATOR') email = 'operator@demo.com';
    if (role === 'ADMIN') {
      email = 'sysadmin@transit.com';
      password = 'sysadminSecure2026!';
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!loginEmail || !loginPassword) {
      setError('Please fill in all credentials.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!regName || !regEmail || !regPassword || !regConfirmPassword) {
      setError('Please enter your name, email, password, and confirm password.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          role: regRole
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      setSuccess('Account created successfully! Please sign in with your credentials.');
      setLoginEmail(regEmail);
      setRegPassword('');
      setRegConfirmPassword('');
      setTimeout(() => {
        setActiveTab('login');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!forgotEmail) {
      setError('Please enter your email address.');
      return;
    }
    setSuccess('Password reset link has been simulated and sent to your email.');
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-6 px-4 font-sans text-slate-800">
      {/* Visual Header Branding */}
      <div className="text-center mb-8 max-w-lg">
        <div className="inline-flex p-3 bg-blue-100 rounded-2xl text-blue-600 mb-3 shadow-sm">
          <Radio size={36} className="animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          Transport Tracking System
        </h1>
        <p className="mt-2 text-sm text-slate-500 font-sans leading-relaxed">
          Real-time transit coordinate tracking, automated schedule ETA calculators, and operator control centers.
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Login / Register card (8 columns) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden md:col-span-7 transition-all">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50">
            <button
              onClick={() => { setActiveTab('login'); clearMessages(); }}
              className={`flex-1 py-4 text-center font-semibold text-sm transition-all flex items-center justify-center gap-2 border-b-2 ${
                activeTab === 'login'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <LogIn size={16} />
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); clearMessages(); }}
              className={`flex-1 py-4 text-center font-semibold text-sm transition-all flex items-center justify-center gap-2 border-b-2 ${
                activeTab === 'register'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <UserPlus size={16} />
              Register
            </button>
            <button
              onClick={() => { setActiveTab('forgot'); clearMessages(); }}
              className={`flex-1 py-4 text-center font-semibold text-sm transition-all flex items-center justify-center gap-2 border-b-2 ${
                activeTab === 'forgot'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Key size={16} />
              Forgot
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* Success / Error Banners */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2.5 text-sm animate-shake">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-2.5 text-sm">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. passenger@gmail.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all text-slate-800"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign In To Dashboard'}
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+12345678"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Account Role</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all text-slate-800 cursor-pointer"
                    >
                      <option value="PASSENGER">Passenger</option>
                      <option value="OPERATOR">Transport Operator</option>
                      <option value="ADMIN">System Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Create Password</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all text-slate-800"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </form>
            )}

            {/* TAB 3: FORGOT PASSWORD */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Account Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all text-slate-800"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Demo Quick Login and instructions (5 columns) */}
        <div className="space-y-6 md:col-span-5 font-sans">
          {/* Quick Login Dashboard Selector */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl text-white">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Shield className="text-blue-400" size={20} />
              1-Click Demo Login
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Bypass typing and sign in instantly using our pre-seeded roles to inspect how operators track coordinates, how passengers see ETAs, or how admins block accounts.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleQuickLogin('PASSENGER')}
                disabled={loading}
                className="w-full flex items-center justify-between p-3.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 rounded-xl text-left transition-all active:scale-[0.98] group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-sm text-slate-200">1. Passenger Dashboard</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Search bus numbers, favorite routes, submit feedback.</div>
                </div>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 group-hover:bg-blue-500/20">
                  Enter
                </span>
              </button>

              <button
                onClick={() => handleQuickLogin('OPERATOR')}
                disabled={loading}
                className="w-full flex items-center justify-between p-3.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 rounded-xl text-left transition-all active:scale-[0.98] group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-sm text-slate-200">2. Operator Dashboard</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">CRUD buses, add schedules, broadcast emergency delays.</div>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 group-hover:bg-amber-500/20">
                  Enter
                </span>
              </button>

              <button
                onClick={() => handleQuickLogin('ADMIN')}
                disabled={loading}
                className="w-full flex items-center justify-between p-3.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 rounded-xl text-left transition-all active:scale-[0.98] group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-sm text-slate-200">3. Admin Dashboard</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Generate reports, block users, build routes, trigger AI optimization.</div>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 group-hover:bg-emerald-500/20">
                  Enter
                </span>
              </button>
            </div>
          </div>

          {/* Quick FAQ / Guide */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <Info size={16} className="text-blue-500" />
              Security Specifications
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-2.5">
              Passwords on registration are mapped securely in-memory. Standard seeded account credentials use <strong>password123</strong> to simulate full security protocols.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-200">
              🛡️ <strong>System Administrator Credential Pair:</strong><br />
              Email: <code className="font-mono bg-slate-100 text-slate-800 px-1 rounded">sysadmin@transit.com</code><br />
              Password: <code className="font-mono bg-slate-100 text-slate-800 px-1 rounded">sysadminSecure2026!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
