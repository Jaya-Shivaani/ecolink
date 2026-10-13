import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { languages } from '../i18n/i18n';

const LanguageSwitcher = ({ mobile = false }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('ecolink_lang', code);
    setIsOpen(false);
  };

  if (mobile) {
    return (
      <div className="pt-2 border-t border-organic-100 space-y-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-3">
          🌐 Language / மொழி / भाषा
        </span>
        <div className="grid grid-cols-2 gap-1.5 px-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={`text-xs font-semibold py-2 px-3 rounded-xl border text-left transition-all ${
                i18n.language === lang.code
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                  : 'bg-white text-slate-700 border-organic-200 hover:bg-organic-50'
              }`}
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 bg-white border border-organic-200 hover:border-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 shadow-sm transition-all focus:outline-none"
        aria-label="Select Language"
      >
        <Globe className="h-3.5 w-3.5 text-emerald-700" />
        <span>{currentLang.nativeName}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-organic-100 py-1.5 z-50 animate-fadeIn">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                i18n.language === lang.code
                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                  : 'text-slate-700 hover:bg-organic-50 hover:text-emerald-700'
              }`}
            >
              <span>{lang.nativeName}</span>
              <span className="text-[10px] text-slate-400 uppercase">{lang.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
