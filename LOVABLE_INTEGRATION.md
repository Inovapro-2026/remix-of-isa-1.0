# 🎨 Integração com Lovable (ou outros servidores)

Agora você tem uma API REST completa para integrar o sistema de WhatsApp da ISA diretamente no Lovable ou qualquer outro frontend.

## 🚀 Endpoints Públicos

O backend está configurado em: `http://148.230.76.60:3001` (Porta 3001).

### 1. Iniciar Conexão
Para pedir ao backend que inicie uma sessão para um CPF/ID específico.
- **URL**: `POST /api/public/connect`
- **Body**: `{"cpf": "12345678900"}`
- **Resposta**: `{"status": "connecting"}` ou `{"status": "connected"}`

### 2. Verificar Status
Para saber se já tem um QR Code pronto ou se já conectou.
- **URL**: `GET /api/public/status/12345678900`
- **Resposta**: 
  ```json
  {
    "status": "qr_ready",
    "qrCode": "string_do_qr",
    "messagesToday": 0,
    "activeContacts": 0
  }
  ```

### 3. Obter QR Code (Imagem)
Este é o endpoint mais fácil para o Lovable. Você pode colocar uma imagem direto apontando para esta URL.
- **URL**: `http://148.230.76.60:3001/api/public/qr/12345678900`
- **Uso no Lovable**: Basta colocar um componente de **Imagem** com esta URL. 

### 4. Desconectar/Reset
Para encerrar a sessão.
- **URL**: `POST /api/public/disconnect`
- **Body**: `{"cpf": "12345678900"}`

---

## 🛠️ Exemplo de Lógica no Lovable (React)

No seu projeto Lovable, você pode usar um `useEffect` para monitorar o status:

```javascript
const [status, setStatus] = useState('disconnected');
const cpf = "SEU_ID_OU_CPF";
const API_BASE = "http://148.230.76.60:3001/api/public";

// 1. Função para conectar
const handleConnect = async () => {
  await fetch(`${API_BASE}/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpf })
  });
  setStatus('connecting');
};

// 2. Polling de status (opcional, se quiser mostrar estatísticas)
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`${API_BASE}/status/${cpf}`);
    const data = await res.json();
    setStatus(data.status);
  }, 5000); // Checar a cada 5 segundos
  return () => clearInterval(interval);
}, [cpf]);

// 3. Renderização do QR Code
return (
  <div>
    {status === 'qr_ready' && (
      <img 
        src={`${API_BASE}/qr/${cpf}`} 
        alt="WhatsApp QR Code"
        style={{ width: 300, height: 300 }}
      />
    )}
    {status === 'connected' && <p>✅ Conectado!</p>}
  </div>
);
```

> [!TIP]
> O endpoint `/api/public/qr/:cpf` já retorna os cabeçalhos de `Cache-Control` corretamente para que a imagem não fique em cache enquanto o QR está sendo gerado.
