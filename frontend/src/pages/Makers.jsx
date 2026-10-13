import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Award, ShieldCheck, Sparkles, MapPin, Leaf, ArrowRight, Search, Phone, Mail, Store } from 'lucide-react';
import { getProductImage, PRODUCT_PLACEHOLDER } from '../utils/productImages';

const Makers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'shg', 'women', 'verified'

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/auth/sellers');
        if (data.success) {
          setSellers(data.sellers || []);
        }
      } catch (err) {
        console.error('Error fetching sellers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, []);

  const filteredSellers = sellers.filter((seller) => {
    const sp = seller.sellerProfile || {};
    const matchesSearch =
      (seller.name && seller.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sp.businessName && sp.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sp.category && sp.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (seller.address && seller.address.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'shg') return sp.isSHG;
    if (selectedFilter === 'women') return sp.isWomenEntrepreneur;
    if (selectedFilter === 'verified') return sp.isVerified;
    return true;
  });

  return (
    <div className="bg-[#FBFBFA] min-h-screen pb-20 space-y-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-emerald-950 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-yellow-500/10 border border-yellow-500/20 px-3.5 py-1.5 rounded-full text-yellow-300 text-xs font-semibold uppercase tracking-wider">
            <Award className="h-4 w-4 mr-1" /> Meet the Makers Directory
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight leading-tight">
            Discover Local Growers & Artisans
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Every seller has a unique journey. Learn about our verified women entrepreneurs, self-help groups (SHGs), and green home cultivators cultivating sustainable products near you.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Filter & Search Bar */}
        <div className="bg-white border border-organic-200 p-4 sm:p-6 rounded-3xl shadow-sm space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by maker name, business, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-organic-50/50 border border-organic-200 rounded-2xl focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: 'All Makers' },
              { key: 'women', label: '🌸 Women Entrepreneurs' },
              { key: 'shg', label: '🤝 SHG Groups' },
              { key: 'verified', label: '🛡️ Verified Sellers' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedFilter(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === tab.key
                    ? 'bg-primary-700 text-white shadow-sm'
                    : 'bg-organic-50 hover:bg-organic-100 text-slate-600 border border-organic-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sellers Grid */}
        {loading ? (
          <div className="text-center py-24 space-y-3 font-semibold animate-pulse text-slate-500">
            <Leaf className="h-8 w-8 text-primary-600 animate-spin mx-auto" />
            <p>Loading maker profiles...</p>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="text-center py-20 bg-white border border-organic-200 rounded-3xl space-y-3">
            <Store className="h-10 w-10 text-organic-300 mx-auto" />
            <p className="font-display font-bold text-slate-700 text-base">No makers found matching your criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSellers.map((seller) => {
              const sp = seller.sellerProfile || {};
              return (
                <div
                  key={seller._id}
                  className="bg-white border border-organic-200 rounded-3xl p-6 sm:p-8 hover:shadow-xl hover:border-primary-300 transition-all flex flex-col justify-between space-y-6 group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="bg-primary-50 border border-primary-100 p-3.5 rounded-2xl group-hover:scale-105 transition-transform duration-300">
                        <Leaf className="h-6 w-6 text-primary-700" />
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {sp.isSHG && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                            SHG
                          </span>
                        )}
                        {sp.isWomenEntrepreneur && (
                          <span className="bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                            Women Led
                          </span>
                        )}
                        {sp.isVerified && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center space-x-0.5">
                            <ShieldCheck className="h-3 w-3 inline" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h2 className="font-display font-extrabold text-xl text-slate-900 group-hover:text-primary-700 transition-colors">
                        {sp.businessName || seller.name}
                      </h2>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        By {seller.name} · {sp.category || 'Grower'}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {sp.story || sp.description || 'Dedicated to organic cultivation, sustainable propagation, and eco-friendly nursery practices.'}
                    </p>

                    {seller.address && (
                      <div className="flex items-center text-xs text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-primary-500 mr-1 flex-shrink-0" />
                        <span className="truncate">{seller.address}</span>
                      </div>
                    )}

                    {/* Mini Product Previews */}
                    {seller.featuredProducts && seller.featuredProducts.length > 0 && (
                      <div className="pt-2 border-t border-organic-100 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Featured Produce & Plants ({seller.productCount || seller.featuredProducts.length}):
                        </span>
                        <div className="flex gap-2">
                          {seller.featuredProducts.map((p) => (
                            <div
                              key={p._id}
                              className="w-12 h-12 rounded-xl bg-organic-50 border border-organic-200 overflow-hidden flex-shrink-0"
                            >
                              <img
                                src={getProductImage(p)}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = PRODUCT_PLACEHOLDER; }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/meet/${seller._id}`}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-2xl text-center flex items-center justify-center space-x-2 transition-all shadow-sm"
                  >
                    <span>View Maker Profile & Story</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Makers;
