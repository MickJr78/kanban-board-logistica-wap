const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use('/api/cards', require('./routes/cardRoutes'));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('card_created', (card) => io.emit('card_created', card));
  socket.on('card_updated', (card) => io.emit('card_updated', card));
  socket.on('card_deleted', (id) => io.emit('card_deleted', id));
  socket.on('card_moved', (data) => io.emit('card_moved', data));
  socket.on('card_archived', (id) => io.emit('card_archived', id));
  
  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { prisma, io };