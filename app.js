require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { init, getMarketData, update5paisaSubscription } = require("./ws5paisa");
const authRoutes = require("./router/authRoutes");
const fivePaisaRoutes = require("./router/fivePaisaRoutes"); // Import the market data routes

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/market-data", fivePaisaRoutes); // Add this line to include the market data routes

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected."))
  .catch((err) => console.log(err));

io.on("connection", (socket) => {
  console.log("React client connected", socket.id);

  socket.on("subscribe", (data) => {
    update5paisaSubscription(data);
  });

  const latest = getMarketData();

  Object.values(latest).forEach(item => {
    socket.emit("marketData", item);
  })

  socket.on("disconnect", () => {
    console.log("React client disconnected", socket.id);
  });
});

// init(io); // Initialize WebSocket connection with Socket.IO instance

server.listen(process.env.PORT, () => {
  console.log("server started.");
});
