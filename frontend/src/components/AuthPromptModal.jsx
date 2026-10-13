import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, X, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AuthPromptModal = ({ isOpen, onClose, message, title }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-organic-200 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:bg-organic-100 hover:text-slate-700 transition-colors"
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
          <ShoppingBag className="h-8 w-8" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-display font-extrabold text-2xl text-slate-900">
            {title || t('auth.authRequired')}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed px-2">
            {message || t('auth.loginPromptMsg')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => handleNavigate('/login')}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            <LogIn className="h-4 w-4" />
            <span>{t('auth.login')}</span>
          </button>

          <button
            onClick={() => handleNavigate('/signup')}
            className="w-full flex items-center justify-center space-x-2 bg-organic-100 hover:bg-organic-200 text-emerald-900 font-bold py-3.5 px-6 rounded-xl border border-organic-200 transition-all active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            <span>{t('auth.signup')}</span>
          </button>

          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors pt-1"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPromptModal;
