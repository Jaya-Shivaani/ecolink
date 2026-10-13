import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, Link as LinkIcon, Image as ImageIcon, X, Loader2, CheckCircle2 } from 'lucide-react';
import { getProductImage } from '../utils/productImages';

const ImageUploadField = ({
  value = '',
  onChange,
  label = 'Product Image',
  placeholder = 'Paste image URL or choose file from device...',
  helperText = 'Upload a photo from your device or paste a web URL (JPG, PNG, WEBP max 10MB)',
  id = 'image-upload',
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'url'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    setUploadError('');
    setIsUploading(true);

    // Instant local preview via FileReader
    const reader = new FileReader();
    reader.onload = () => {
      // Temporarily set preview
      if (!value) {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.success && data.url) {
        onChange(data.url);
      } else {
        // Fallback to Base64 data URL from reader if server didn't return URL
        reader.onloadend = () => {
          onChange(reader.result);
        };
      }
    } catch (err) {
      console.warn('Backend upload failed, using high-res local base64 format:', err);
      // Ensure we keep the base64 data URL so user can still submit without breaking
      const fallbackReader = new FileReader();
      fallbackReader.onload = () => {
        onChange(fallbackReader.result);
      };
      fallbackReader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClear = () => {
    onChange('');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const previewSrc = value ? getProductImage(value) : '';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        
        {/* Toggle Mode: Upload vs URL */}
        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-xxs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-2 py-1 rounded-md transition-all flex items-center space-x-1 ${
              activeTab === 'file'
                ? 'bg-white text-primary-800 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3 h-3" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2 py-1 rounded-md transition-all flex items-center space-x-1 ${
              activeTab === 'url'
                ? 'bg-white text-primary-800 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileInputChange}
        accept="image/*"
        className="hidden"
        id={`${id}-file-input`}
      />

      {/* Upload Box Mode */}
      {activeTab === 'file' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
            isDragging
              ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-200'
              : 'border-organic-200 hover:border-primary-400 bg-organic-50/40 hover:bg-organic-50/80'
          } ${compact ? 'py-3' : 'py-5'}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center py-2 space-y-2">
              <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
              <p className="text-xs font-medium text-slate-600">Uploading & processing image...</p>
            </div>
          ) : value ? (
            <div className="flex items-center space-x-3 w-full" onClick={(e) => e.stopPropagation()}>
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-organic-200 bg-white shrink-0 shadow-2xs">
                <img
                  src={previewSrc}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/products/product-placeholder.png';
                  }}
                />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Image Selected / Uploaded</span>
                </div>
                <p className="text-xxs text-slate-500 truncate mt-0.5 max-w-[220px]">
                  {value.startsWith('data:') ? 'Local Image File (Ready)' : value}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xxs font-semibold text-primary-700 hover:text-primary-800 underline"
                  >
                    Change File
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xxs font-semibold text-red-600 hover:text-red-700 underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-1.5 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Click to browse or drag & drop photo
                </p>
                <p className="text-xxs text-slate-400 mt-0.5">
                  Supports JPG, PNG, WEBP, GIF up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* URL Input Mode */
        <div className="space-y-2">
          <div className="relative flex items-center">
            <input
              id={id}
              type="text"
              className="w-full p-2.5 pr-8 text-xs rounded-xl border border-organic-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder={placeholder}
              value={value}
              onChange={(e) => {
                setUploadError('');
                onChange(e.target.value);
              }}
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-red-500 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {value && (
            <div className="flex items-center space-x-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                <img
                  src={previewSrc}
                  alt="URL Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/products/product-placeholder.png';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xxs font-semibold text-slate-700 truncate">{value}</p>
                <p className="text-xxs text-emerald-600 font-medium">Preview loaded</p>
              </div>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <p className="text-xxs text-red-600 font-medium">{uploadError}</p>
      )}

      {helperText && !uploadError && (
        <p className="text-[10px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
};

export default ImageUploadField;
