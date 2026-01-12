// Socket service stub - WebSocket functionality removed
// WhatsApp now uses direct HTTP API

export const socket = {
  connected: false,
  connect: () => console.log('Socket disabled - using HTTP API'),
  disconnect: () => console.log('Socket disabled'),
  emit: (..._args: any[]) => console.log('Socket disabled'),
  on: (..._args: any[]) => console.log('Socket disabled'),
  off: (..._args: any[]) => console.log('Socket disabled'),
};

export const connectToSession = (_clientId: string) => {
  console.log('Socket disabled - WhatsApp uses HTTP API polling');
};
