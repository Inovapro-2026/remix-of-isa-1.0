// Simple proxy server to resolve CORS issues
const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Proxy requests to backend
  if (req.url.startsWith('/api')) {
    proxy.web(req, res, {
      target: 'http://localhost:3001',
      changeOrigin: true
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.writeHead(500);
  res.end('Proxy error');
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});