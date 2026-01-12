import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Mock data
const mockContacts = [
  { phone: '5511999999999', name: 'João Silva', lastMessage: 'Olá, tudo bem?', timestamp: '10:30' },
  { phone: '5511888888888', name: 'Maria Santos', lastMessage: 'Obrigada pela ajuda!', timestamp: '09:45' },
  { phone: '5511777777777', name: 'Pedro Oliveira', lastMessage: 'Podemos marcar uma reunião?', timestamp: 'Ontem' }
];

// Mock QR Code (SVG Base64)
const MOCK_QR_CODE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0id2hpdGUiLz4KICA8ZyBmaWxsPSJibGFjayI+CiAgICA8cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIvPgogICAgPHJlY3QgeD0iNzAiIHk9IjEwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiLz4KICAgIDxyZWN0IHg9IjEwIiB5PSI3MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIi8+CiAgICA8cmVjdCB4PSI0MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIvPgogICAgPHJlY3QgeD0iNDAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiLz4KICAgIDxyZWN0IHg9IjEwIiB5PSI0MCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIi8+CiAgICA8cmVjdCB4PSI3MCIgeT0iNzAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIvPgogIDwvZz4KPC9zdmc+";

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Handle session joining
  socket.on('join_session', (cpf) => {
    console.log(`Cliente ${socket.id} entrou na sessão CPF: ${cpf}`);
    socket.join(cpf);
    
    // Simulate QR code generation after 2 seconds
    setTimeout(() => {
      socket.emit('qr_code', { qr_code: MOCK_QR_CODE });
      console.log(`QR Code enviado para CPF ${cpf}`);
    }, 2000);
  });

  // Handle message sending
  socket.on('send_message', (data) => {
    console.log('Mensagem recebida:', data);
    const { cpf, phone, text, mode } = data;
    
    // Simulate AI response after 1-3 seconds
    setTimeout(() => {
      const aiResponses = [
        "Olá! Como posso ajudar você hoje?",
        "Entendi sua questão. Posso fornecer mais informações sobre isso.",
        "Obrigado pelo contato! Vou verificar e retornar em breve.",
        "Tenho algumas sugestões que podem ser úteis para você."
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      // Emit AI response
      socket.emit('message_received', {
        phone: phone,
        message: {
          text: randomResponse,
          fromMe: false,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log(`Resposta IA enviada para ${phone}: ${randomResponse}`);
    }, Math.random() * 2000 + 1000);
  });

  // Handle QR code generation request
  socket.on('generate_qr', (data) => {
    console.log('Solicitação de QR Code:', data);
    const { cpf } = data;
    
    // Simulate QR code generation
    setTimeout(() => {
      socket.emit('qr_code', { qr_code: MOCK_QR_CODE });
      console.log(`QR Code gerado para CPF ${cpf}`);
    }, 1000);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Servidor de teste rodando na porta ${PORT}`);
});