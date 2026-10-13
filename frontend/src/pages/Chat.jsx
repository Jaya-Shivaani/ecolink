import React, { useEffect, useState, useContext, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Send, User as UserIcon, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';

const Chat = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const partnerParamId = searchParams.get('partner');

  const [inbox, setInbox] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);

  const fetchInbox = async () => {
    try {
      const { data } = await axios.get('/api/messages/inbox/list');
      if (data.success) {
        setInbox(data.conversations);

        // Auto-select partner if URL parameter is present
        if (partnerParamId) {
          const partnerInInbox = data.conversations.find((c) => c._id === partnerParamId);
          if (partnerInInbox) {
            setActivePartner(partnerInInbox);
          } else {
            // Fetch partner profile details if not in inbox yet
            try {
              const partnerProfile = await axios.get(`/api/auth/profile`); // mock lookup logic
              // For demo, we search user via active list or request details, let's fetch from user profile if matched or create mock seller
              const sellerData = await axios.get(`/api/products`);
              const matchedProd = sellerData.data.products.find(p => p.seller?._id === partnerParamId);
              if (matchedProd && matchedProd.seller) {
                setActivePartner(matchedProd.seller);
              } else {
                setActivePartner({ _id: partnerParamId, name: 'EcoLink Grower' });
              }
            } catch (err) {
              setActivePartner({ _id: partnerParamId, name: 'EcoLink Seller' });
            }
          }
        } else if (data.conversations.length > 0) {
          setActivePartner(data.conversations[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations inbox:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!activePartner) return;
    try {
      const { data } = await axios.get(`/api/messages/${activePartner._id}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchInbox();
  }, [partnerParamId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Polling every 3 seconds for simulated live chat!
    return () => clearInterval(interval);
  }, [activePartner]);

  // Scroll message board to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activePartner) return;

    try {
      const { data } = await axios.post('/api/messages', {
        receiverId: activePartner._id,
        message: text,
      });

      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setText('');
        // Refresh inbox sidebar
        const { data: inboxData } = await axios.get('/api/messages/inbox/list');
        if (inboxData.success) {
          setInbox(inboxData.conversations);
        }
      }
    } catch (err) {
      alert('Failed to send message');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-organic-200 rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 md:grid-cols-4 h-[75vh]">
        {/* Inbox sidebar */}
        <div className="border-r border-organic-200 bg-organic-50 flex flex-col h-full col-span-1">
          <div className="p-4 border-b border-organic-200 flex justify-between items-center bg-white">
            <span className="font-display font-bold text-slate-800 text-sm flex items-center space-x-1.5">
              <MessageSquare className="h-4.5 w-4.5 text-primary-700" />
              <span>Inbox Conversations</span>
            </span>
            <button onClick={fetchInbox} className="text-slate-400 hover:text-slate-600">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto divide-y divide-organic-200">
            {loading ? (
              <div className="text-center py-8 text-xs text-slate-400">Loading inbox...</div>
            ) : inbox.length === 0 && !activePartner ? (
              <div className="text-center py-8 text-xs text-slate-400 px-4">No active conversations. Start a chat from a product page!</div>
            ) : (
              <>
                {/* Render partnerParamId if not in inbox lists */}
                {activePartner && !inbox.some((c) => c._id === activePartner._id) && (
                  <button
                    onClick={() => setActivePartner(activePartner)}
                    className="w-full text-left p-4 bg-primary-50/50 border-l-4 border-primary-600 flex items-center space-x-3"
                  >
                    <div className="bg-primary-100 p-2 rounded-xl text-primary-700">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-xs text-slate-800 truncate">{activePartner.sellerProfile?.businessName || activePartner.name}</span>
                      <span className="block text-[10px] text-primary-700 font-semibold uppercase">{activePartner.role}</span>
                    </div>
                  </button>
                )}

                {inbox.map((chat) => (
                  <button
                    key={chat._id}
                    onClick={() => setActivePartner(chat)}
                    className={`w-full text-left p-4 flex items-center space-x-3 transition-colors ${
                      activePartner?._id === chat._id
                        ? 'bg-white border-l-4 border-primary-600'
                        : 'hover:bg-organic-100'
                    }`}
                  >
                    <div className="bg-organic-200 p-2 rounded-xl text-slate-600">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <span className="block font-bold text-xs text-slate-800 truncate">{chat.sellerProfile?.businessName || chat.name}</span>
                      <span className="block text-[9px] text-slate-400 truncate uppercase">{chat.role}</span>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Message board */}
        <div className="col-span-3 flex flex-col h-full bg-white justify-between">
          {activePartner ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-organic-200 flex items-center space-x-3 bg-organic-50/30">
                <div className="bg-primary-100 p-2 rounded-xl text-primary-700">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <span className="block font-bold text-xs text-slate-900">{activePartner.sellerProfile?.businessName || activePartner.name}</span>
                  <span className="block text-[10px] text-slate-400 capitalize">{activePartner.role}</span>
                </div>
              </div>

              {/* Message scroll container */}
              <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-xs text-slate-400">
                    No messages yet. Send a greeting to start direct negotiations!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender.toString() === user._id.toString();
                    return (
                      <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-primary-600 text-white rounded-tr-none'
                              : 'bg-organic-100 text-slate-800 rounded-tl-none border border-organic-200'
                          }`}
                        >
                          <p>{msg.message}</p>
                          <span className={`block text-[9px] text-right mt-1 ${isMe ? 'text-primary-200' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef}></div>
              </div>

              {/* Input sender form */}
              <form onSubmit={handleSend} className="p-4 border-t border-organic-200 flex items-center space-x-3 bg-organic-50/30">
                <input
                  id="chat-message-input"
                  name="message"
                  type="text"
                  required
                  placeholder="Type a message..."
                  className="flex-grow p-3 text-xs rounded-xl border border-organic-200 focus:outline-none focus:border-primary-500 bg-white"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 p-3 rounded-xl text-white shadow shadow-primary-700/25 transition-all"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center flex-col text-slate-400 space-y-2 p-8">
              <MessageSquare className="h-10 w-10 text-slate-300" />
              <span className="font-bold text-sm">Select a Conversation</span>
              <span className="text-xs text-slate-400 text-center">Select an active contact on the sidebar to begin direct chats.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
