import React from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf, Users, ShieldCheck, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-[#FBFBFA] min-h-screen pb-20">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-emerald-950 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <span className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Leaf className="h-4 w-4 mr-1 animate-pulse" /> Our Story & Mission
          </span>
          <h1 id="about-title" className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-tight leading-tight">
            Cultivating a <span className="text-emerald-400 bg-clip-text">Green & Sustainable</span> Future Together
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            EcoLink is a hyperlocal, community-first marketplace connecting plant lovers directly with home growers, rural Self Help Groups (SHGs), and women entrepreneurs.
          </p>
        </div>
      </div>

      {/* Core Mission Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-organic-200 p-8 rounded-3xl shadow-xl shadow-organic-100/50 hover:shadow-2xl transition-all duration-300 space-y-4 group">
            <div className="bg-primary-100 text-primary-800 p-4 rounded-2xl inline-block group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-slate-900">Empowering Local Growers</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              We provide micro-entrepreneurs, home growers, and Self Help Groups a digital platform to reach customers directly, bypassing traditional supply chains.
            </p>
          </div>

          <div className="bg-white border border-organic-200 p-8 rounded-3xl shadow-xl shadow-organic-100/50 hover:shadow-2xl transition-all duration-300 space-y-4 group">
            <div className="bg-emerald-100 text-emerald-800 p-4 rounded-2xl inline-block group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-slate-900">Verified Sustainability</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Every seller on EcoLink adheres to zero-plastic packaging guidelines and promotes organic growing practices, keeping our carbon footprint near zero.
            </p>
          </div>

          <div className="bg-white border border-organic-200 p-8 rounded-3xl shadow-xl shadow-organic-100/50 hover:shadow-2xl transition-all duration-300 space-y-4 group">
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-2xl inline-block group-hover:scale-110 transition-transform duration-300">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-slate-900">Zero-Waste Gardening</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Through plant swaps and adoption options, we champion a circular community economy where surplus greenery is shared instead of discarded.
            </p>
          </div>
        </div>
      </div>

      {/* Narrative Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="font-display font-extrabold text-3xl text-primary-950">
            Why Hyperlocal Matters
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Traditional horticulture transport methods rely heavily on cross-country logistics, plastic pots, chemical preservation, and massive transit footprints.
          </p>
          <p className="text-slate-600 leading-relaxed">
            By connecting you with sellers within a <b>5 to 15-kilometer radius</b>, EcoLink enables fresh, eco-packaged delivery. You support small family gardens in Kovilpatti, Ettayapuram, and local SHGs on the outskirts of Kovilpatti, while keeping shipping emissions negligible.
          </p>
          
          <div className="border-l-4 border-emerald-500 pl-4 py-2 italic text-slate-500">
            "EcoLink bridges the gap between rural production and urban demand, creating direct economic independence for women-run gardening micro-enterprises."
          </div>

          <div className="pt-4">
            <Link
              id="btn-about-shop"
              to="/marketplace"
              className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm shadow-md shadow-emerald-700/10 hover:shadow-emerald-700/20"
            >
              Shop Local Products <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-emerald-500 to-green-300 opacity-20 blur-lg"></div>
          <img
            src="/assets/products/fiddle-leaf-fig.png"
            alt="Sustainable Farming"
            className="relative rounded-3xl border border-organic-200 shadow-xl w-full object-cover aspect-[4/3] transform hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      </div>

      {/* Trust Badges section */}
      <div className="bg-organic-50 border-y border-organic-200/60 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-primary-950">Our Commitment to the Community</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white border border-organic-200 p-6 rounded-2xl shadow-sm">
              <div className="text-emerald-600 font-extrabold text-3xl mb-1">100%</div>
              <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Plastic-Free Wrapping</div>
            </div>
            <div className="bg-white border border-organic-200 p-6 rounded-2xl shadow-sm">
              <div className="text-emerald-600 font-extrabold text-3xl mb-1">SHG</div>
              <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Women Group Supported</div>
            </div>
            <div className="bg-white border border-organic-200 p-6 rounded-2xl shadow-sm">
              <div className="text-emerald-600 font-extrabold text-3xl mb-1">&lt; 15km</div>
              <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Hyperlocal Radius</div>
            </div>
            <div className="bg-white border border-organic-200 p-6 rounded-2xl shadow-sm">
              <div className="text-emerald-600 font-extrabold text-3xl mb-1">Zero</div>
              <div className="text-xs uppercase font-bold text-slate-500 tracking-wider">Chemical Pesticides</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
