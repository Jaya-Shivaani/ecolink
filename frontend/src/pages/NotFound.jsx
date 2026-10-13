import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, AlertCircle, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="bg-[#FBFBFA] min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md w-full text-center space-y-8 bg-white border border-organic-200 p-8 sm:p-12 rounded-3xl shadow-xl shadow-organic-100/50 relative overflow-hidden">
        {/* Decorative background leaf */}
        <div className="absolute -top-10 -right-10 text-organic-100/30 opacity-50 select-none pointer-events-none transform rotate-45">
          <Leaf className="w-40 h-40 fill-organic-100" />
        </div>

        {/* Error Code / Icon */}
        <div className="relative flex flex-col items-center">
          <div className="bg-red-50 text-red-600 p-4 rounded-3xl border border-red-100 mb-4 inline-block animate-bounce">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h1 id="error-code" className="font-display font-extrabold text-7xl text-primary-950 tracking-tighter">
            404
          </h1>
        </div>

        {/* Messaging */}
        <div className="space-y-3 relative z-10">
          <h2 id="error-message" className="font-display font-bold text-xl text-slate-900">
            Page Not Found / Pruned
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
            Oops! The green path you followed seems to have been pruned, moved, or never grew in our garden.
          </p>
        </div>

        {/* Navigation Action */}
        <div className="pt-4 relative z-10">
          <Link
            id="btn-error-home"
            to="/"
            className="w-full inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-emerald-700/10 hover:shadow-emerald-700/20 text-sm space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Go Back Home</span>
          </Link>
          <div className="mt-4">
            <button
              onClick={() => window.history.back()}
              className="text-xs font-semibold text-slate-500 hover:text-primary-700 inline-flex items-center space-x-1 transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Go Back Previous Page</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
