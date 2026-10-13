import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Leaf, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/forgot-password', { email });
      if (data.success) {
        setSuccessMsg(data.message);
        setGeneratedOtp(data.otp); // Demo purposes: auto-filling OTP to make it easy to test
        setStep(2);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    
    // Verify OTP
    if (otp !== generatedOtp) {
      setErrorMsg('Invalid OTP. Please try again.');
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post('/api/auth/reset-password', { email, password: newPassword });
      if (data.success) {
        alert('Password reset successfully! Please login with your new password.');
        navigate('/login');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-emerald-100 blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-primary-100 blur-3xl opacity-50 pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white py-10 px-8 shadow-2xl rounded-3xl border border-organic-100">
          <div className="flex justify-center mb-6">
            <div className="bg-primary-50 p-3 rounded-2xl text-primary-600 shadow-sm border border-primary-100">
              <Leaf className="h-8 w-8" />
            </div>
          </div>
          
          <h2 className="text-center text-3xl font-display font-extrabold text-slate-900 mb-2">
            Reset Password
          </h2>
          <p className="text-center text-slate-500 text-sm mb-8">
            {step === 1 ? "Enter your email to receive a reset code." : "Enter the OTP and your new password."}
          </p>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-start space-x-2">
              <span className="block sm:inline">{errorMsg}</span>
            </div>
          )}

          {successMsg && step === 2 && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-start space-x-2">
              <ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="block sm:inline">
                {successMsg} <br/> 
                <span className="font-bold text-emerald-900 text-xs mt-1 block">For Demo Purposes: Your OTP is {generatedOtp}</span>
              </span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div>
                <label htmlFor="forgotEmail" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="forgotEmail"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="block w-full pl-10 pr-3 py-3 border border-organic-200 rounded-xl bg-organic-50 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="resetOtp" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="resetOtp"
                    name="otp"
                    type="text"
                    required
                    autoComplete="one-time-code"
                    className="block w-full pl-10 pr-3 py-3 border border-organic-200 rounded-xl bg-organic-50 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    className="block w-full pl-10 pr-3 py-3 border border-organic-200 rounded-xl bg-organic-50 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-organic-100 text-center">
            <p className="text-sm text-slate-600">
              Remember your password?{' '}
              <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700">
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
