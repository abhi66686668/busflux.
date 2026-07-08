
const express =
  require("express");

const cors =
  require("cors");

const dotenv =
  require("dotenv");

const path =
  require("path");



// ================= ENV =================

dotenv.config();



// ================= DATABASE =================

const connectDB =
  require("./config/db");



// ================= CRON JOBS =================
const { startCronJobs } = require("./cronJobs");

// ================= ROUTES =================

const authRoutes =
  require("./routes/authRoutes");

const busRoutes =
  require("./routes/busRoutes");

const bookingRoutes =
  require("./routes/bookingRoutes");

const adminRoutes =
  require("./routes/adminRoutes");

const paymentRoutes = require("./routes/paymentRoutes");
const statsRoutes = require("./routes/statsRoutes");
const reviewRoutes = require("./routes/reviewRoutes");



// ================= CONNECT DATABASE =================

connectDB();



// ================= EXPRESS APP & SOCKET.IO =================

const app = express();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.set('io', io); // Make io available in routes via req.app.get('io')

const onlineUsers = new Set();

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  // Send current online users state immediately
  socket.emit('online_users_update', Array.from(onlineUsers));
  
  socket.on('join_room', (userId) => {
    if (userId) {
      const uid = userId.toString();
      socket.join(uid);
      socket.userId = uid;
      onlineUsers.add(uid);
      console.log(`Socket ${socket.id} joined room: ${uid}`);
      // Broadcast online status to everyone
      io.emit('online_users_update', Array.from(onlineUsers));
    }
  });

  // Cache to store the latest state (location, route, nextStop) of each bus
  const activeBusData = {};

  // Tracking Rooms
  socket.on('join_bus_room', (busId) => {
    if (busId) {
      socket.join(`bus_${busId}`);
      console.log(`Socket ${socket.id} joined bus room: bus_${busId}`);
      
      // If we have cached data for this bus, send it to the newly joined client immediately
      if (activeBusData[busId]) {
        socket.emit('bus_location_update', activeBusData[busId]);
      }
    }
  });

  socket.on('conductor_location_update', (data) => {
    // data: { busId, lat, lng, routeCoordinates, nextStop }
    if (data && data.busId) {
      // Update cache. Only overwrite routeCoordinates if they are provided in the new data.
      if (!activeBusData[data.busId]) {
        activeBusData[data.busId] = {};
      }
      activeBusData[data.busId] = {
        ...activeBusData[data.busId],
        ...data
      };
      
      io.to(`bus_${data.busId}`).emit('bus_location_update', data);
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      const room = io.sockets.adapter.rooms.get(socket.userId);
      // If no more sockets are connected for this user (they closed all tabs)
      if (!room || room.size === 0) {
        onlineUsers.delete(socket.userId);
        io.emit('online_users_update', Array.from(onlineUsers));
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});



// ================= MIDDLEWARE =================

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl || req.url}`);
  next();
});



// ================= STATIC UPLOADS =================

app.use(

  "/uploads",

  express.static(path.join(__dirname, "uploads"))

);



// ================= API ROUTES =================

// AUTH
app.use(

  "/api/auth",

  authRoutes

);


// BUSES
app.use(

  "/api/buses",

  busRoutes

);


// BOOKINGS
app.use(
  "/api/bookings",
  bookingRoutes
);

// STATS
app.use(
  "/api/stats",
  statsRoutes
);

// REVIEWS
app.use(
  "/api/reviews",
  reviewRoutes
);


// ADMIN
app.use(

  "/api/admin",

  adminRoutes

);


// PAYMENT
app.use(
  "/api/payment",
  paymentRoutes
);

// SETTINGS
app.use(
  "/api/settings",
  require("./routes/settingRoutes")
);

// CONDUCTOR
app.use("/api/conductor", require("./routes/conductorRoutes"));

// SETTLEMENT
app.use("/api/settlement", require("./routes/settlementRoutes"));

// CHATBOT
app.use("/api/chat", require("./routes/chatbotRoutes"));


// ================= STATIC FRONTEND =================
app.use(express.static(path.join(__dirname, "../frontend")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});



// ================= SERVER =================

const PORT =

  process.env.PORT ||

  5000;



// Start cron jobs
startCronJobs(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
