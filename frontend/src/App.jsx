// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// --- Establish Socket Connection ---
const SERVER_URL = 'https://chatroom-gotm.onrender.com';
const socket = io(SERVER_URL, {
  autoConnect: false // We will connect manually after user selects a room
});

function App() {
  // --- State Management ---
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // --- Effect to fetch available rooms on component mount ---
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/rooms`);
        const rooms = await response.json();
        setAvailableRooms(rooms);
        if (rooms.length > 0) {
          setRoom(rooms[0]); // Default to the first room
        }
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
      }
    };
    fetchRooms();
  }, []);

  // --- Effect for Socket.IO event listeners ---
  useEffect(() => {
    // Only set up listeners if the user has joined a room
    if (isJoined) {
      socket.connect(); // Manually connect the socket

      socket.on('connect', () => {
        console.log(`✔️ Connected to server with socket id: ${socket.id}`);
        // Join the selected room
        socket.emit('join_room', room);
      });

      socket.on('initial_messages', (initialMessages) => {
        setMessages(initialMessages);
      });

      socket.on('receive_message', (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });

      socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
      });
    }

    // --- Cleanup function ---
    return () => {
      socket.off('connect');
      socket.off('initial_messages');
      socket.off('receive_message');
      socket.off('disconnect');
      if(socket.connected) {
        socket.disconnect();
      }
    };
  }, [isJoined, room]); // Re-run effect if isJoined or room changes

  // --- Effect to scroll to the latest message ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Event Handlers ---

  /**
   * Handles joining the chat room.
   */
  const handleJoinChat = (e) => {
    e.preventDefault();
    if (username.trim() && room) {
      setIsJoined(true);
    }
  };

  /**
   * Handles sending a new message.
   */
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && username && room) {
      const messageData = {
        room: room,
        user: username,
        text: message,
      };
      socket.emit('send_message', messageData);
      setMessage('');
    }
  };

  // --- Render Logic ---

  // Render room selection form if user hasn't joined
  if (!isJoined) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center font-sans">
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-center text-cyan-400">Join a Chat Room</h1>
          <form onSubmit={handleJoinChat} className="space-y-6">
            <div>
              <label htmlFor="username" className="text-sm font-medium text-gray-400">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username..."
                className="w-full px-4 py-2 mt-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label htmlFor="room" className="text-sm font-medium text-gray-400">
                Chat Room
              </label>
              <select
                id="room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-4 py-2 mt-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
              >
                {availableRooms.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 transition-colors"
            >
              Join Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render the main chat interface
  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col font-sans">
      <header className="bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-cyan-400">MERN Chat</h1>
            <p className="text-sm text-cyan-200">Room: {room}</p>
        </div>
        <div className="text-right">
            <p className="text-sm text-gray-400">Signed in as</p>
            <p className="font-semibold text-white">{username}</p>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.user === username ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${msg.user === username ? 'bg-cyan-600' : 'bg-gray-700'}`}>
                <div className="flex items-baseline gap-2">
                    <p className="font-bold text-sm">{msg.user === username ? 'You' : msg.user}</p>
                    <p className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </div>
                <p className="text-white mt-1">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-gray-800 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-full focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-6 py-2 font-semibold text-white bg-cyan-600 rounded-full hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!message.trim()}
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}

export default App;
