import { io } from 'socket.io-client';

const socket = io('http://localhost:3002');

console.log('Test client connecting to server...');

socket.on('connect', () => {
  console.log('Connected to server:', socket.id);
  
  // Test CPF
  const testCpf = '12345678901';
  console.log('Joining session for CPF:', testCpf);
  
  // Join session
  socket.emit('join_session', testCpf);
});

socket.on('qr_code', (data) => {
  console.log('QR Code received:', data.qr_code.substring(0, 50) + '...');
  console.log('✅ QR Code generation is working!');
  
  // Disconnect after receiving QR code
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
  console.log('Test timeout - QR code not received');
  socket.disconnect();
  process.exit(1);
}, 10000);