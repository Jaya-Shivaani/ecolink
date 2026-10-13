import React, { useState } from 'react';
import axios from 'axios';
import { AlertTriangle, X, Loader2, CheckCircle2 } from 'lucide-react';

const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Found another product',
  'Delivery taking too long',
  'Other',
];

const CancelOrderModal = ({ isOpen, onClose, order, onOrderCancelled }) => {
  const [reason, setReason] = useState('Changed my mind');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !order) return null;

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const finalReason = reason === 'Other' && note.trim() ? note.trim() : reason;
      const { data } = await axios.patch(`/api/orders/${order._id}/cancel`, {
        cancellationReason: finalReason,
        cancellationNote: note.trim(),
      });

      if (data.success) {
        setSuccessMsg('Order cancelled successfully.');
        if (onOrderCancelled) {
          onOrderCancelled(data.order);
        }
        setTimeout(() => {
          onClose();
        }, 900);
      } else {
        setError(data.message || 'Failed to cancel order.');
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      setError(
        err.response?.data?.message || 'Failed to cancel order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden my-auto animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-red-50/70">
          <div className="flex items-center space-x-2 text-red-800">
            <div className="p-1.5 bg-red-100 rounded-xl text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xxs font-extrabold uppercase tracking-wider text-red-600 block">
                Order Cancellation
              </span>
              <h3 className="font-display font-extrabold text-lg text-slate-900 leading-tight">
                Cancel Order
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-organic-50 p-3.5 rounded-2xl border border-organic-150 text-xs space-y-1">
            <div className="flex justify-between font-bold text-slate-900">
              <span>Order #{order._id.substring(order._id.length - 8)}</span>
              <span>₹{order.totalPrice}</span>
            </div>
            <div className="text-slate-500 text-xxs">
              Current Status: <span className="font-bold text-primary-800">{order.status}</span>
            </div>
            {order.paymentStatus === 'Paid' && (
              <div className="text-xxs font-semibold text-purple-700 pt-1 border-t border-organic-150">
                Payment status: Paid Online (Refund will be marked as Refund Pending)
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800">
              Are you sure you want to cancel this order?
            </p>
            <p className="text-xxs text-slate-500 leading-relaxed">
              This action cannot be undone. All reserved items will be released back to product stock.
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-2xl">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCancelSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Reason for Cancellation <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {CANCEL_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      reason === r
                        ? 'border-red-400 bg-red-50/50 font-bold text-slate-950'
                        : 'border-organic-200 hover:bg-organic-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancellationReason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {reason === 'Other' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Additional Details
                </label>
                <textarea
                  rows="2"
                  maxLength="500"
                  placeholder="Please specify why you are cancelling..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-3 text-xs bg-white border border-organic-300 rounded-xl focus:outline-hidden focus:border-red-500 text-slate-800 placeholder:text-slate-400"
                ></textarea>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-organic-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-organic-100 rounded-xl transition-colors"
              >
                Keep Order
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md shadow-red-700/20 transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Cancel Order</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;
