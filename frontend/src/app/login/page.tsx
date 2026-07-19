'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader, ArrowRight, Mail, Lock, X } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { apiClient } from '../../lib/api';
import PublicWrapper from '../../components/PublicWrapper';
import Script from 'next/script';

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googlePopupActive, setGooglePopupActive] = useState(false);
  const [loginRole, setLoginRole] = useState<'STUDIO_OWNER' | 'CLIENT'>('STUDIO_OWNER');
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleGoogleLogin = async (email: string, name: string, googleId: string) => {
    setLoading(true);
    setError('');
    setGooglePopupActive(false);
    try {
      const res = await apiClient.post('/auth/google-login', {
        email,
        name,
        googleId,
        role: loginRole,
      });
      
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.studio) {
        localStorage.setItem('studio', JSON.stringify(res.data.studio));
      }
      
      window.dispatchEvent(new Event('authStateChanged'));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRealGoogleSignIn = () => {
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: '486978416692-98vmof7b7n5hrrbn6diaj7marsqrm3ar.apps.googleusercontent.com',
        scope: 'email profile',
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            setLoading(true);
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const userInfo = await userInfoRes.json();
              if (userInfo && userInfo.email) {
                handleGoogleLogin(
                  userInfo.email,
                  userInfo.name || userInfo.email.split('@')[0],
                  userInfo.sub || `google_${Date.now()}`
                );
              }
            } catch (err) {
              setError('Failed to retrieve user info from Google.');
            } finally {
              setLoading(false);
            }
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      setError('Failed to initialize Google Sign-In.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!loginEmail || !loginPassword) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      await login(loginEmail, loginPassword);
      
      // Remember email if checkbox is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', loginEmail);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Don't render login page if already authenticated
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#faf9f6' }}>
        <Loader style={{ width: 32, height: 32, color: '#c5a880', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <PublicWrapper>
      <style dangerouslySetInnerHTML={{__html: `
        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 80px);
          padding: 40px 16px;
          background: linear-gradient(135deg, #faf9f6 0%, #f5f2eb 50%, #faf9f6 100%);
          position: relative;
          overflow: hidden;
        }
        .login-page::before {
          content: '';
          position: absolute;
          top: -200px;
          right: -200px;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,168,128,0.15) 0%, transparent 70%);
          pointer-events: none;
          animation: floatOrb 8s ease-in-out infinite;
        }
        .login-page::after {
          content: '';
          position: absolute;
          bottom: -150px;
          left: -150px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,168,128,0.1) 0%, transparent 70%);
          pointer-events: none;
          animation: floatOrb 10s ease-in-out infinite reverse;
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(227,216,200,0.4);
          box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6);
          padding: 48px 40px;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .login-logo img {
          height: 40px;
          width: auto;
          object-fit: contain;
        }
        .login-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 300;
          color: #09090b;
          text-align: center;
          margin-bottom: 4px;
        }
        .login-subtitle {
          text-align: center;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 600;
          margin-bottom: 32px;
        }
        .login-input-group {
          margin-bottom: 20px;
        }
        .login-label {
          display: block;
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }
        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.3s;
        }
        .login-input {
          width: 100%;
          padding: 14px 16px 14px 44px;
          font-size: 14px;
          font-weight: 600;
          color: #09090b;
          background: rgba(250, 249, 246, 0.8);
          border: 1.5px solid #e3d8c8;
          border-radius: 12px;
          outline: none;
          transition: all 0.3s ease;
        }
        .login-input:focus {
          border-color: #c5a880;
          box-shadow: 0 0 0 3px rgba(197,168,128,0.15);
          background: #fff;
        }
        .login-input:focus + .login-input-icon,
        .login-input:focus ~ .login-input-icon {
          color: #c5a880;
        }
        .login-input::placeholder {
          color: #cbd5e1;
          font-weight: 500;
        }
        .pw-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          transition: color 0.2s;
        }
        .pw-toggle:hover {
          color: #09090b;
        }
        .login-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .remember-me input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #c5a880;
          cursor: pointer;
        }
        .remember-me span {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }
        .login-forgot a {
          font-size: 12px;
          color: #c5a880;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s;
        }
        .login-forgot a:hover {
          color: #09090b;
        }
        .login-btn {
          width: 100%;
          padding: 16px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #fff;
          background: #09090b;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          position: relative;
          overflow: hidden;
        }
        .login-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(197,168,128,0.2) 50%, transparent 100%);
          background-size: 200% 100%;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .login-btn:hover::before {
          opacity: 1;
          animation: shimmer 1.5s infinite;
        }
        .login-btn:hover {
          background: #c5a880;
          color: #09090b;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(197,168,128,0.3);
        }
        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .login-btn:disabled:hover::before {
          opacity: 0;
        }
        .login-footer {
          text-align: center;
          margin-top: 28px;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 600;
        }
        .login-footer a {
          color: #c5a880;
          font-weight: 800;
          text-decoration: none;
          transition: color 0.2s;
        }
        .login-footer a:hover {
          color: #09090b;
        }
        .login-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 12px;
          font-weight: 700;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          text-align: center;
          animation: slideUp 0.3s ease;
        }
        @media (max-width: 480px) {
          .login-card {
            padding: 32px 24px;
            border-radius: 20px;
          }
          .login-title {
            font-size: 24px;
          }
        }
      `}} />

      <div className="login-page font-poppins">
        <div className="login-card">
          <div className="login-logo">
            <img src="/logo.png" alt="Mara Photo" />
          </div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your Mara Photo studio</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="login-input-group">
              <label className="login-label">Email Address</label>
              <div className="login-input-wrap">
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  
                  className="login-input"
                  autoComplete="email"
                />
                <Mail className="login-input-icon" style={{ width: 16, height: 16 }} />
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  
                  className="login-input"
                  style={{ paddingRight: '48px' }}
                  autoComplete="current-password"
                />
                <Lock className="login-input-icon" style={{ width: 16, height: 16 }} />
                <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </label>
              <div className="login-forgot">
                <Link href="/auth/forgot-password">Forgot Password?</Link>
              </div>
            </div>

            <button id="login-submit" type="submit" disabled={loading} className="login-btn">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold font-poppins uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={() => setGooglePopupActive(true)}
              className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-[12px] bg-white text-slate-700 font-bold h-[56px] hover:bg-slate-50 hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266,9.765 C6.199,6.97 8.795,5 12,5 C13.79,5 15.353,5.64 16.587,6.728 L20.21,3.105 C18.012,1.18 15.15,0 12,0 C7.303,0 3.268,2.69 1.258,6.619 L5.266,9.765 Z" />
                <path fill="#34A853" d="M16.04,18.013 C14.95,18.73 13.565,19 12,19 C8.795,19 6.198,17.03 5.266,14.235 L1.258,17.38 C3.268,21.31 7.303,24 12,24 C15.02,24 17.756,22.925 19.825,21.05 L16.04,18.013 Z" />
                <path fill="#4285F4" d="M23.49,12.275 C23.49,11.49 23.415,10.73 23.3,10 L12,10 L12,14.515 L18.447,14.515 C18.16,16.085 17.275,17.22 16.04,18.013 L19.825,21.05 C22.037,19.01 23.49,16.005 23.49,12.275 Z" />
                <path fill="#FBBC05" d="M5.266,14.235 C5.024,13.52 4.885,12.775 4.885,12 C4.885,11.225 5.024,10.48 5.266,9.765 L1.258,6.62 C0.46,8.215 0,10.035 0,12 C0,13.965 0.46,15.785 1.258,17.38 L5.266,14.235 Z" />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="login-footer">
            Don&apos;t have an account? <Link href="/signup">Create Account</Link>
          </div>
        </div>
      </div>

      {googlePopupActive && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-scaleUp">
            <button onClick={() => setGooglePopupActive(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black mb-4">Google Sign-In</h3>
            <p className="text-sm text-slate-500 mb-4 font-medium">Use the official popup below to continue with Google.</p>
            
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">If you are new, sign up as:</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="googleRole"
                    value="STUDIO_OWNER"
                    checked={loginRole === 'STUDIO_OWNER'}
                    onChange={() => setLoginRole('STUDIO_OWNER')}
                    style={{ accentColor: '#c5a880' }}
                  />
                  Studio Owner
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="googleRole"
                    value="CLIENT"
                    checked={loginRole === 'CLIENT'}
                    onChange={() => setLoginRole('CLIENT')}
                    style={{ accentColor: '#c5a880' }}
                  />
                  Client / User
                </label>
              </div>
            </div>

            <button onClick={handleRealGoogleSignIn} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md">
              Launch Google Popup
            </button>
          </div>
        </div>
      )}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
    </PublicWrapper>
  );
}
