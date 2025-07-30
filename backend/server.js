// // backend/server.js
// import express from 'express';
// import http from 'http';
// import { Server } from 'socket.io';
// import cors from 'cors';

// // --- Basic Server Setup ---
// const app = express();
// app.use(cors());

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*", // Allow all origins. For production, restrict to your frontend's URL.
//     methods: ["GET", "POST"]
//   }
// });

// const PORT = process.env.PORT || 3001;

// // --- In-memory data store for rooms ---
// // In a real app, this would be in a database (e.g., MongoDB).
// const chatRooms = {
//   'General': [],
//   'Technology': [],
//   'Gaming': [],
//   'Random': [],
// };

// // --- API Endpoint to get available rooms ---
// app.get('/rooms', (req, res) => {
//   res.json(Object.keys(chatRooms));
// });


// // --- Socket.IO Connection Handling ---
// io.on('connection', (socket) => {
//   console.log(`A user connected: ${socket.id}`);

//   // --- Handle Room Joining ---
//   socket.on('join_room', (roomName) => {
//     // A user can only be in one room at a time in this simple setup
//     // Leave other rooms before joining a new one
//     Object.keys(chatRooms).forEach(room => {
//         if(socket.rooms.has(room)) {
//             socket.leave(room);
//         }
//     });

//     socket.join(roomName);
//     console.log(`User ${socket.id} joined room: ${roomName}`);
    
//     // Send existing messages for that room to the newly connected client
//     socket.emit('initial_messages', chatRooms[roomName] || []);
//   });

//   // --- Handle New Messages ---
//   socket.on('send_message', (messageData) => {
//     const { room, ...message } = messageData;
//     console.log(`Message received for room ${room}:`, message);

//     if (chatRooms[room]) {
//       const newMessage = { ...message, id: (chatRooms[room].length + 1).toString(), timestamp: new Date() };
//       chatRooms[room].push(newMessage);
//       // Broadcast the new message to all clients in the specific room
//       io.to(room).emit('receive_message', newMessage);
//     }
//   });

//   // --- Handle Client Disconnection ---
//   socket.on('disconnect', () => {
//     console.log(`User disconnected: ${socket.id}`);
//   });
// });

// // --- Start the Server ---
// server.listen(PORT, () => {
//   console.log(`✔️ Server is running on port ${PORT}`);
// });


// backend/server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const app = express();

// --- CORS Setup ---
const allowedOrigin = process.env.CLIENT_URL || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ["GET", "POST"],
  credentials: true
}));

// --- HTTP & Socket.IO Server Setup ---
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// --- In-memory data store for rooms ---
const chatRooms = {
  'General': [],
  'Technology': [],
  'Gaming': [],
  'Random': [],
};

// --- REST Endpoint to get available rooms ---
app.get('/rooms', (req, res) => {
  res.json(Object.keys(chatRooms));
});

// --- Socket.IO Logic ---
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // --- Join Room ---
  socket.on('join_room', (roomName) => {
    Object.keys(chatRooms).forEach(room => {
      if (socket.rooms.has(room)) {
        socket.leave(room);
      }
    });

    socket.join(roomName);
    console.log(`➡️  User ${socket.id} joined room: ${roomName}`);

    socket.emit('initial_messages', chatRooms[roomName] || []);
  });

  // --- Handle New Messages ---
  socket.on('send_message', (messageData) => {
    const { room, ...message } = messageData;
    console.log(`💬 Message in ${room}:`, message);

    if (chatRooms[room]) {
      const newMessage = {
        ...message,
        id: (chatRooms[room].length + 1).toString(),
        timestamp: new Date()
      };
      chatRooms[room].push(newMessage);
      io.to(room).emit('receive_message', newMessage);
    }
  });

  // --- Disconnection ---
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// --- Start the Server ---
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
