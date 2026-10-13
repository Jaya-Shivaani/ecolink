import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import {
  ArrowRight,
  Leaf,
  Users,
  Calendar,
  ShoppingBag,
  Award,
  Heart,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Star,
  ShieldCheck,
  Quote,
  Store,
  Clock,
  Plus,
  X,
  MessageSquare,
} from 'lucide-react';
import { getProductImage, PRODUCT_PLACEHOLDER } from '../utils/productImages';

const Landing = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    plantsSold: 0,
    plantsAdopted: 0,
    plantsExchanged: 0,
    womenSupported: 0,
    shgsActive: 0,
  });

  // Fallback product definitions for seamless display
  const DEFAULT_DECORATIVE = [
    {
      _id: 'peace-lily-decor',
      name: 'Peace Lily (Indoor Purifier)',
      category: 'Decorative / Ornamental Plants',
      yieldType: 'Decorative / Ornamental',
      description: 'Elegant white-blooming Peace Lily that thrives indoors. NASA-listed air-purifier.',
      price: 350,
      images: ['/assets/products/peace-lily.png'],
      sourceVerification: { isSourceVerified: true },
    },
    {
      _id: 'money-plant-decor',
      name: 'Money Plant (Golden Pothos)',
      category: 'Decorative / Ornamental Plants',
      yieldType: 'Decorative / Ornamental',
      description: 'Classic trailing Golden Pothos known for prosperity and powerful air filtration.',
      price: 120,
      images: ['/assets/products/money-plant.png'],
      sourceVerification: { isSourceVerified: true },
    },
    {
      _id: 'english-ivy-decor',
      name: 'English Ivy (Air Purifier)',
      category: 'Decorative / Ornamental Plants',
      yieldType: 'Decorative / Ornamental',
      description: 'Vibrant green English Ivy. Highly efficient in filtering indoor air pollutants.',
      price: 250,
      images: ['/assets/products/english-ivy.png'],
      sourceVerification: { isSourceVerified: true },
    },
    {
      _id: 'fiddle-leaf-decor',
      name: 'Fiddle Leaf Fig',
      category: 'Decorative / Ornamental Plants',
      yieldType: 'Decorative / Ornamental',
      description: 'Trendy indoor ornamental plant with large violin-shaped leaves for aesthetics.',
      price: 650,
      images: ['/assets/products/fiddle-leaf-fig.png'],
      sourceVerification: { isSourceVerified: true },
    },
  ];

  const DEFAULT_LONG_TERM = [
    {
      _id: 'coconut-long',
      name: 'Hybrid Dwarf Coconut Sapling (Chowghat Green)',
      category: 'Long-Term Yield Plants',
      yieldType: 'Long-Term Yield',
      description: 'High-yielding dwarf variety producing up to 250 coconuts per tree per year.',
      price: 450,
      images: ['/assets/products/coconut-coir-planters.png'],
      sourceVerification: { isSourceVerified: true },
    },
    {
      _id: 'mango-long',
      name: 'Alphonso Mango Grafted Sapling',
      category: 'Long-Term Yield Plants',
      yieldType: 'Long-Term Yield',
      description: 'King of mangoes. Grafted from parent tree for commercial orchard planting.',
      price: 380,
      images: ['/assets/products/fiddle-leaf-fig.png'],
      sourceVerification: { isSourceVerified: true },
    },
    {
      _id: 'amla-long',
      name: 'Indian Gooseberry (Amla) Grafted Sapling',
      category: 'Long-Term Yield Plants',
      yieldType: 'Long-Term Yield',
      description: 'Hardy Vitamin C powerhouse with dependable high yields year after year.',
      price: 220,
      images: ['/assets/products/medicinal-neem-plant.png'],
      sourceVerification: { isSourceVerified: true },
    },
    {
      _id: 'guava-long',
      name: 'Lucknow-49 Sardar Guava',
      category: 'Long-Term Yield Plants',
      yieldType: 'Long-Term Yield',
      description: 'Commercial guava yielding sweet white-fleshed fruit within 18 months.',
      price: 200,
      images: ['/assets/products/aloe-vera-plant.png'],
      sourceVerification: { isSourceVerified: true },
    },
  ];

  const DEFAULT_SHORT_TERM = [
    {
      _id: 'tomato-short',
      name: 'Country Tomato Plant (Fruiting Ready)',
      category: 'Short-Term Yield Plants',
      yieldType: 'Short-Term Yield',
      description: 'Heirloom country tomato with high fruit set, ready for harvest in 30 days.',
      price: 90,
      images: ['/assets/products/heirloom-tomato-seeds.png'],
      sourceVerification: { isSourceVerified: true },
    },
    {
      _id: 'chilli-short',
      name: 'Organic Green Chilli (Kanthari) Sapling',
      category: 'Short-Term Yield Plants',
      yieldType: 'Short-Term Yield',
      description: 'Extremely pungent native bird’s eye chilli producing continuous harvests.',
      price: 75,
      images: ['/assets/products/tulsi-seeds.png'],
      sourceVerification: { isSourceVerified: true },
    },
    {
      _id: 'spinach-short',
      name: 'Fresh Palak Greens Growing Tub',
      category: 'Short-Term Yield Plants',
      yieldType: 'Short-Term Yield',
      description: 'Cut-and-come-again spinach ready for weekly harvests in compact balconies.',
      price: 130,
      images: ['/assets/products/bottle-gourd-seeds.png'],
      sourceVerification: { isSourceVerified: true },
    },
    {
      _id: 'brinjal-short',
      name: 'Native Purple Brinjal Plant',
      category: 'Short-Term Yield Plants',
      yieldType: 'Short-Term Yield',
      description: 'High-yield traditional eggplant with tender, sweet flesh for regular curries.',
      price: 85,
      images: ['/assets/products/marigold-seed-bombs.png'],
      sourceVerification: { isSourceVerified: true },
    },
  ];

  // Dynamic products and testimonials state
  const [longTermProducts, setLongTermProducts] = useState(DEFAULT_LONG_TERM);
  const [shortTermProducts, setShortTermProducts] = useState(DEFAULT_SHORT_TERM);
  const [decorativeProducts, setDecorativeProducts] = useState(DEFAULT_DECORATIVE);
  const [fmcgProducts, setFmcgProducts] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  // Active tab in "Grow for Profit" section
  const [activeYieldTab, setActiveYieldTab] = useState('decorative'); // 'decorative' | 'longTerm' | 'shortTerm'
  // Category preview images (keyed by category label)
  const [categoryPreviews, setCategoryPreviews] = useState({});
  // Hero Plant Category Showcase
  const [heroPlantTab, setHeroPlantTab] = useState('decorative'); // 'decorative', 'longTerm', 'shortTerm'
  const heroPlants = {
    decorative: {
      id: 'decorative',
      title: 'Decorative / Ornamental Plants',
      tag: '🌸 Decorative Plants',
      badge: 'NASA Air Purifiers & Decor',
      badgeColor: 'bg-teal-50 border-teal-200 text-teal-800',
      examples: 'Peace Lily, Golden Money Plant & English Ivy',
      description: 'Lush indoor and outdoor ornamental plants that purify air and elevate living spaces.',
      image: '/assets/products/peace-lily.png',
      link: '/marketplace?category=Decorative / Ornamental Plants',
      pills: ['Air Purifying', 'Low Care', 'Indoor & Balcony'],
    },
    longTerm: {
      id: 'longTerm',
      title: 'Long-Term Yield Plants',
      tag: '🌴 Long-Term Yield',
      badge: 'High-Value Commercial Crop',
      badgeColor: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      examples: 'Coconut, Mango, Guava, Amla & fruit trees',
      description: 'Cultivated for long-term farm income and multi-year recurring harvests.',
      image: '/assets/products/coconut-coir-planters.png',
      link: '/marketplace?category=Long-Term Yield Plants',
      pills: ['Multi-Year Harvest', 'Commercial Farm', 'High ROI'],
    },
    shortTerm: {
      id: 'shortTerm',
      title: 'Short-Term Yield Plants',
      tag: '🍅 Short-Term Yield',
      badge: 'Quick Kitchen Harvest',
      badgeColor: 'bg-amber-50 border-amber-200 text-amber-800',
      examples: 'Country Tomato, Green Chilli, Brinjal & Spinach',
      description: 'Fast-growing kitchen crops ready for frequent fresh harvests in 25–45 days.',
      image: '/assets/products/heirloom-tomato-seeds.png',
      link: '/marketplace?category=Short-Term Yield Plants',
      pills: ['25–45 Days Yield', 'Kitchen Garden', 'Daily Fresh'],
    },
  };
  const [loadingDynamicData, setLoadingDynamicData] = useState(true);

  // Testimonial submission modal state
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    role: 'Workshop Participant',
    testimonialType: 'Workshop Participant Experience',
    comment: '',
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    // Grab live sustainability stats from backend API
    const fetchStats = async () => {
      try {
        const { data } = await axios.get('/api/stats');
        if (data.success) {
          setStats({
            plantsSold: data.stats.plantsSold,
            plantsAdopted: data.stats.plantsAdopted,
            plantsExchanged: data.stats.plantsExchanged,
            womenSupported: data.stats.womenEntrepreneursSupported,
            shgsActive: data.stats.shgsActive,
          });
        }
      } catch (err) {
        console.error('Error fetching platform stats:', err);
      }
    };

    // Grab dynamic products for profit sections, FMCG, and approved testimonials
    const fetchDynamicData = async () => {
      try {
        setLoadingDynamicData(true);
        const [resLong, resShort, resDecor, resFmcg, resTestimonials] = await Promise.all([
          axios.get('/api/products', { params: { yieldType: 'Long-Term Yield' } }),
          axios.get('/api/products', { params: { yieldType: 'Short-Term Yield' } }),
          axios.get('/api/products', { params: { category: 'Decorative / Ornamental Plants' } }),
          axios.get('/api/products', { params: { category: 'FMCG / Farm & Natural Products' } }),
          axios.get('/api/testimonials'),
        ]);

        if (resLong.data.success && resLong.data.products?.length > 0) {
          setLongTermProducts(resLong.data.products.slice(0, 4));
        }
        if (resShort.data.success && resShort.data.products?.length > 0) {
          setShortTermProducts(resShort.data.products.slice(0, 4));
        }
        if (resDecor.data.success && resDecor.data.products?.length > 0) {
          setDecorativeProducts(resDecor.data.products.slice(0, 4));
        } else {
          // Fallback: try fetching by yieldType or Indoor Plants
          try {
            const fallbackRes = await axios.get('/api/products', { params: { yieldType: 'Decorative / Ornamental' } });
            if (fallbackRes.data.success && fallbackRes.data.products?.length > 0) {
              setDecorativeProducts(fallbackRes.data.products.slice(0, 4));
            } else {
              const indoorRes = await axios.get('/api/products', { params: { category: 'Indoor Plants' } });
              if (indoorRes.data.success && indoorRes.data.products?.length > 0) {
                setDecorativeProducts(indoorRes.data.products.slice(0, 4));
              }
            }
          } catch (e) {
            console.error('Fallback decorative query error:', e);
          }
        }
        if (resFmcg.data.success && resFmcg.data.products?.length > 0) {
          setFmcgProducts(resFmcg.data.products.slice(0, 4));
        }
        if (resTestimonials.data.success) {
          setTestimonials(resTestimonials.data.testimonials);
        }
      } catch (err) {
        console.error('Error fetching dynamic sections:', err);
      } finally {
        setLoadingDynamicData(false);
      }
    };

    // Fetch one representative product image per category card
    const fetchCategoryPreviews = async () => {
      const categoryMap = [
        { key: 'plants', label: 'Plants & Seeds', category: 'Plants & Seeds' },
        { key: 'gardening', label: 'Gardening Products', category: 'Fertilizers' },
        { key: 'crafts', label: 'Eco-Friendly Crafts', category: 'Banana Fibre Bags' },
        { key: 'natural', label: 'Natural Products', category: 'FMCG / Farm & Natural Products' },
      ];
      try {
        const results = await Promise.all(
          categoryMap.map(({ category }) =>
            axios.get('/api/products', { params: { category } })
          )
        );
        const previews = {};
        categoryMap.forEach(({ key }, i) => {
          const res = results[i];
          if (res.data.success && res.data.products.length > 0) {
            previews[key] = res.data.products.slice(0, 4).map((p) => p.images?.[0] || '');
          } else {
            previews[key] = [];
          }
        });
        setCategoryPreviews(previews);
      } catch (err) {
        console.error('Error fetching category previews:', err);
      }
    };

    fetchStats();
    fetchDynamicData();
    fetchCategoryPreviews();
  }, []);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.comment.trim()) return;

    setFeedbackSubmitting(true);
    setFeedbackMsg('');
    try {
      const { data } = await axios.post('/api/testimonials', feedbackForm);
      if (data.success) {
        setFeedbackMsg('Thank you! Your story has been submitted for admin review.');
        setTimeout(() => {
          setFeedbackModalOpen(false);
          setFeedbackMsg('');
          setFeedbackForm({
            rating: 5,
            role: 'Workshop Participant',
            testimonialType: 'Workshop Participant Experience',
            comment: '',
          });
        }, 2000);
      }
    } catch (err) {
      setFeedbackMsg(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-emerald-950 text-white py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Leaf className="h-4 w-4 mr-1" /> {t('landing.badge')}
            </div>
            <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-white leading-tight">
              {t('landing.heroTitle')}
            </h1>
            <p className="text-slate-300 text-lg sm:text-xl max-w-xl leading-relaxed">
              {t('landing.heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all text-base"
              >
                {t('landing.exploreMarketplace')} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              {!user && (
                <Link
                  to="/signup?role=seller"
                  className="inline-flex items-center justify-center border border-slate-700 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/60 font-semibold px-8 py-4 rounded-xl transition-all text-base"
                >
                  {t('landing.becomeASeller')}
                </Link>
              )}
            </div>
          </div>
          <div className="lg:col-span-5 relative space-y-3">
            {/* Category Selector Pills */}
            <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-white/40 shadow-xl">
              {[
                { id: 'decorative', label: '🌸 Decorative' },
                { id: 'longTerm', label: '🌴 Long-Term' },
                { id: 'shortTerm', label: '🍅 Short-Term' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setHeroPlantTab(tab.id)}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                    heroPlantTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-md transform scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Plant Category Card */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/40 bg-white group">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={heroPlants[heroPlantTab].image}
                  alt={heroPlants[heroPlantTab].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => { e.target.src = PRODUCT_PLACEHOLDER; }}
                />

                {/* Top Badge */}
                <span className={`absolute top-3.5 left-3.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md border shadow-sm ${heroPlants[heroPlantTab].badgeColor}`}>
                  {heroPlants[heroPlantTab].badge}
                </span>
              </div>

              {/* Bottom Details (White Card) */}
              <div className="p-5 space-y-2.5 relative z-10 bg-white border-t border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-slate-900">
                      {heroPlants[heroPlantTab].title}
                    </h3>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      {heroPlants[heroPlantTab].examples}
                    </p>
                  </div>
                  <Link
                    to={heroPlants[heroPlantTab].link}
                    className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-md inline-flex items-center space-x-1"
                  >
                    <span>View</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {heroPlants[heroPlantTab].description}
                </p>

                {/* Highlight Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {heroPlants[heroPlantTab].pills.map((pill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sustainability Impact Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-organic-200 rounded-3xl p-8 sm:p-12 shadow-xl shadow-organic-100/50">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-primary-950">
              {t('landing.impactTitle')}
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              {t('landing.impactSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div className="space-y-2 p-4 bg-organic-50 rounded-2xl border border-organic-100">
              <span className="block text-3xl sm:text-4xl font-extrabold text-primary-800">{stats.plantsSold}</span>
              <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold">{t('landing.plantsSold')}</span>
            </div>
            <div className="space-y-2 p-4 bg-organic-50 rounded-2xl border border-organic-100">
              <span className="block text-3xl sm:text-4xl font-extrabold text-primary-800">{stats.plantsAdopted}</span>
              <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold">{t('landing.plantsAdopted')}</span>
            </div>
            <div className="space-y-2 p-4 bg-organic-50 rounded-2xl border border-organic-100">
              <span className="block text-3xl sm:text-4xl font-extrabold text-primary-800">{stats.plantsExchanged}</span>
              <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold">{t('landing.plantsSwapped')}</span>
            </div>
            <div className="space-y-2 p-4 bg-organic-50 rounded-2xl border border-organic-100">
              <span className="block text-3xl sm:text-4xl font-extrabold text-primary-800">{stats.womenSupported}</span>
              <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold">{t('landing.womenEmpowered')}</span>
            </div>
            <div className="space-y-2 p-4 bg-organic-50 rounded-2xl border border-organic-100">
              <span className="block text-3xl sm:text-4xl font-extrabold text-primary-800">{stats.shgsActive}</span>
              <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold">{t('landing.shgsSupported')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Pillars of our Digital Ecosystem */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="font-display font-extrabold text-3xl text-primary-950">A Complete Digital Ecosystem</h2>
          <p className="text-slate-500">Combining hyperlocal commerce with community engagement, circular swaps, and social empowerment.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1: Hyperlocal Search & Map */}
          <Link
            to="/marketplace?view=map"
            className="bg-white border border-organic-200 p-8 rounded-3xl hover:shadow-2xl hover:border-primary-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group cursor-pointer"
          >
            <div className="space-y-4">
              <div className="bg-primary-100 text-primary-800 p-3.5 rounded-2xl inline-block group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900 group-hover:text-primary-700 transition-colors flex items-center justify-between">
                <span>Hyperlocal Search & Map</span>
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Discover sellers within a 5-15km radius. Integrated OpenStreetMap calculations ensure low carbon delivery options and support growers nearby.
              </p>
            </div>
            <div className="pt-4 border-t border-organic-100 flex items-center text-primary-700 font-bold text-xs group-hover:text-primary-900">
              <span>Explore Hyperlocal Map</span>
              <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Pillar 2: Plant Swaps & Adoptions */}
          <Link
            to="/adoption"
            className="bg-white border border-organic-200 p-8 rounded-3xl hover:shadow-2xl hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group cursor-pointer"
          >
            <div className="space-y-4">
              <div className="bg-emerald-100 text-emerald-800 p-3.5 rounded-2xl inline-block group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center justify-between">
                <span>Plant Swaps & Adoptions</span>
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Donate overgrown plants to people in your neighbourhood or swap plant babies. Promotes zero-waste circular gardening without cash!
              </p>
            </div>
            <div className="pt-4 border-t border-organic-100 flex items-center text-emerald-700 font-bold text-xs group-hover:text-emerald-900">
              <span>Join Swaps & Adoptions</span>
              <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Pillar 3: Meet the Maker Profiles */}
          <Link
            to="/makers"
            className="bg-white border border-organic-200 p-8 rounded-3xl hover:shadow-2xl hover:border-amber-400 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group cursor-pointer"
          >
            <div className="space-y-4">
              <div className="bg-yellow-100 text-yellow-800 p-3.5 rounded-2xl inline-block group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900 group-hover:text-amber-800 transition-colors flex items-center justify-between">
                <span>Meet the Maker Profiles</span>
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Every seller profile features their personal story, location map, customer reviews, and verification badges (SHG, Women Entrepreneur).
              </p>
            </div>
            <div className="pt-4 border-t border-organic-100 flex items-center text-amber-800 font-bold text-xs group-hover:text-amber-950">
              <span>Discover Maker Profiles</span>
              <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Product Categories Section — Dynamic DB images */}
      <div className="bg-organic-100/50 border-y border-organic-200/60 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
            <div>
              <h2 className="font-display font-extrabold text-3xl text-primary-950">Shop Sustainable Categories</h2>
              <p className="text-slate-500">Every item is verified eco-friendly and packaged plastic-free.</p>
            </div>
            <Link to="/marketplace" className="inline-flex items-center text-primary-700 hover:text-primary-800 font-semibold text-sm mt-2 md:mt-0">
              View All Products <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { key: 'plants',    label: 'Plants & Seeds',       link: '/marketplace?category=Plants & Seeds',                      fallback: '/assets/products/peace-lily.png',            emoji: '🌿' },
              { key: 'gardening', label: 'Gardening Products',   link: '/marketplace?category=Fertilizers',                         fallback: '/assets/products/vermicompost-pack.png',      emoji: '🪴' },
              { key: 'crafts',    label: 'Eco-Friendly Crafts',  link: '/marketplace?category=Banana Fibre Bags',                   fallback: '/assets/products/banana-fibre-bag.png',       emoji: '🧺' },
              { key: 'natural',   label: 'Natural Products',     link: '/marketplace?category=FMCG / Farm & Natural Products',      fallback: '/assets/products/beeswax-wraps.png',          emoji: '🌾' },
            ].map(({ key, label, link, fallback, emoji }) => {
              const imgs = categoryPreviews[key] || [];
              // Pick first valid image or fall back to static asset
              const primaryImg = imgs.find((img) => img && img !== '/assets/products/product-placeholder.svg') || fallback;
              const extraImgs  = imgs.filter((img) => img && img !== primaryImg && img !== '/assets/products/product-placeholder.svg').slice(0, 3);
              return (
                <Link
                  key={key}
                  to={link}
                  className="bg-white border border-organic-200 p-5 rounded-2xl text-center group hover:border-primary-500 hover:shadow-lg transition-all flex flex-col items-center space-y-3"
                >
                  {/* Image collage */}
                  <div className="relative w-24 h-24 mx-auto">
                    {/* Primary large circle */}
                    <img
                      src={getProductImage(primaryImg)}
                      alt={label}
                      className="w-20 h-20 object-cover rounded-full border-2 border-white shadow-md absolute top-0 left-0 z-10 group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = fallback; }}
                    />
                    {/* Mini thumbnail overlays */}
                    {extraImgs[0] && (
                      <img
                        src={getProductImage(extraImgs[0])}
                        alt=""
                        className="w-9 h-9 object-cover rounded-full border-2 border-white shadow absolute bottom-0 right-0 z-20"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    {/* Emoji fallback when no DB images yet */}
                    {imgs.length === 0 && (
                      <span className="absolute bottom-0 right-0 text-xl z-20">{emoji}</span>
                    )}
                  </div>
                  <span className="font-display font-bold text-sm text-slate-900 group-hover:text-primary-700 transition-colors">
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>



      {/* ════════════════════════════════════════════════════════════════════════
          FEATURE 3: FMCG / FARM & NATURAL PRODUCTS SECTION
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-b from-amber-50/40 via-white to-organic-50/50 border-y border-organic-200/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 border border-amber-300 px-3 py-1 rounded-full">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>Locally Sourced Farm FMCG</span>
              </div>
              <h2 className="font-display font-extrabold text-3xl text-slate-900">FMCG / Farm & Natural Products</h2>
              <p className="text-slate-500 text-sm max-w-2xl">
                Raw forest honey, wood cold-pressed virgin oils, wholesome stone-ground millets, and herbal essentials created by rural farmers and women's self-help groups.
              </p>
            </div>
            <Link
              to="/marketplace?category=FMCG / Farm & Natural Products"
              className="inline-flex items-center text-primary-700 hover:text-primary-800 font-semibold text-sm mt-3 md:mt-0"
            >
              <span>Explore All FMCG Products</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fmcgProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white border border-amber-200/80 rounded-3xl overflow-hidden hover:shadow-xl hover:border-amber-400 transition-all flex flex-col group"
              >
                <div className="relative aspect-[4/3] bg-amber-50/50 overflow-hidden">
                  <img
                    src={getProductImage(product.images?.[0])}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = PRODUCT_PLACEHOLDER; }}
                  />
                  <span className="absolute top-3 left-3 bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                    Farm Fresh FMCG
                  </span>
                  {product.sourceVerification?.isSourceVerified && (
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-sm border border-amber-200">
                      <ShieldCheck className="h-3 w-3 text-amber-600" />
                      <span>Source Verified</span>
                    </span>
                  )}
                </div>
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-amber-800/70 block">
                      {product.seller?.sellerProfile?.isSHG ? 'Self Help Group Production' : 'Natural Farm Produce'}
                    </span>
                    <h3 className="font-display font-bold text-base text-slate-900 line-clamp-1 group-hover:text-amber-800 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-organic-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Price</span>
                      <span className="text-lg font-extrabold text-slate-900">₹{product.price}</span>
                    </div>
                    <Link
                      to={`/products/${product._id}`}
                      className="bg-amber-100 hover:bg-amber-600 text-amber-900 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors inline-flex items-center space-x-1"
                    >
                      <span>Order Now</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          FEATURE 8: COMMUNITY STORIES & TESTIMONIALS SECTION
      ════════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-primary-800 bg-primary-50 border border-primary-200 px-3 py-1 rounded-full">
              <Quote className="h-3.5 w-3.5 text-primary-600" />
              <span>Voices of Our Ecosystem</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl text-primary-950">
              Community Stories & Testimonials
            </h2>
            <p className="text-slate-500 text-sm max-w-2xl">
              Authentic stories from workshop participants, local cultivators, SHG leaders, and plant enthusiasts across our sustainable network.
            </p>
          </div>
          {user && (
            <button
              onClick={() => setFeedbackModalOpen(true)}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm mt-3 md:mt-0"
            >
              <Plus className="h-4 w-4" />
              <span>Share Workshop / Platform Experience</span>
            </button>
          )}
        </div>

        {testimonials.length === 0 ? (
          <div className="bg-white border border-organic-200 rounded-3xl p-12 text-center text-slate-400 text-sm">
            Loading community stories...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t) => (
              <div
                key={t._id}
                className="bg-white border border-organic-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative"
              >
                <div className="space-y-3">
                  {/* Star Rating */}
                  <div className="flex items-center space-x-1 text-amber-400">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{t.comment}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-3 border-t border-organic-100 flex items-center justify-between">
                  <div>
                    <span className="block font-bold text-xs text-slate-900">{t.name}</span>
                    <span className="block text-[10px] text-primary-700 font-semibold">{t.role}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-organic-100 text-slate-600">
                    {t.testimonialType?.replace(' Experience', '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Community Workshops & Forums Section (Existing) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="font-display font-extrabold text-3xl text-primary-950">
            Gardening Workshops & Community Forums
          </h2>
          <p className="text-slate-500 leading-relaxed">
            Exchange organic farming ideas, troubleshoot soil issues, or registers for workshops hosted by local nurseries and Self Help Groups. Let’s learn and grow together.
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
              <span className="text-sm text-slate-600 font-medium">Register for weekend gardening, composting, and zero-waste workshops.</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
              <span className="text-sm text-slate-600 font-medium">Post pictures, ask plant diagnosis questions on the community bulletin board.</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
              <span className="text-sm text-slate-600 font-medium">Corporate groups can post bulk requirements on our Bidding Board.</span>
            </div>
          </div>
          <div className="pt-2">
            <Link
              to="/forum"
              className="inline-flex items-center bg-primary-800 hover:bg-primary-950 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm"
            >
              Explore Forums & Workshops <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
        <div>
          <img
            src="/assets/products/aloe-vera-plant.png"
            alt="Workshops"
            className="rounded-3xl border border-organic-200 shadow-xl w-full object-cover aspect-[4/3]"
          />
        </div>
      </div>

      {/* FEEDBACK / TESTIMONIAL MODAL */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-organic-200 shadow-2xl relative">
            <button
              onClick={() => setFeedbackModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-organic-100"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2 text-primary-700 font-bold text-xs uppercase tracking-wider mb-1">
                <MessageSquare className="h-4 w-4" />
                <span>EcoLink Community Feedback</span>
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900">Share Your Story</h3>
              <p className="text-xs text-slate-500">
                Tell us about your workshop experience or how EcoLink has helped your home garden / business.
              </p>
            </div>

            {feedbackMsg && (
              <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {feedbackMsg}
              </div>
            )}

            <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="testimonialType" className="block font-bold text-slate-700 mb-1">Experience Type</label>
                <select
                  id="testimonialType"
                  name="testimonialType"
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl p-3 text-xs"
                  value={feedbackForm.testimonialType}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, testimonialType: e.target.value })}
                >
                  <option value="Workshop Participant Experience">Workshop Participant Experience</option>
                  <option value="Customer Experience">Customer Experience</option>
                  <option value="Farmer Experience">Farmer Experience</option>
                  <option value="SHG Member Experience">SHG Member Experience</option>
                </select>
              </div>

              <div>
                <label htmlFor="userRole" className="block font-bold text-slate-700 mb-1">Your Role / Title</label>
                <input
                  id="userRole"
                  name="userRole"
                  type="text"
                  required
                  placeholder="e.g. Balcony Gardener / Workshop Attendee"
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl p-3 text-xs"
                  value={feedbackForm.role}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, role: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="starRating" className="block font-bold text-slate-700 mb-1">Star Rating (1 to 5)</label>
                <select
                  id="starRating"
                  name="starRating"
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl p-3 text-xs"
                  value={feedbackForm.rating}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: Number(e.target.value) })}
                >
                  <option value={5}>★★★★★ (5 Stars - Outstanding)</option>
                  <option value={4}>★★★★☆ (4 Stars - Great)</option>
                  <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                  <option value={2}>★★☆☆☆ (2 Stars - Needs Improvement)</option>
                  <option value={1}>★☆☆☆☆ (1 Star - Poor)</option>
                </select>
              </div>

              <div>
                <label htmlFor="feedbackComment" className="block font-bold text-slate-700 mb-1">Your Story / Feedback</label>
                <textarea
                  id="feedbackComment"
                  name="feedbackComment"
                  required
                  rows="3"
                  placeholder="What did you learn or how did our platform assist you?"
                  className="w-full bg-[#FAF9F5] border border-organic-200 rounded-xl p-3 text-xs"
                  value={feedbackForm.comment}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                ></textarea>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="flex-1 bg-organic-100 hover:bg-organic-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {feedbackSubmitting ? 'Submitting...' : 'Submit Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
