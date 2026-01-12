const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = 3001;

// Mock QR Code (placeholder image)
const MOCK_QR_CODE = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ISA-WHATSAPP-TEST-VALID";

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // 1. Handle QR Generation Request
  socket.on('generate_qr', (data) => {
    console.log(`[${data.cpf}] Requesting QR Code...`);
    
    // Simulate delay then send QR
    setTimeout(() => {
      socket.emit('qr_code', {
        cpf: data.cpf,
        qr: MOCK_QR_CODE
      });
      console.log(`[${data.cpf}] QR Code sent to client`);

      // Simulate user scanning QR code after 8 seconds
      console.log(`[${data.cpf}] Waiting for simulated scan (8s)...`);
      setTimeout(() => {
        console.log(`[${data.cpf}] QR Scanned! Connecting session...`);
        io.emit('status_change', {
            cpf: data.cpf,
            status: 'connected'
        });
      }, 8000);

    }, 1500);
  });

  // 2. Handle Message Sending (Chat Tab)
  socket.on('send_message', (data) => {
    console.log(`[${data.cpf}] Message received [${data.mode}]: ${data.text}`);
    
    // If AI mode is active, simulate response
    if (data.mode === 'ai' || data.mode === 'mixed') {
        setTimeout(() => {
            const aiResponse = `ISA (IA): Recebi sua mensagem: "${data.text}". Estou processando conforme as regras definidas.`;
            console.log(`[${data.cpf}] AI Response Generated: ${aiResponse}`);
            // In a real app, we would emit 'new_message' here
        }, 2000);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`✅ Test Server running on http://localhost:${PORT}`);
  console.log(`   - Socket.io ready for connections`);
});
