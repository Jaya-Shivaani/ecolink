import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Upload, X, AlertCircle, CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getProductImage, PRODUCT_PLACEHOLDER } from '../utils/productImages';

const RATING_LABELS = {
  1: '1 - Poor (Needs improvement)',
  2: '2 - Fair (Below expectations)',
  3: '3 - Good (Average quality)',
  4: '4 - Very Good (Satisfied)',
  5: '5 - Excellent (Highly recommended)',
};

const ReviewModal = ({
  isOpen,
  onClose,
  product,
  orderId,
  existingReview = null,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [images, setImages] = useState(existingReview?.images || []);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setComment(existingReview.comment || '');
      setImages(existingReview.images || []);
    } else {
      setRating(5);
      setComment('');
      setImages([]);
    }
    setError('');
    setSuccessMsg('');
  }, [existingReview, isOpen]);

  if (!isOpen || !product) return null;

  // Handle local image file selection and upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 5) {
      setError('You can upload a maximum of 5 images per review.');
      return;
    }

    // Validate size (max 5MB each) and mime types
    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError(`"${file.name}" is not a valid image file.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 5MB size limit.`);
        return;
      }
      validFiles.push(file);
    }

    setError('');
    setUploadingImages(true);

    try {
      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append('images', file);
      });

      const { data } = await axios.post('/api/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success && data.urls) {
        setImages((prev) => [...prev, ...data.urls].slice(0, 5));
      } else {
        setError(data.message || 'Failed to upload images');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      // Fallback: upload one by one if multiple endpoint has issue
      try {
        const uploadedUrls = [];
        for (const file of validFiles) {
          const singleData = new FormData();
          singleData.append('image', file);
          const singleRes = await axios.post('/api/upload', singleData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (singleRes.data.success && singleRes.data.url) {
            uploadedUrls.push(singleRes.data.url);
          }
        }
        if (uploadedUrls.length > 0) {
          setImages((prev) => [...prev, ...uploadedUrls].slice(0, 5));
        } else {
          setError('Failed to upload selected images. Please try again.');
        }
      } catch (fallbackErr) {
        setError(err.response?.data?.message || 'Error uploading image. Please try again.');
      }
    } finally {
      setUploadingImages(false);
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }

    if (!comment.trim() || comment.trim().length < 3) {
      setError('Please write at least 3 characters in your review comments.');
      return;
    }

    setSubmitting(true);

    try {
      if (existingReview?._id) {
        // Edit existing review
        const { data } = await axios.put(`/api/reviews/${existingReview._id}`, {
          rating,
          comment: comment.trim(),
          images,
        });

        if (data.success) {
          setSuccessMsg('Review updated successfully!');
          if (onReviewSubmitted) onReviewSubmitted(data.review, true);
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        // Create new review
        const productId = product._id || product.product;
        const { data } = await axios.post('/api/reviews', {
          orderId,
          productId,
          rating,
          comment: comment.trim(),
          images,
        });

        if (data.success) {
          setSuccessMsg('Thank you! Your review has been submitted.');
          if (onReviewSubmitted) onReviewSubmitted(data.review, false);
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      console.error('Review submit error:', err);
      setError(
        err.response?.data?.message || 'Failed to submit review. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-organic-200 overflow-hidden max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-organic-100 bg-organic-50/70">
          <div>
            <span className="text-xxs font-extrabold tracking-wider uppercase text-primary-700 block">
              Verified Order Feedback
            </span>
            <h3 className="font-display font-extrabold text-lg text-slate-900">
              {existingReview ? 'Edit Your Review' : 'Rate & Review Product'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-grow">
          {/* Product Overview Card */}
          <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-organic-50/90 border border-organic-150">
            <img
              src={getProductImage(product)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = PRODUCT_PLACEHOLDER;
              }}
              alt={product.name}
              className="w-14 h-14 object-cover rounded-xl border border-organic-200 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="font-display font-bold text-sm text-slate-900 block truncate">
                {product.name}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Delivered Order #{orderId ? orderId.substring(orderId.length - 8) : ''}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Star Rating Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Your Overall Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const activeVal = hoverRating || rating;
                    const isFilled = starVal <= activeVal;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-hidden"
                        title={`${starVal} Star`}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-semibold text-slate-600 ml-2">
                  {RATING_LABELS[hoverRating || rating]}
                </span>
              </div>
            </div>

            {/* 2. Review Text Area */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="review-comment-textarea"
                  className="block text-xs font-bold text-slate-800"
                >
                  Review Details <span className="text-red-500">*</span>
                </label>
                <span className="text-xxs text-slate-400">
                  {comment.length} / 2000 chars
                </span>
              </div>
              <textarea
                id="review-comment-textarea"
                rows="4"
                required
                maxLength="2000"
                placeholder="How was the product quality, packaging condition, freshness, and delivery experience? Share your experience with the community."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3.5 text-xs text-slate-800 bg-white border border-organic-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-primary-500/30 focus:border-primary-600 transition-all placeholder:text-slate-400 leading-relaxed"
              ></textarea>
            </div>

            {/* 3. Image Upload Area */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Add Photos <span className="text-slate-400 font-normal">(Optional, max 5)</span>
                </label>
                <span className="text-xxs text-slate-400">
                  {images.length}/5 uploaded
                </span>
              </div>

              {/* Uploaded images previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-5 gap-2.5 mb-3">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-organic-200 aspect-square bg-slate-50 shadow-2xs"
                    >
                      <img
                        src={imgUrl}
                        alt={`Review preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-slate-900/80 hover:bg-red-600 text-white rounded-full transition-colors shadow-xs opacity-90 group-hover:opacity-100"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* File input / dropzone button */}
              {images.length < 5 && (
                <label className="border-2 border-dashed border-organic-300 hover:border-primary-500 hover:bg-primary-50/20 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleImageUpload}
                    disabled={uploadingImages || submitting}
                    className="hidden"
                  />
                  {uploadingImages ? (
                    <div className="flex items-center space-x-2 text-primary-700 py-1">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-xs font-semibold">Uploading photos...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2.5 text-slate-500 group-hover:text-primary-700 py-1">
                      <div className="p-2 bg-organic-100 group-hover:bg-primary-100/70 text-slate-600 group-hover:text-primary-800 rounded-xl transition-colors">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold block text-slate-800 group-hover:text-primary-900">
                          Upload product photos
                        </span>
                        <span className="text-xxs text-slate-400 block">
                          PNG, JPG, WEBP up to 5MB
                        </span>
                      </div>
                    </div>
                  )}
                </label>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-organic-100">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-organic-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImages}
                className="px-6 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-700/15 transition-all flex items-center space-x-1.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>{existingReview ? 'Update Review' : 'Submit Review'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
