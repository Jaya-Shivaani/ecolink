import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone, MapPin, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo / Story */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-primary-600 p-2 rounded-xl text-white">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-xl text-white tracking-tight">
                Eco<span className="text-primary-400">Link</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t('footer.mission')}
            </p>
            <div className="flex space-x-2">
              <span className="text-xxs uppercase tracking-wider font-semibold text-primary-400 bg-primary-950/80 border border-primary-800 px-2.5 py-1 rounded-full">
                SHG Supported
              </span>
              <span className="text-xxs uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 rounded-full">
                Zero Plastic Packing
              </span>
            </div>
          </div>

          {/* Core Categories */}
          <div>
            <h3 className="text-white font-display font-semibold text-sm tracking-wider uppercase mb-4">{t('nav.marketplace')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/marketplace?category=Indoor Plants" className="hover:text-primary-400 transition-colors">Indoor Plants</Link></li>
              <li><Link to="/marketplace?category=Medicinal Plants" className="hover:text-primary-400 transition-colors">Medicinal Plants</Link></li>
              <li><Link to="/marketplace?category=Banana Fibre Bags" className="hover:text-primary-400 transition-colors">Artisan Handicrafts</Link></li>
              <li><Link to="/marketplace?category=Fertilizers" className="hover:text-primary-400 transition-colors">Organic Fertilizers</Link></li>
            </ul>
          </div>

          {/* Exchange/Community */}
          <div>
            <h3 className="text-white font-display font-semibold text-sm tracking-wider uppercase mb-4">{t('footer.communityLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/adoption" className="hover:text-primary-400 transition-colors">{t('nav.adoption')}</Link></li>
              <li><Link to="/exchange" className="hover:text-primary-400 transition-colors">{t('nav.exchange')}</Link></li>
              <li><Link to="/forum" className="hover:text-primary-400 transition-colors">{t('nav.forum')}</Link></li>
              <li><Link to="/business-requests" className="hover:text-primary-400 transition-colors">{t('nav.businessRequests')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-display font-semibold text-sm tracking-wider uppercase mb-4">{t('nav.contact')}</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start space-x-2">
                <MapPin className="h-4.5 w-4.5 text-primary-500 mt-0.5 flex-shrink-0" />
                <span>Main Road, Kovilpatti, Tamil Nadu - 628501</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4.5 w-4.5 text-primary-500 flex-shrink-0" />
                <span>support@ecolink.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4.5 w-4.5 text-primary-500 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} EcoLink Hyperlocal Marketplace. {t('footer.rights')}</p>
          <p className="flex items-center">
            Made with <Heart className="h-3 w-3 text-red-500 mx-1 fill-red-500" /> for Sustainable Communities.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
