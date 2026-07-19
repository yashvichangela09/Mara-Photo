'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader, ArrowRight, Upload, Mail, Lock, User as UserIcon, Phone, Store, Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { apiClient } from '../../lib/api';
import PublicWrapper from '../../components/PublicWrapper';
import Script from 'next/script';

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '#e2e8f0' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&#]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: 'Weak', color: '#ef4444' };
  if (score <= 4) return { level: 2, label: 'Medium', color: '#f59e0b' };
  return { level: 3, label: 'Strong', color: '#22c55e' };
}

export default function SignupPage() {
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regStudioName, setRegStudioName] = useState('');
  const [regWebsite, setRegWebsite] = useState('');
  const [regLogo, setRegLogo] = useState('');
  const [regRole, setRegRole] = useState<'STUDIO_OWNER' | 'CLIENT'>('STUDIO_OWNER');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);

  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const passwordStrength = getPasswordStrength(regPassword);
  const passwordsMatch = regConfirmPassword ? regPassword === regConfirmPassword : true;

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  // Debounced email check
  useEffect(() => {
    if (!regEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setEmailExists(false);
      return;
    }
    
    const timer = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const res = await apiClient.get(`/auth/check-email?email=${encodeURIComponent(regEmail)}`);
        setEmailExists(res.data.exists);
      } catch {
        setEmailExists(false);
      } finally {
        setEmailChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [regEmail]);

  const handleGoogleLogin = async (email: string, name: string, googleId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/google-login', {
        email,
        name,
        googleId,
        role: regRole,
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const requiredFields = regRole === 'STUDIO_OWNER' 
      ? (!regName || !regEmail || !regPhone || !regStudioName || !regPassword)
      : (!regName || !regEmail || !regPhone || !regPassword);

    if (requiredFields) {
      setError('All required fields must be filled.');
      setLoading(false);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!/^[6-9]\d{9}$/.test(regPhone)) {
      setError('Mobile number must be 10 digits starting with 6-9.');
      setLoading(false);
      return;
    }

    const passwordRegex = /^[A-Z](?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#]).{5,}$/;
    if (!passwordRegex.test(regPassword)) {
      setError('Password must start with a Capital letter, contain at least 1 number, 1 special character, and small letters.');
      setLoading(false);
      return;
    }

    if (emailExists) {
      setError('This email is already registered. Please login instead.');
      setLoading(false);
      return;
    }

    try {
      const subdomain = regRole === 'STUDIO_OWNER' ? regStudioName.toLowerCase().replace(/[^a-z0-9]/g, '-') : '';
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        role: regRole,
        ...(regRole === 'STUDIO_OWNER' ? {
          studioName: regStudioName,
          subdomain,
          websiteLink: regWebsite,
          logoUrl: regLogo,
        } : {})
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRegLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

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
        .signup-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 80px);
          padding: 40px 16px;
          background: linear-gradient(135deg, #faf9f6 0%, #f5f2eb 50%, #faf9f6 100%);
          position: relative;
          overflow: hidden;
        }
        .signup-page::before {
          content: '';
          position: absolute;
          top: -200px;
          left: -200px;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(197,168,128,0.15) 0%, transparent 70%);
          pointer-events: none;
          animation: floatOrb 8s ease-in-out infinite;
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .signup-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 500px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(227,216,200,0.4);
          box-shadow: 0 20px 60px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6);
          padding: 40px 36px;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .signup-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        .signup-logo img {
          height: 40px;
          width: auto;
          object-fit: contain;
        }
        .signup-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 300;
          color: #09090b;
          text-align: center;
          margin-bottom: 4px;
        }
        .signup-subtitle {
          text-align: center;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 600;
          margin-bottom: 28px;
        }
        .signup-input-group {
          margin-bottom: 16px;
        }
        .signup-label {
          display: block;
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }
        .signup-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .signup-input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.3s;
        }
        .signup-input {
          width: 100%;
          padding: 13px 16px 13px 44px;
          font-size: 14px;
          font-weight: 600;
          color: #09090b;
          background: rgba(250, 249, 246, 0.8);
          border: 1.5px solid #e3d8c8;
          border-radius: 12px;
          outline: none;
          transition: all 0.3s ease;
        }
        .signup-input:focus {
          border-color: #c5a880;
          box-shadow: 0 0 0 3px rgba(197,168,128,0.15);
          background: #fff;
        }
        .signup-input::placeholder {
          color: #cbd5e1;
          font-weight: 500;
        }
        .signup-input.input-error {
          border-color: #ef4444;
        }
        .signup-input.input-success {
          border-color: #22c55e;
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
        .pw-toggle:hover { color: #09090b; }
        .strength-bar {
          display: flex;
          gap: 4px;
          margin-top: 8px;
        }
        .strength-segment {
          height: 4px;
          flex: 1;
          border-radius: 2px;
          background: #e2e8f0;
          transition: background 0.3s;
        }
        .strength-label {
          font-size: 11px;
          font-weight: 700;
          margin-top: 4px;
          text-align: right;
        }
        .email-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          margin-top: 4px;
        }
        .match-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          margin-top: 4px;
        }
        .signup-btn {
          width: 100%;
          padding: 16px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #09090b;
          background: #c5a880;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }
        .signup-btn:hover {
          background: #09090b;
          color: #c5a880;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(9,9,11,0.2);
        }
        .signup-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .signup-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: #94a3b8;
          font-weight: 600;
        }
        .signup-footer a {
          color: #c5a880;
          font-weight: 800;
          text-decoration: none;
          transition: color 0.2s;
        }
        .signup-footer a:hover { color: #09090b; }
        .signup-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 12px;
          font-weight: 700;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          text-align: center;
          animation: slideUp 0.3s ease;
        }
        .logo-upload-area {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(250, 249, 246, 0.8);
          border: 1.5px dashed #e3d8c8;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .logo-upload-area:hover {
          border-color: #c5a880;
          background: #f5f2eb;
        }
        .logo-preview {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #e3d8c8;
        }
        .logo-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #e3d8c8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }
        .section-divider {
          border-top: 1px solid #e3d8c8;
          margin-top: 8px;
          padding-top: 16px;
          margin-bottom: 4px;
        }
        .section-label {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 12px;
        }
        @media (max-width: 480px) {
          .signup-card {
            padding: 28px 20px;
            border-radius: 20px;
          }
          .signup-title {
            font-size: 24px;
          }
        }
      `}} />

      <div className="signup-page font-poppins">
        <div className="signup-card">
          <div className="signup-logo">
            <img src="/logo.png" alt="Mara Photo" />
          </div>
          <h1 className="signup-title">Create Your Studio</h1>
          <p className="signup-subtitle">Start delivering photos with AI in minutes</p>

          {error && <div className="signup-error">{error}</div>}

          <form onSubmit={handleRegister}>
            <div className="signup-input-group">
              <label className="signup-label">Register As</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                  <input
                    type="radio"
                    name="userRole"
                    value="STUDIO_OWNER"
                    checked={regRole === 'STUDIO_OWNER'}
                    onChange={() => setRegRole('STUDIO_OWNER')}
                    style={{ accentColor: '#c5a880', width: '16px', height: '16px' }}
                  />
                  Studio Owner / Admin
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                  <input
                    type="radio"
                    name="userRole"
                    value="CLIENT"
                    checked={regRole === 'CLIENT'}
                    onChange={() => setRegRole('CLIENT')}
                    style={{ accentColor: '#c5a880', width: '16px', height: '16px' }}
                  />
                  Client / User
                </label>
              </div>
            </div>

            <div className="signup-input-group">
              <label className="signup-label">Full Name <span style={{ color: '#dc2626' }}>*</span></label>
              <div className="signup-input-wrap">
                <input id="signup-name" type="text" required value={regName} onChange={(e) => setRegName(e.target.value)}  className="signup-input" autoComplete="name" />
                <UserIcon className="signup-input-icon" style={{ width: 16, height: 16 }} />
              </div>
            </div>

            <div className="signup-input-group">
              <label className="signup-label">Email Address <span style={{ color: '#dc2626' }}>*</span></label>
              <div className="signup-input-wrap">
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  
                  className={`signup-input ${emailExists ? 'input-error' : regEmail && !emailChecking && !emailExists && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail) ? 'input-success' : ''}`}
                  autoComplete="email"
                />
                <Mail className="signup-input-icon" style={{ width: 16, height: 16 }} />
              </div>
              {regEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail) && (
                <div className="email-status">
                  {emailChecking ? (
                    <><Loader style={{ width: 12, height: 12, animation: 'spin 1s linear infinite', color: '#94a3b8' }} /> <span style={{ color: '#94a3b8' }}>Checking...</span></>
                  ) : emailExists ? (
                    <><AlertCircle style={{ width: 12, height: 12, color: '#ef4444' }} /> <span style={{ color: '#ef4444' }}>Email already registered</span></>
                  ) : (
                    <><Check style={{ width: 12, height: 12, color: '#22c55e' }} /> <span style={{ color: '#22c55e' }}>Email available</span></>
                  )}
                </div>
              )}
            </div>

            <div className="signup-input-group">
              <label className="signup-label">Mobile Number <span style={{ color: '#dc2626' }}>*</span></label>
              <div className="signup-input-wrap">
                <input id="signup-phone" type="tel" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)}  className="signup-input" autoComplete="tel" />
                <Phone className="signup-input-icon" style={{ width: 16, height: 16 }} />
              </div>
            </div>

            {regRole === 'STUDIO_OWNER' && (
              <>
                <div className="signup-input-group">
                  <label className="signup-label">Studio Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <div className="signup-input-wrap">
                    <input id="signup-studio" type="text" required value={regStudioName} onChange={(e) => setRegStudioName(e.target.value)}  className="signup-input" />
                    <Store className="signup-input-icon" style={{ width: 16, height: 16 }} />
                  </div>
                </div>

                {/* Optional Fields */}
                <div className="section-divider">
                  <p className="section-label">Optional</p>
                </div>

                <div className="signup-input-group">
                  <label className="signup-label">Studio Website Link</label>
                  <div className="signup-input-wrap">
                    <input type="url" value={regWebsite} onChange={(e) => setRegWebsite(e.target.value)}  className="signup-input" style={{ paddingLeft: '16px' }} />
                  </div>
                </div>

                <div className="signup-input-group">
                  <label className="signup-label">Studio Logo</label>
                  <label className="logo-upload-area">
                    {regLogo ? (
                      <img src={regLogo} alt="Logo" className="logo-preview" />
                    ) : (
                      <div className="logo-placeholder">
                        <Upload className="w-4 h-4" />
                      </div>
                    )}
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                      {regLogo ? 'Change logo' : 'Upload your studio logo'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  </label>
                </div>
              </>
            )}

            {/* Password Section */}
            <div className="section-divider"></div>

            <div className="signup-input-group">
              <label className="signup-label">Password <span style={{ color: '#dc2626' }}>*</span></label>
              <div className="signup-input-wrap">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  
                  className="signup-input"
                  style={{ paddingRight: '48px' }}
                  autoComplete="new-password"
                />
                <Lock className="signup-input-icon" style={{ width: 16, height: 16 }} />
                <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {regPassword && (
                <>
                  <div className="strength-bar">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="strength-segment" style={{ background: i <= passwordStrength.level ? passwordStrength.color : '#e2e8f0' }} />
                    ))}
                  </div>
                  <div className="strength-label" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </div>
                </>
              )}
            </div>

            <div className="signup-input-group">
              <label className="signup-label">Confirm Password <span style={{ color: '#dc2626' }}>*</span></label>
              <div className="signup-input-wrap">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  
                  className={`signup-input ${regConfirmPassword ? (passwordsMatch ? 'input-success' : 'input-error') : ''}`}
                  style={{ paddingRight: '48px' }}
                  autoComplete="new-password"
                />
                <Lock className="signup-input-icon" style={{ width: 16, height: 16 }} />
                <button type="button" className="pw-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {regConfirmPassword && (
                <div className="match-status">
                  {passwordsMatch ? (
                    <><Check style={{ width: 12, height: 12, color: '#22c55e' }} /> <span style={{ color: '#22c55e' }}>Passwords match</span></>
                  ) : (
                    <><X style={{ width: 12, height: 12, color: '#ef4444' }} /> <span style={{ color: '#ef4444' }}>Passwords do not match</span></>
                  )}
                </div>
              )}
            </div>

            <button id="signup-submit" type="submit" disabled={loading || emailExists} className="signup-btn">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold font-poppins uppercase tracking-widest">OR</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={handleRealGoogleSignIn}
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

          <div className="signup-footer">
            Already have an account? <Link href="/login">Sign In</Link>
          </div>
        </div>
      </div>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
    </PublicWrapper>
  );
}
