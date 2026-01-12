import localMemoryService from './backend/services/localMemoryService.js';

async function checkSQLite() {
    console.log('🔍 Verificando SQLite 758322...');
    const products = await localMemoryService.getProducts('758322');

    console.log(`📦 Produtos no banco (${products.length}):`);
    products.forEach(p => {
        console.log(`- [${p.code}] ${p.name} (ID: ${p.id})`);
    });

    await localMemoryService.closeAll();
}

checkSQLite();
