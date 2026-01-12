// Teste do serviço WhatsApp ISA
import whatsappISA from './src/services/whatsappISA';

async function testWhatsAppISA() {
  console.log('🧪 Iniciando testes do WhatsApp ISA...');
  
  try {
    // Testar listagem de sessões
    console.log('\n1. Testando listagem de sessões...');
    const sessions = await whatsappISA.getSessions();
    console.log('✅ Sessões disponíveis:', sessions.sessions.length);
    sessions.sessions.forEach(session => {
      console.log(`   - ${session.client_id} (${session.client_name})`);
    });
    
    // Testar status da sessão
    console.log('\n2. Testando status da sessão test_cpf...');
    const status = await whatsappISA.getSessionStatus('test_cpf');
    console.log('✅ Status obtido:');
    console.log('   - Cliente:', status.dbStatus.client_id);
    console.log('   - Status:', status.dbStatus.status);
    console.log('   - Conectado:', status.isConnected);
    console.log('   - QR Code disponível:', !!status.dbStatus.qr_code);
    
    // Testar QR Code
    console.log('\n3. Testando obtenção de QR Code...');
    const qrCode = await whatsappISA.getQRCode('test_cpf');
    console.log('✅ QR Code obtido com sucesso!');
    console.log('   - Mensagem:', qrCode.message);
    console.log('   - Tamanho do código:', qrCode.qr_code.length, 'caracteres');
    
    console.log('\n🎉 Todos os testes passaram!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
    console.error('Stack:', error.stack);
  }
}

testWhatsAppISA();