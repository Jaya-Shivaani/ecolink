import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { MessageSquare, Calendar, PlusCircle, AlertCircle, Heart, Check, Users, MapPin, Video, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CommunityForum = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('forum'); // 'forum' or 'events'
  const [loading, setLoading] = useState(true);

  // Modals
  const [postModal, setPostModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);

  // Post form state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('Gardening');

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocType, setEventLocType] = useState('In-Person');
  const [eventAddress, setEventAddress] = useState('');
  const [eventPrice, setEventPrice] = useState(0);

  // Active expanded comments
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [newComment, setNewComment] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const resPosts = await axios.get('/api/community/posts');
      const resEvents = await axios.get('/api/community/events');
      if (resPosts.data.success) setPosts(resPosts.data.posts);
      if (resEvents.data.success) setEvents(resEvents.data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLike = async (id) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await axios.put(`/api/community/posts/${id}/like`);
      if (data.success) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e, id) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const { data } = await axios.post(`/api/community/posts/${id}/comments`, { content: newComment });
      if (data.success) {
        setNewComment('');
        loadData();
      }
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const { data } = await axios.post('/api/community/posts', {
        title: postTitle,
        content: postContent,
        tags: postTags.split(',').map((t) => t.trim()),
      });
      if (data.success) {
        setPostTitle('');
        setPostContent('');
        setPostModal(false);
        loadData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create post');
    }
  };

  const handleRegisterEvent = async (eventId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await axios.put(`/api/community/events/${eventId}/register`);
      if (data.success) {
        alert('Registered successfully! Check your email simulation for the ticket passcode.');
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to RSVP');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const { data } = await axios.post('/api/community/events', {
        title: eventTitle,
        description: eventDesc,
        date: eventDate,
        time: eventTime,
        locationType: eventLocType,
        address: eventAddress,
        price: Number(eventPrice),
      });
      if (data.success) {
        setEventTitle('');
        setEventDesc('');
        setEventDate('');
        setEventTime('');
        setEventAddress('');
        setEventPrice(0);
        setEventModal(false);
        loadData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this workshop?')) return;
    try {
      const { data } = await axios.delete(`/api/community/events/${eventId}`);
      if (data.success) {
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete workshop');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-primary-950 flex items-center space-x-2">
            <MessageSquare className="h-7 w-7 text-emerald-600" />
            <span>Community Forums & Workshops</span>
          </h1>
          <p className="text-slate-500 text-sm">Participate in discussions or register for organic gardening and composting workshops.</p>
        </div>

        <div className="flex items-center space-x-3">
          {activeTab === 'forum' && (
            <button
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                setPostModal(true);
              }}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Ask Question</span>
            </button>
          )}
          {activeTab === 'events' && (
            <button
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                if (user.role !== 'seller' && user.role !== 'admin' && !user.roles?.seller && !user.roles?.admin) {
                  alert('Only registered sellers and community admins can host workshops.');
                  return;
                }
                setEventModal(true);
              }}
              className="flex items-center space-x-2 bg-emerald-800 hover:bg-emerald-950 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Host Workshop</span>
            </button>
          )}
        </div>
      </div>


      {/* Tabs */}
      <div className="border-b border-organic-200 flex space-x-6">
        <button
          onClick={() => setActiveTab('forum')}
          className={`pb-3 font-display font-bold text-sm tracking-tight border-b-2 transition-all ${
            activeTab === 'forum' ? 'border-primary-600 text-primary-900 font-extrabold' : 'border-transparent text-slate-500'
          }`}
        >
          Gardening Discussions ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 font-display font-bold text-sm tracking-tight border-b-2 transition-all ${
            activeTab === 'events' ? 'border-primary-600 text-primary-900 font-extrabold' : 'border-transparent text-slate-500'
          }`}
        >
          Workshops & Exhibitions ({events.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 font-semibold animate-pulse text-slate-500">Loading community boards...</div>
      ) : activeTab === 'forum' ? (
        /* Forum Layout */
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="bg-white border border-organic-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
              <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-base text-slate-800">No Gardening Discussions Yet</h3>
              <p className="text-xs text-slate-500">Be the first to start a conversation or ask an organic gardening question!</p>
              <button
                onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  setPostModal(true);
                }}
                className="inline-flex items-center space-x-1.5 bg-primary-600 text-white font-bold text-xs px-4 py-2 rounded-xl mt-2"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Start Discussion</span>
              </button>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="bg-white border border-organic-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {post.tags[0] || 'Gardening'}
                      </span>
                      <span className="text-xxs text-slate-400">By {post.user?.name || 'Community Member'} {post.user?.role ? `(${post.user.role})` : ''}</span>
                    </div>
                    <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg">{post.title}</h3>
                  </div>
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors flex-shrink-0 ${
                      user && post.likes?.includes(user._id)
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-organic-50 text-slate-500 border-organic-250 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${user && post.likes?.includes(user._id) ? 'fill-red-600' : ''}`} />
                    <span>{post.likes?.length || 0} Likes</span>
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">{post.content}</p>

                {/* Comments expand */}
                <div className="border-t border-organic-100 pt-4 space-y-3">
                  <button
                    onClick={() => setExpandedPostId(expandedPostId === post._id ? null : post._id)}
                    className="text-xxs text-primary-700 font-bold hover:underline"
                  >
                    {expandedPostId === post._id ? 'Hide Comments' : `Show Comments (${post.comments?.length || 0})`}
                  </button>

                  {expandedPostId === post._id && (
                    <div className="space-y-4 pl-4 border-l-2 border-organic-100 mt-2">
                      {(post.comments || []).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No comments yet.</p>
                      ) : (
                        post.comments.map((comment) => (
                          <div key={comment._id} className="text-xs bg-organic-50 p-3.5 rounded-2xl border border-organic-150 space-y-1">
                            <div className="flex justify-between font-bold text-slate-800 text-xxs">
                              <span>{comment.name || 'Member'} ({comment.user?.role || 'buyer'})</span>
                              <span className="text-[10px] text-slate-400 font-normal">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-600 leading-relaxed">{comment.content}</p>
                          </div>
                        ))
                      )}

                      {user ? (
                        <form onSubmit={(e) => handleAddComment(e, post._id)} className="flex items-center space-x-2 pt-2">
                          <input
                            id={`forum-reply-input-${post._id}`}
                            name="replyComment"
                            type="text"
                            required
                            className="flex-grow p-2.5 text-xs rounded-xl border border-organic-200 focus:outline-none"
                            placeholder="Write a helpful advice comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                          <button type="submit" className="bg-primary-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl">
                            Reply
                          </button>
                        </form>
                      ) : (
                        <div className="pt-2 text-xs text-slate-600 bg-organic-50 p-3 rounded-xl border border-organic-150 flex items-center justify-between">
                          <span>Want to share advice or reply to this discussion?</span>
                          <button onClick={() => navigate('/login')} className="text-primary-700 font-bold hover:underline">
                            Log in to comment &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Events Layout */
        events.length === 0 ? (
          <div className="bg-white border border-organic-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-base text-slate-800">No Workshops Scheduled Yet</h3>
            <p className="text-xs text-slate-500">Upcoming community webinars, composting demonstrations, and organic farming workshops will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => (
            <div key={evt._id} className="bg-white border border-organic-200 rounded-3xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <img src={evt.image} alt={evt.title} className="w-full h-48 object-cover" />
                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xxs text-slate-400">
                      <span className="flex items-center">
                        {evt.locationType === 'Online' ? <Video className="h-3.5 w-3.5 mr-0.5" /> : <MapPin className="h-3.5 w-3.5 mr-0.5" />}
                        {evt.locationType}
                      </span>
                      <span>By {evt.organizer?.sellerProfile?.businessName || evt.organizer?.name}</span>
                    </div>
                    <h3 className="font-display font-bold text-slate-900 text-lg leading-tight">{evt.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{evt.description}</p>
                  </div>

                  <div className="text-xxs text-slate-600 bg-organic-50 p-3 rounded-xl border border-organic-150 space-y-1 font-sans">
                    <div>📅 <b>Date:</b> {new Date(evt.date).toLocaleDateString()} at {evt.time}</div>
                    <div>📍 <b>Location:</b> {evt.address}</div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-organic-100 flex justify-between items-center bg-organic-50/50">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Entrance Price</span>
                  <span className="font-bold text-slate-900 text-sm">{evt.price === 0 ? 'FREE' : `₹${evt.price}`}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {user && (user._id === evt.organizer?._id || user._id === evt.organizer || user.roles?.admin) && (
                    <button
                      onClick={() => handleDeleteEvent(evt._id)}
                      title="Delete Workshop"
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all border border-rose-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    disabled={user && evt.attendees.includes(user._id)}
                    onClick={() => handleRegisterEvent(evt._id)}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4.5 py-2 rounded-xl transition-all disabled:opacity-50"
                  >
                    {user && evt.attendees.includes(user._id) ? 'Registered ✓' : 'Register RSVP'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )
      )}

      {/* Post Modal */}
      {postModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-organic-200 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-organic-100 pb-3">
              <h2 className="font-display font-extrabold text-lg text-slate-900">Post Forum Discussion</h2>
              <button onClick={() => setPostModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label htmlFor="forum-post-title" className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  id="forum-post-title"
                  name="title"
                  type="text"
                  required
                  className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                  placeholder="E.g., Troubleshooting white spots on neem leaves"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="forum-post-content" className="block text-xs font-semibold text-slate-700 mb-1">Content</label>
                <textarea
                  id="forum-post-content"
                  name="content"
                  required
                  rows="4"
                  className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                  placeholder="Share details of water levels, soils used or photos link."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                ></textarea>
              </div>

              <div>
                <label htmlFor="forum-post-tags" className="block text-xs font-semibold text-slate-700 mb-1">Tags (Comma separated)</label>
                <input
                  id="forum-post-tags"
                  name="tags"
                  type="text"
                  className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                  placeholder="E.g., Indoor Plants, Composting"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-xs"
              >
                Post Thread
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {eventModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-organic-200 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-organic-100 pb-3">
              <h2 className="font-display font-extrabold text-lg text-slate-900">Host Gardening Workshop</h2>
              <button onClick={() => setEventModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label htmlFor="event-title" className="block text-xs font-semibold text-slate-700 mb-1">Workshop Title</label>
                <input
                  id="event-title"
                  name="title"
                  type="text"
                  required
                  className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                  placeholder="E.g., Organic Composting Masterclass"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="event-desc" className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  id="event-desc"
                  name="description"
                  required
                  rows="3"
                  className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                  placeholder="What will attendees learn? What should they bring along?"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="event-date" className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    id="event-date"
                    name="date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="event-time" className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <input
                    id="event-time"
                    name="time"
                    type="text"
                    required
                    className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                    placeholder="10:00 AM to 01:00 PM"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="event-loctype" className="block text-xs font-semibold text-slate-700 mb-1">Location Type</label>
                  <select
                    id="event-loctype"
                    name="locationType"
                    className="w-full p-2 text-xs rounded-lg border border-organic-200 bg-white"
                    value={eventLocType}
                    onChange={(e) => setEventLocType(e.target.value)}
                  >
                    <option value="In-Person">In-Person</option>
                    <option value="Online">Online / Zoom</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="event-price" className="block text-xs font-semibold text-slate-700 mb-1">Price (₹, 0 for free)</label>
                  <input
                    id="event-price"
                    name="price"
                    type="number"
                    required
                    className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                    value={eventPrice}
                    onChange={(e) => setEventPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="event-address" className="block text-xs font-semibold text-slate-700 mb-1">Physical Address / Virtual Link</label>
                <input
                  id="event-address"
                  name="address"
                  type="text"
                  required
                  className="w-full p-2.5 text-xs rounded-xl border border-organic-200"
                  placeholder="Koramangala Community Centre OR https://zoom.us/..."
                  value={eventAddress}
                  onChange={(e) => setEventAddress(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-xs"
              >
                Launch Workshop
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityForum;
