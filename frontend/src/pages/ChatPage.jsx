import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send, Image, X } from 'lucide-react';
import ChatHeader from '../components/chat/ChatHeader';
import MessageBubble from '../components/chat/MessageBubble';
import TypingIndicator from '../components/chat/TypingIndicator';

const ChatPage = () => {
  const { user: currentUser } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Parse active match ID from URL query parameters (e.g. ?room=matchId)
  const getQueryRoomId = () => {
    const params = new URLSearchParams(location.search);
    return params.get('room');
  };

  // 1. Fetch Inbox (Matches) List on mount
  const fetchMatches = async () => {
    try {
      const res = await API.get('/matches');
      setMatches(res.data.matches);

      // Auto-select match if specified in URL
      const roomId = getQueryRoomId();
      if (roomId && res.data.matches.length > 0) {
        const selected = res.data.matches.find((m) => m._id === roomId);
        if (selected) {
          setActiveMatch(selected);
        }
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err.message);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [location.search]);

  // 2. Chat history loader & Socket Joiner
  useEffect(() => {
    if (!activeMatch || !socket) return;

    const matchId = activeMatch._id;

    // Join WebSocket conversation room
    socket.emit('join_match_room', { matchId });

    // Fetch message history
    const fetchMessages = async () => {
      try {
        const res = await API.get(`/messages/${matchId}`);
        setMessages(res.data.messages);
        scrollToBottom();

        // Emit seen receipt to mark messages read in DB and inform partner
        socket.emit('message_seen', { matchId });
      } catch (err) {
        console.error('Failed to load chat history:', err.message);
      }
    };

    fetchMessages();

    // Attach WebSocket event listeners
    socket.on('receive_message', (message) => {
      if (message.matchId === matchId) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();

        // Automatically fire seen receipt if active
        if (message.sender !== currentUser._id) {
          socket.emit('message_seen', { matchId });
        }
      }
    });

    socket.on('typing_status', ({ senderId, isTyping: partnerIsTyping }) => {
      if (senderId !== currentUser._id) {
        setPartnerTyping(partnerIsTyping);
      }
    });

    socket.on('message_seen', ({ matchId: seenRoomId }) => {
      if (seenRoomId === matchId) {
        // Mark all my sent messages as read
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === currentUser._id ? { ...msg, seen: true } : msg
          )
        );
      }
    });

    // Clean up event listeners on unmount or room change
    return () => {
      socket.off('receive_message');
      socket.off('typing_status');
      socket.off('message_seen');
      setPartnerTyping(false);
    };
  }, [activeMatch, socket]);

  // 3. Auto Scroll helper
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // 4. Handle text inputs & Typing Socket alerts
  const handleInputChange = (e) => {
    setTextInput(e.target.value);

    if (!socket || !activeMatch) return;

    // Send Typing started signal
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing_status', { matchId: activeMatch._id, isTyping: true });
    }

    // Debounce Typing stopped signal
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing_status', { matchId: activeMatch._id, isTyping: false });
    }, 1500);
  };

  // 5. Send message action
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!textInput.trim() && !imageFile) || !activeMatch || !socket) return;

    const matchId = activeMatch._id;

    // Clear typing states
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    socket.emit('typing_status', { matchId, isTyping: false });

    try {
      if (imageFile) {
        // Send via REST fallback if photo attachment is present
        const formData = new FormData();
        formData.append('text', textInput);
        formData.append('image', imageFile);

        const res = await API.post(`/messages/${matchId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Emit new message notification through socket (REST uploads complete)
        socket.emit('send_message', {
          matchId,
          text: res.data.message.text,
          image: res.data.message.image
        });

        setImageFile(null);
      } else {
        // Send direct real-time message through WebSocket
        socket.emit('send_message', {
          matchId,
          text: textInput,
          image: ''
        });
      }

      setTextInput('');
      scrollToBottom();
    } catch (err) {
      console.error('Failed to deliver message:', err.message);
    }
  };

  // 6. Unmatch Profile Transaction
  const handleUnmatch = async () => {
    if (!activeMatch) return;
    const confirm = window.confirm(
      `Are you sure you want to unmatch ${activeMatch.partner.name}? This will delete all message history permanently.`
    );
    if (!confirm) return;

    try {
      await API.delete(`/matches/${activeMatch._id}`);
      setActiveMatch(null);
      setMessages([]);
      fetchMatches();
      navigate('/chat');
    } catch (err) {
      console.error('Failed to unmatch:', err.message);
    }
  };

  const getPartnerPhoto = (partnerObj) => {
    if (partnerObj?.photos && partnerObj.photos.length > 0) {
      const url = partnerObj.photos[0].url;
      return url.startsWith('/uploads') ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${url}` : url;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerObj?.name || 'User')}&background=fe3c72&color=fff&bold=true`;
  };

  const isPartnerOnline = (partnerId) => {
    return onlineUsers.has(partnerId?.toString());
  };

  return (
    <div className="flex-1 flex bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] font-sans">
      
      {/* 1. Left Matches/Sidebar Inbox List */}
      <aside className={`w-full md:w-80 flex flex-col border-r border-slate-800/80 bg-slate-900/50 ${
        activeMatch ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <h2 className="text-xl font-black text-white">Inbox Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {matches.length > 0 ? (
            matches.map((match) => {
              const selected = activeMatch?._id === match._id;
              const online = isPartnerOnline(match.partner?._id);
              return (
                <div
                  key={match._id}
                  onClick={() => {
                    setActiveMatch(match);
                    navigate(`/chat?room=${match._id}`);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-300 ${
                    selected
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/10'
                      : 'hover:bg-slate-800/50 text-slate-300 hover:text-slate-100'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={getPartnerPhoto(match.partner)}
                      alt={match.partner?.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-950 shadow-md"
                    />
                    {/* Real-time online green dot indicator */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                      online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                    }`}></div>
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-bold truncate text-sm">
                      {match.partner?.name}
                    </h4>
                    <p className={`text-xs truncate mt-0.5 ${selected ? 'text-white/80' : 'text-slate-500'}`}>
                      {match.lastMessage?.text || 'Sent you a mutual match!'}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 px-6">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                No active conversations
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Swiping likes on discovery suggestions to spark matches!
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Right Live Chat Window Container */}
      <section className={`flex-1 flex flex-col bg-slate-950 ${
        !activeMatch ? 'hidden md:flex justify-center items-center' : 'flex'
      }`}>
        {activeMatch ? (
          <>
            {/* Active chat header */}
            <ChatHeader
              partner={activeMatch.partner}
              isOnline={isPartnerOnline(activeMatch.partner._id)}
              onBack={() => {
                setActiveMatch(null);
                navigate('/chat');
              }}
              onUnmatch={handleUnmatch}
            />

            {/* Historical Messages stream feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isMine={msg.sender === currentUser._id}
                />
              ))}

              {/* Typing Indicator */}
              {partnerTyping && (
                <TypingIndicator partnerName={activeMatch.partner?.name} />
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Selected File Image Attach bar preview */}
            {imageFile && (
              <div className="px-6 py-2 bg-slate-900 border-t border-slate-850 flex items-center justify-between">
                <span className="text-xs text-rose-500 font-bold truncate">
                  Image Attachment Ready: {imageFile.name}
                </span>
                <button
                  onClick={() => setImageFile(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input field text control form */}
            <form
              onSubmit={handleSendMessage}
              className="h-20 px-6 border-t border-slate-800/80 flex items-center gap-4 bg-slate-900/30 backdrop-blur-md"
            >
              {/* Photo attachment input trigger */}
              <label className="p-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 rounded-2xl active:scale-95 transition-all cursor-pointer">
                <Image className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                placeholder="Type your message..."
                value={textInput}
                onChange={handleInputChange}
                className="flex-1 bg-slate-950 border border-slate-800/85 rounded-2xl px-5 py-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
              />

              <button
                type="submit"
                className="p-3.5 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 hover:brightness-110 cursor-pointer transition-all"
              >
                <Send className="w-5 h-5 fill-current" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 select-none text-center">
            <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-rose-500 mb-4">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-200">No Chat Selected</h3>
            <p className="text-slate-500 text-xs mt-2 max-w-[200px] leading-relaxed">
              Select a matched conversation thread on the sidebar feed to chat!
            </p>
          </div>
        )}
      </section>

    </div>
  );
};

export default ChatPage;
