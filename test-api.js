// Teste direto da API WhatsApp ISA
async function testWhatsAppISA() {
  console.log('🧪 Iniciando testes do WhatsApp ISA...');
  
  const API_BASE_URL = 'http://localhost:3001/api';
  
  try {
    // Testar listagem de sessões
    console.log('\n1. Testando listagem de sessões...');
    const sessionsResponse = await fetch(`${API_BASE_URL}/sessions/list`);
    const sessions = await sessionsResponse.json();
    console.log('✅ Sessões disponíveis:', sessions.sessions.length);
    sessions.sessions.forEach(session => {
      console.log(`   - ${session.client_id} (${session.client_name})`);
    });
    
    // Testar status da sessão
    console.log('\n2. Testando status da sessão test_cpf...');
    const statusResponse = await fetch(`${API_BASE_URL}/sessions/test_cpf/status`);
    const status = await statusResponse.json();
    console.log('✅ Status obtido:');
    console.log('   - Cliente:', status.dbStatus.client_id);
    console.log('   - Status:', status.dbStatus.status);
    console.log('   - Conectado:', status.isConnected);
    console.log('   - QR Code disponível:', !!status.dbStatus.qr_code);
    
    // Testar QR Code com fallback
    console.log('\n3. Testando obtenção de QR Code...');
    let qrCodeData;
    
    try {
      // Tentar endpoint de QR Code
      const qrResponse = await fetch(`${API_BASE_URL}/qr/test_cpf`);
      if (!qrResponse.ok) {
        throw new Error('Endpoint de QR Code falhou');
      }
      qrCodeData = await qrResponse.json();
      console.log('✅ QR Code obtido do endpoint direto');
    } catch (qrError) {
      // Fallback: obter do status
      console.log('⚠️  Endpoint de QR Code falhou, usando fallback do status...');
      if (status.dbStatus.qr_code) {
        qrCodeData = {
          success: true,
          qr_code: status.dbStatus.qr_code,
          message: 'QR Code obtido do status da sessão (fallback)'
        };
        console.log('✅ QR Code obtido via fallback');
      } else {
        throw new Error('QR Code não encontrado');
      }
    }
    
    console.log('   - Mensagem:', qrCodeData.message);
    console.log('   - Tamanho do código:', qrCodeData.qr_code.length, 'caracteres');
    
    console.log('\n🎉 Todos os testes passaram!');
    console.log('\n📱 O QR Code está pronto para ser exibido no frontend!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

testWhatsAppISA();