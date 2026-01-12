module.exports = {
  apps: [
    {
      name: 'isa-frontend',
      script: 'npm',
      args: 'run dev -- --host',
      cwd: '/root/INOVAPRO/isa-1.0-de9193c7',
      env: {
        NODE_ENV: 'production',
        PORT: 9001,
        VITE_PORT: 9001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'isa-whatsapp',
      script: 'npm',
      args: 'run start:server',
      cwd: '/root/INOVAPRO/isa-1.0-de9193c7',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
