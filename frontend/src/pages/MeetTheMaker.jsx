import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Leaf, ShieldCheck, Sparkles, MapPin, Mail, Phone, Star, ArrowLeft } from 'lucide-react';
import { getProductImage, PRODUCT_PLACEHOLDER } from '../utils/productImages';

const MeetTheMaker = () => {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/auth/seller/${id}`);
        if (data.success) {
          setSeller(data.seller);
          setProducts(data.products || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Seller not found');
      } finally {
        setLoading(false);
      }
    };
    fetchSeller();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Leaf className="h-8 w-8 text-primary-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading seller profile...</p>
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4 bg-white border border-organic-200 p-10 rounded-3xl shadow-xl max-w-sm">
          <div className="bg-red-50 text-red-600 p-3 rounded-2xl inline-block">
            <Leaf className="h-8 w-8" />
          </div>
          <h2 className="font-display font-bold text-xl text-slate-900">Seller Not Found</h2>
          <p className="text-sm text-slate-500">{error || 'The seller profile you are looking for does not exist or has been removed.'}</p>
          <Link to="/marketplace" className="inline-flex items-center text-primary-700 hover:text-primary-800 font-semibold text-sm mt-2">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const sp = seller.sellerProfile || {};

  return (
    <div className="bg-[#FBFBFA] min-h-screen pb-20">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-emerald-950 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <Link to="/marketplace" className="inline-flex items-center text-emerald-400 hover:text-white text-xs font-semibold mb-6 transition-colors">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Marketplace
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="bg-emerald-500/20 border-2 border-emerald-400/30 p-5 rounded-2xl">
              <Leaf className="h-10 w-10 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <span className="text-xxs text-emerald-400 uppercase font-bold tracking-widest">Meet the Maker</span>
              <h1 id="seller-name" className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
                {sp.businessName || seller.name}
              </h1>
              <p className="text-slate-300 text-sm">By {seller.name} · {sp.category || 'Grower'}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {sp.isSHG && (
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xxs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center space-x-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>SHG Group</span>
                  </span>
                )}
                {sp.isWomenEntrepreneur && (
                  <span className="bg-pink-500/20 text-pink-300 border border-pink-400/30 text-xxs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center space-x-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Women Entrepreneur</span>
                  </span>
                )}
                {sp.isVerified && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xxs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center space-x-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verified Seller</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-12">
        {/* Story & Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seller Story */}
          <div className="lg:col-span-2 bg-white border border-organic-200 p-8 rounded-3xl shadow-lg shadow-organic-100/50 space-y-5">
            <h2 className="font-display font-bold text-xl text-slate-900">Our Story</h2>
            <p className="text-slate-600 leading-relaxed">
              {sp.story || 'This seller has not shared their story yet. Check back soon!'}
            </p>
            {seller.sustainabilityScore > 0 && (
              <div className="bg-organic-50 border border-organic-100 p-4 rounded-2xl flex items-center space-x-4">
                <div className="bg-emerald-100 text-emerald-800 p-3 rounded-xl">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-sm">Sustainability Score</span>
                  <span className="text-emerald-700 font-extrabold text-lg ml-2">{seller.sustainabilityScore}</span>
                </div>
              </div>
            )}
          </div>

          {/* Contact Card */}
          <div className="bg-white border border-organic-200 p-8 rounded-3xl shadow-lg shadow-organic-100/50 space-y-5">
            <h2 className="font-display font-bold text-xl text-slate-900">Contact Details</h2>
            <div className="space-y-4">
              {seller.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-600">{seller.address}</span>
                </div>
              )}
              {seller.email && (
                <div className="flex items-start space-x-3">
                  <Mail className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-600">{seller.email}</span>
                </div>
              )}
              {seller.phoneNumber && (
                <div className="flex items-start space-x-3">
                  <Phone className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-600">{seller.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-2xl text-primary-950">
              Products by {sp.businessName || seller.name}
            </h2>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider bg-organic-50 border border-organic-100 px-3 py-1 rounded-full">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </span>
          </div>

          {products.length === 0 ? (
            <div className="bg-white border border-organic-200 p-12 rounded-3xl text-center space-y-3">
              <Leaf className="h-8 w-8 text-organic-300 mx-auto" />
              <p className="text-slate-500 text-sm">This seller hasn't listed any products yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => (
                <Link
                  key={p._id}
                  to={`/products/${p._id}`}
                  className="group bg-white border border-organic-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary-200 transition-all duration-300"
                >
                  <div className="aspect-square bg-organic-50 overflow-hidden">
                    <img
                      src={getProductImage(p)}
                      onError={(e) => { e.target.onerror = null; e.target.src = PRODUCT_PLACEHOLDER; }}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-display font-bold text-sm text-slate-900 group-hover:text-primary-700 transition-colors truncate">
                      {p.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-primary-800 font-extrabold text-base">₹{p.price}</span>
                      {p.rating > 0 && (
                        <span className="text-xs text-slate-500 flex items-center space-x-0.5">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span>{p.rating.toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xxs uppercase font-bold tracking-wider text-slate-400">{p.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetTheMaker;
