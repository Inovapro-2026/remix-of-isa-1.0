import { io } from 'socket.io-client';

const socket = io('http://localhost:3002');

console.log('Test client for AI responses...');

socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
  
  const testCpf = '12345678901';
  const testPhone = '5511999999999';
  const testMessage = 'Olá, preciso de ajuda!';
  
  console.log('Testing AI response...');
  console.log('CPF:', testCpf);
  console.log('Phone:', testPhone);
  console.log('Message:', testMessage);
  
  // Send message to trigger AI response
  socket.emit('send_message', {
    cpf: testCpf,
    phone: testPhone,
    text: testMessage,
    mode: 'assistant'
  });
});

socket.on('message_received', (data) => {
  console.log('✅ AI Response received!');
  console.log('Phone:', data.phone);
  console.log('Message:', data.message.text);
  console.log('From AI:', !data.message.fromMe);
  
  // Disconnect after receiving response
  setTimeout(() => {
    socket.disconnect();
    console.log('Test completed. Disconnecting...');
    process.exit(0);
  }, 1000);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('Test timeout - AI response not received');
  socket.disconnect();
  process.exit(1);
}, 10000);