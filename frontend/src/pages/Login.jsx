import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const { login, loginWithGoogle, error, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    const trimmedEmail = email ? email.trim() : '';
    if (!trimmedEmail || !password) {
      setLocalError(t('auth.enterEmailPass'));
      return;
    }

    setLoading(true);

    const res = await login(trimmedEmail, password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setLocalError(res.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError('');
    setLoading(true);
    const res = await loginWithGoogle();
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setLocalError(res.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white border border-organic-200 rounded-3xl p-8 shadow-xl shadow-organic-100/50 space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-primary-600 p-3 rounded-2xl inline-block text-white mb-2 shadow-lg shadow-primary-700/20">
            <Leaf className="h-6 w-6" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-primary-950">{t('auth.welcomeBack')}</h2>
          <p className="text-sm text-slate-500">{t('auth.loginSubtitle')}</p>
        </div>

        {(localError || error) && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="loginEmail" className="block text-sm font-semibold text-slate-700 mb-1.5">{t('common.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                id="loginEmail"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-organic-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm bg-organic-50"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="loginPassword" className="block text-sm font-semibold text-slate-700">{t('auth.password', { defaultValue: 'Password' })}</label>
              <Link to="/forgot-password" className="text-xs text-primary-700 hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                id="loginPassword"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-organic-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm bg-organic-50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-700/10 hover:shadow-primary-700/20 transition-all text-sm mt-2 disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('auth.login')}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-organic-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xxs uppercase font-bold tracking-wider">{t('auth.orContinueWith')}</span>
          <div className="flex-grow border-t border-organic-200"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 border border-organic-200 rounded-xl shadow-sm hover:shadow transition-all text-sm flex items-center justify-center space-x-3 disabled:opacity-50"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{t('auth.googleSignIn')}</span>
        </button>

        <div className="text-center text-xs text-slate-500 border-t border-organic-100 pt-4">
          {t('auth.dontHaveAccount')}{' '}
          <Link to="/signup" className="text-primary-700 font-bold hover:underline">
            {t('auth.signup')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
