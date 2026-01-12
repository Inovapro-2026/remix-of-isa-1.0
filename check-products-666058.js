import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('/root/INOVAPRO/isa-1.0-de9193c7/memoria/666058/memoria_ia.db');

try {
    const db = new Database(dbPath, { readonly: true });

    console.log('=== PRODUTOS DA MATRÍCULA 666058 ===\n');

    // Contar produtos ativos
    const count = db.prepare('SELECT COUNT(*) as total FROM products WHERE active = 1').get();
    console.log(`Total de produtos ativos: ${count.total}\n`);

    // Listar produtos
    const products = db.prepare(`
        SELECT id, name, code, price, description, category, active 
        FROM products 
        WHERE active = 1
        ORDER BY category, name
    `).all();

    if (products.length > 0) {
        products.forEach((p, i) => {
            console.log(`${i + 1}. ${p.name}`);
            console.log(`   Código: ${p.code || 'S/C'}`);
            console.log(`   Preço: R$ ${p.price.toFixed(2)}`);
            console.log(`   Categoria: ${p.category || 'Sem categoria'}`);
            if (p.description) {
                console.log(`   Descrição: ${p.description}`);
            }
            console.log('');
        });
    } else {
        console.log('❌ Nenhum produto ativo encontrado.');
    }

    // Verificar info do cliente
    console.log('\n=== INFORMAÇÕES DO CLIENTE ===\n');
    const clientInfo = db.prepare('SELECT * FROM client_info ORDER BY id DESC LIMIT 1').get();

    if (clientInfo) {
        console.log(`Nome da IA: ${clientInfo.ai_name || 'Não configurado'}`);
        console.log(`Empresa: ${clientInfo.company_name || 'Não configurado'}`);
        console.log(`Tom de voz: ${clientInfo.tone_of_voice || 'Não configurado'}`);
    } else {
        console.log('⚠️ Nenhuma configuração de cliente encontrada.');
    }

    db.close();
} catch (error) {
    console.error('Erro ao acessar o banco:', error.message);
    process.exit(1);
}
