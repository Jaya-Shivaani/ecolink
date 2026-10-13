import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf, Menu, X, User as UserIcon, LogOut, LayoutDashboard, Settings, ShoppingBag, Heart, ShoppingCart, Store, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import SellerApplicationModal from './SellerApplicationModal';
import NotificationDropdown from './NotificationDropdown';

const Header = ({ cartCount = 0 }) => {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
    setIsOpen(false);
  };

  const isAdmin = user?.roles?.admin;
  const isApprovedSeller = (user?.roles?.seller && user?.sellerStatus === 'approved') || isAdmin;
  const isPendingSeller = user?.sellerStatus === 'pending';

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.marketplace'), path: '/marketplace' },
    { name: 'Plant Adoption & Swap', path: '/adoption' },
    { name: t('nav.forum'), path: '/forum' },
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.contact'), path: '/contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="bg-[#FAF9F5] border-b border-organic-200 sticky top-0 z-50 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-primary-600 p-2 rounded-xl text-white shadow-md shadow-primary-700/20">
                  <Leaf className="h-5 w-5" />
                </div>
                <span className="font-display font-bold text-xl text-primary-900 tracking-tight">
                  Eco<span className="text-primary-600">Link</span>
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center justify-center flex-1 px-3 lg:px-6 space-x-3 lg:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`whitespace-nowrap text-xs lg:text-sm font-medium transition-colors ${
                    isActive(link.path) ? 'text-primary-600 font-bold' : 'text-slate-600 hover:text-primary-600'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {user ? (
                <div className="flex items-center space-x-3">
                  {/* Real-time Notifications Bell */}
                  <NotificationDropdown />

                  {/* Cart Icon Link */}
                  <Link to="/cart" className="p-2 text-slate-600 hover:text-primary-600 relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-slate-800 text-white rounded-full text-[9px] min-w-[16px] h-4 px-1 flex items-center justify-center font-bold leading-none">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </Link>

                  <div className="h-6 w-px bg-organic-200"></div>

                  {/* Dynamic Role-Aware Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center space-x-2 text-slate-700 hover:text-primary-700 font-medium transition-colors focus:outline-none group bg-white border border-organic-200 px-3 py-1.5 rounded-2xl shadow-sm hover:border-primary-300"
                    >
                      <div className="bg-primary-100 text-primary-700 p-1 rounded-full overflow-hidden">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <span className="text-sm truncate max-w-[130px] font-semibold">{user.name}</span>
                      <svg
                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    <div
                      className={`absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-organic-200 py-2 transition-all duration-200 origin-top-right z-50 ${
                        dropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                      }`}
                    >
                      <div className="px-4 py-2 border-b border-organic-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>

                      {/* My Profile */}
                      <Link
                        to="/buyer#profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-organic-50 hover:text-primary-600 transition-colors"
                      >
                        <UserIcon className="h-4 w-4 mr-3 text-slate-400" />
                        My Profile
                      </Link>

                      {/* Buyer Dashboard */}
                      {user.roles?.buyer !== false && (
                        <Link
                          to="/buyer"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-organic-50 hover:text-primary-600 transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 mr-3 text-slate-400" />
                          {t('nav.buyerDashboard')}
                        </Link>
                      )}

                      {/* Seller Dashboard (Only for approved sellers) */}
                      {isApprovedSeller && (
                        <Link
                          to="/seller"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-emerald-800 font-bold hover:bg-emerald-50 transition-colors"
                        >
                          <Store className="h-4 w-4 mr-3 text-emerald-600" />
                          {t('nav.sellerDashboard')}
                        </Link>
                      )}

                      {/* Start Selling / Pending Status (For non-approved sellers) */}
                      {!isApprovedSeller && !isAdmin && (
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setIsSellerModalOpen(true);
                          }}
                          className={`flex items-center w-full text-left px-4 py-2 text-sm font-bold transition-colors ${
                            isPendingSeller
                              ? 'text-amber-800 hover:bg-amber-50'
                              : 'text-primary-700 hover:bg-primary-50'
                          }`}
                        >
                          <Sparkles className={`h-4 w-4 mr-3 ${isPendingSeller ? 'text-amber-500' : 'text-primary-600'}`} />
                          <span>
                            {isPendingSeller
                              ? 'Seller Application Pending'
                              : user.sellerStatus === 'rejected'
                              ? 'Re-apply for Seller'
                              : 'Start Selling'}
                          </span>
                        </button>
                      )}

                      {/* Admin Console (Only for Admin) */}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-purple-700 font-bold hover:bg-purple-50 transition-colors border-t border-b border-purple-100 my-1 bg-purple-50/50"
                        >
                          <LayoutDashboard className="h-4 w-4 mr-3 text-purple-600" />
                          {t('nav.adminDashboard')}
                        </Link>
                      )}

                      <div className="h-px bg-organic-100 my-1"></div>

                      <Link
                        to="/buyer#orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-organic-50 hover:text-primary-600 transition-colors"
                      >
                        <ShoppingBag className="h-4 w-4 mr-3 text-slate-400" />
                        My Orders
                      </Link>

                      <Link
                        to="/buyer#wishlist"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-organic-50 hover:text-primary-600 transition-colors"
                      >
                        <Heart className="h-4 w-4 mr-3 text-red-400" />
                        Plant Wishlist
                      </Link>

                      <Link
                        to="/buyer#profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-organic-50 hover:text-primary-600 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3 text-slate-400" />
                        Settings
                      </Link>

                      <div className="h-px bg-organic-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3 text-red-400" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="text-slate-600 hover:text-primary-700 font-medium px-4 py-2 transition-colors text-sm">
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2 rounded-xl shadow-md shadow-primary-700/10 hover:shadow-primary-700/20 transform hover:-translate-y-0.5 transition-all text-sm"
                  >
                    {t('nav.signup')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {user && (
                <>
                  <NotificationDropdown />
                  <Link to="/cart" className="p-2 text-slate-500 hover:text-primary-600 relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-slate-800 text-white rounded-full text-[9px] min-w-[16px] h-4 px-1 flex items-center justify-center font-bold leading-none">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-primary-700 hover:bg-organic-100 focus:outline-none transition-colors"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-[#FAF9F5] border-t border-organic-200 px-4 pt-2 pb-4 space-y-2 shadow-inner">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2.5 rounded-xl font-medium transition-colors ${
                  isActive(link.path) ? 'bg-primary-50 text-primary-700 font-bold' : 'text-slate-600 hover:bg-organic-100 hover:text-primary-700'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Mobile Language Switcher */}
            <LanguageSwitcher mobile />

            <div className="border-t border-organic-200 my-2 pt-2">
              {user ? (
                <div className="space-y-1">
                  {!isAdmin && (
                    <Link
                      to="/buyer"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center px-3 py-2.5 rounded-xl text-slate-700 font-medium hover:bg-organic-100 transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5 mr-3 text-slate-400" />
                      {t('nav.buyerDashboard')}
                    </Link>
                  )}

                  {isApprovedSeller && (
                    <Link
                      to="/seller"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center px-3 py-2.5 rounded-xl text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      <Store className="h-5 w-5 mr-3 text-emerald-600" />
                      {t('nav.sellerDashboard')}
                    </Link>
                  )}

                  {!isApprovedSeller && !isAdmin && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setIsSellerModalOpen(true);
                      }}
                      className="flex items-center w-full text-left px-3 py-2.5 rounded-xl text-primary-800 font-bold bg-primary-50 hover:bg-primary-100 transition-colors"
                    >
                      <Sparkles className="h-5 w-5 mr-3 text-primary-600" />
                      {isPendingSeller ? t('seller.pendingTitle') : t('seller.applyToSell')}
                    </button>
                  )}

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center px-3 py-2.5 rounded-xl text-purple-700 font-bold bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5 mr-3 text-purple-500" />
                      {t('nav.adminDashboard')}
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-3 text-red-400" />
                    {t('nav.logout')} ({user.name})
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl border-2 border-primary-100 text-primary-700 font-medium text-sm hover:bg-primary-50 transition-colors"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-2.5 rounded-xl bg-primary-600 text-white font-medium text-sm hover:bg-primary-700 transition-colors shadow-md shadow-primary-700/20"
                  >
                    {t('nav.signup')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Seller Application Form Modal */}
      <SellerApplicationModal
        isOpen={isSellerModalOpen}
        onClose={() => setIsSellerModalOpen(false)}
      />
    </>
  );
};

export default Header;
