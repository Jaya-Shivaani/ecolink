import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { Briefcase, AlertCircle, PlusCircle, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BusinessRequests = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [biddingId, setBiddingId] = useState(null); // Which request the seller is bidding on

  // Request Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Indoor Plants',
    quantityRequired: 50,
    targetPrice: 150,
    deadline: '',
  });

  // Bid Form state (Seller)
  const [bidPrice, setBidPrice] = useState('');
  const [bidDays, setBidDays] = useState('');
  const [bidNotes, setBidNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/business/requests');
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const { data } = await axios.post('/api/business/requests', formData);
      if (data.success) {
        setModalOpen(false);
        setFormData({ title: '', description: '', category: 'Indoor Plants', quantityRequired: 50, targetPrice: 150, deadline: '' });
        fetchRequests();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit request');
    }
  };

  const handleCreateBid = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const { data } = await axios.post(`/api/business/requests/${biddingId}/quotes`, {
        priceQuoted: Number(bidPrice),
        deliveryDays: Number(bidDays),
        notes: bidNotes,
      });
      if (data.success) {
        alert('Quotation submitted successfully to the customer!');
        setBiddingId(null);
        setBidPrice('');
        setBidDays('');
        setBidNotes('');
        fetchRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to quote');
    }
  };

  const handleUpdateQuote = async (requestId, quoteId, status) => {
    try {
      const { data } = await axios.put(`/api/business/requests/${requestId}/quotes/${quoteId}`, { status });
      if (data.success) {
        alert(`Quotation successfully ${status.toLowerCase()}ed! Order negotiations finalized.`);
        fetchRequests();
      }
    } catch (err) {
      alert('Failed to update quote status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-primary-950 flex items-center space-x-2">
            <Briefcase className="h-7 w-7 text-emerald-600" />
            <span>Business Requirement Board</span>
          </h1>
          <p className="text-slate-500 text-sm">Post bulk requests for events, hotels, or corporate gifting. Sellers submit custom quotes.</p>
        </div>
        {user && user.role === 'buyer' && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow transition-all"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            <span>Post Bulk Requirement</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 font-semibold animate-pulse">Loading bulk board...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white border border-organic-200 rounded-3xl">
          <p className="text-slate-500 font-bold">No active bulk orders posted.</p>
          <p className="text-xs text-slate-400">Post a requirement to receive competitive price bids.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => (
            <div key={req._id} className="bg-white border border-organic-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 border-b border-organic-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      req.status === 'Open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {req.status}
                    </span>
                    <span className="text-xxs text-slate-400">Posted by {req.user?.name}</span>
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-lg sm:text-xl">{req.title}</h3>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Quantity: <span className="font-bold text-slate-800">{req.quantityRequired} items</span></div>
                  <div>Target Price: <span className="font-bold text-slate-800">₹{req.targetPrice} / item</span></div>
                </div>
              </div>

              <div className="text-sm text-slate-600 leading-relaxed space-y-2">
                <span className="font-semibold text-slate-800 block">Requirement Details:</span>
                <p>"{req.description}"</p>
                <div className="flex items-center space-x-2 text-xxs text-slate-400 pt-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Bid Submission Deadline: {new Date(req.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Quotations display */}
              <div className="border-t border-organic-100 pt-6 space-y-4">
                <h4 className="font-display font-bold text-xs text-slate-800">Submitted Bids / Quotes ({req.quotations.length})</h4>
                
                {req.quotations.length === 0 ? (
                  <p className="text-xs text-slate-400">No seller quotations submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {req.quotations.map((quote) => (
                      <div key={quote._id} className="bg-organic-50 border border-organic-150 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                        <div className="space-y-2">
                          <div className="space-y-0.5">
                            <span className="block font-bold text-xs text-slate-900">
                              {quote.seller?.sellerProfile?.businessName || quote.seller?.name}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-sans">
                              Quoted Price: <b>₹{quote.priceQuoted} / unit</b> | Delivery: {quote.deliveryDays} days
                            </span>
                          </div>
                          {quote.notes && <p className="text-xxs text-slate-600 leading-relaxed italic">"{quote.notes}"</p>}
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            quote.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' : quote.status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-800'
                          }`}>
                            {quote.status}
                          </span>

                          {user?._id === req.user?._id && quote.status === 'Pending' && req.status === 'Open' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateQuote(req._id, quote._id, 'Accepted')}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xxs font-bold px-3 py-1.5 rounded-lg"
                              >
                                Accept Bid
                              </button>
                              <button
                                onClick={() => handleUpdateQuote(req._id, quote._id, 'Rejected')}
                                className="bg-red-50 hover:bg-red-100 text-red-700 text-xxs font-bold px-3 py-1.5 rounded-lg"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quote submission trigger button for sellers */}
                {user && user.role === 'seller' && req.status === 'Open' && !req.quotations.some((q) => q.seller?._id === user._id) && (
                  <button
                    onClick={() => setBiddingId(req._id)}
                    className="bg-primary-700 hover:bg-primary-850 text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    Submit Quotation
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post requirement modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-organic-200 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-organic-100 pb-3">
              <h2 className="font-display font-extrabold text-lg text-slate-900">Post Bulk Requirement</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label htmlFor="bulk-req-title" className="block text-xs font-semibold text-slate-700 mb-1">Requirement Title</label>
                <input
                  id="bulk-req-title"
                  name="title"
                  type="text"
                  required
                  className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                  placeholder="E.g., 100 indoor plants for Environment Day"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="bulk-req-desc" className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  id="bulk-req-desc"
                  name="description"
                  required
                  rows="3"
                  className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                  placeholder="Mention packaging expectations, delivery address details, or design cards required."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bulk-req-category" className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    id="bulk-req-category"
                    name="category"
                    className="w-full p-2 text-xs rounded-lg border border-organic-200 bg-white"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Indoor Plants">Indoor Plants</option>
                    <option value="Outdoor Plants">Outdoor Plants</option>
                    <option value="Banana Fibre Bags">Banana Fibre Bags</option>
                    <option value="Fertilizers">Fertilizers</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bulk-req-quantity" className="block text-xs font-semibold text-slate-700 mb-1">Quantity Needed</label>
                  <input
                    id="bulk-req-quantity"
                    name="quantityRequired"
                    type="number"
                    min="10"
                    required
                    className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                    value={formData.quantityRequired}
                    onChange={(e) => setFormData({ ...formData, quantityRequired: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bulk-req-target-price" className="block text-xs font-semibold text-slate-700 mb-1">Target Price (₹/unit)</label>
                  <input
                    id="bulk-req-target-price"
                    name="targetPrice"
                    type="number"
                    required
                    className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({ ...formData, targetPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label htmlFor="bulk-req-deadline" className="block text-xs font-semibold text-slate-700 mb-1">Deadline Date</label>
                  <input
                    id="bulk-req-deadline"
                    name="deadline"
                    type="date"
                    required
                    className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-xs"
              >
                Submit Bulk Requirement
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Seller Bidding Modal */}
      {biddingId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-organic-200 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-organic-100 pb-3">
              <h2 className="font-display font-extrabold text-lg text-slate-900">Submit Quotation Bidding</h2>
              <button onClick={() => setBiddingId(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateBid} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bid-price" className="block text-xs font-semibold text-slate-700 mb-1">Quoted Price (₹/unit)</label>
                  <input
                    id="bid-price"
                    name="bidPrice"
                    type="number"
                    required
                    className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                    placeholder="E.g., 180"
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="bid-days" className="block text-xs font-semibold text-slate-700 mb-1">Delivery Time (Days)</label>
                  <input
                    id="bid-days"
                    name="bidDays"
                    type="number"
                    required
                    className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                    placeholder="E.g., 14"
                    value={bidDays}
                    onChange={(e) => setBidDays(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bid-notes" className="block text-xs font-semibold text-slate-700 mb-1">Quotation Notes / Terms</label>
                <textarea
                  id="bid-notes"
                  name="bidNotes"
                  rows="3"
                  className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                  placeholder="Explain packaging parameters (jute bags, coco coir) and certification badges."
                  value={bidNotes}
                  onChange={(e) => setBidNotes(e.target.value)}
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-xs"
              >
                Submit Quotation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessRequests;
