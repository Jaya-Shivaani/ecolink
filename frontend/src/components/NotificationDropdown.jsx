import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  Bell,
  CheckCheck,
  Leaf,
  Phone,
  Mail,
  ArrowRight,
  MessageCircle,
  Clock,
  Trash2,
  CheckCircle2,
  Repeat,
  HeartHandshake,
} from 'lucide-react';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSecs = Math.floor((now - date) / 1000);

  if (diffSecs < 60) return 'Just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const NotificationDropdown = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get('/api/notifications');
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // Silently fail in background
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [user]);

  // Refresh when opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => {
        const notif = notifications.find((n) => n._id === id);
        return notif && !notif.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEmail = (e, email, name, plantName) => {
    if (e) e.stopPropagation();
    if (!email) return;

    const subject = `Regarding your EcoLink request: ${plantName || 'Plant'}`;
    const body = `Hi ${name || 'Customer'},\n\nI received your request regarding "${plantName || 'the plant'}" on EcoLink.\n\n`;
    
    // Open Gmail web composer directly in a new tab
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-2xl transition-all duration-200 focus:outline-none ${
          isOpen
            ? 'bg-primary-50 text-primary-800 ring-2 ring-primary-500/20'
            : 'text-slate-600 hover:text-primary-700 hover:bg-slate-100/80'
        }`}
        aria-label="Plant Requests & Notifications"
        title="Plant Requests & Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white rounded-full text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center font-bold shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[360px] sm:w-[410px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-50 origin-top-right transition-all animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-emerald-50 text-emerald-700 border border-emerald-100/80 rounded-xl flex items-center justify-center shadow-xs">
                <HeartHandshake className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-slate-900 leading-tight">
                  Plant Requests
                </h3>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {unreadCount > 0
                    ? `${unreadCount} unread request${unreadCount > 1 ? 's' : ''}`
                    : 'All caught up'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications Scroll Area */}
          <div className="max-h-[380px] overflow-y-auto p-3.5 space-y-3 bg-slate-50/60 divide-y-0">
            {notifications.length === 0 ? (
              <div className="py-10 text-center px-6 bg-white rounded-2xl border border-dashed border-slate-200 my-1">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                  <Leaf className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">No requests yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
                  When a community member requests to adopt or swap your plant, their contact details will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const requesterPhone = n.meta?.senderPhone || n.sender?.phoneNumber;
                const requesterEmail = n.meta?.senderEmail || n.sender?.email;
                const requesterName = n.meta?.senderName || n.sender?.name || 'Community Member';
                const plantName = n.meta?.plantName || n.plantListing?.name || 'Plant';
                const isExchange = n.type === 'exchange_request' || n.plantListing?.type === 'Exchange';
                const initial = requesterName.trim().charAt(0).toUpperCase() || 'U';

                return (
                  <div
                    key={n._id}
                    onClick={() => !n.read && markAsRead(n._id)}
                    className={`group bg-white rounded-2xl p-3.5 border transition-all duration-200 relative ${
                      !n.read
                        ? 'border-emerald-300/80 shadow-xs ring-1 ring-emerald-400/20'
                        : 'border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    {/* Unread Accent Dot */}
                    {!n.read && (
                      <span className="absolute top-3.5 right-3.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}

                    {/* Card Header: Badge + Plant Name + Time */}
                    <div className="flex items-center justify-between gap-2 pr-4 mb-2.5">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                            isExchange
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/70'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                          }`}
                        >
                          {isExchange ? 'Swap' : 'Adoption'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate" title={plantName}>
                          {plantName}
                        </h4>
                      </div>

                      <span className="text-[11px] font-medium text-slate-400 shrink-0">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    {/* Requester Profile Strip */}
                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-emerald-100/80 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-200/60">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider leading-none">
                              Requester
                            </span>
                            <span className="block text-xs font-bold text-slate-800 truncate mt-0.5" title={requesterName}>
                              {requesterName}
                            </span>
                          </div>
                        </div>

                        {/* Delete/Dismiss Button */}
                        <button
                          onClick={(e) => deleteNotification(n._id, e)}
                          className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Dismiss notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {requesterPhone ? (
                          <>
                            <a
                              href={`tel:${requesterPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white h-7 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-2xs"
                              title={`Call ${requesterPhone}`}
                            >
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>Call</span>
                            </a>

                            <a
                              href={`https://wa.me/${requesterPhone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 h-7 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-all"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3 shrink-0" />
                              <span>WhatsApp</span>
                            </a>
                          </>
                        ) : null}

                        {requesterEmail ? (
                          <button
                            type="button"
                            onClick={(e) => handleOpenEmail(e, requesterEmail, requesterName, plantName)}
                            title={`Send email to ${requesterEmail}`}
                            className={`bg-slate-100 hover:bg-slate-200/90 active:bg-slate-300 text-slate-700 h-7 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                              !requesterPhone ? 'w-full' : 'flex-1'
                            }`}
                          >
                            <Mail className="w-3 h-3 shrink-0 text-slate-500" />
                            <span>Email</span>
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* View Listing Link */}
                    {n.link && (
                      <div className="flex justify-end mt-2 pt-1">
                        <Link
                          to={n.link}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline transition-colors"
                        >
                          <span>Open Plant Listing</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Solid Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              EcoLink Community
            </span>
            <Link
              to="/adoption"
              onClick={() => setIsOpen(false)}
              className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 text-[11px] transition-colors"
            >
              <span>All Plant Listings</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
