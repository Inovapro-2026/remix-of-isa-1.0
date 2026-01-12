import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMatricula666058() {
    console.log('=== VERIFICANDO MATRÍCULA 666058 ===\n');

    // Buscar cliente por matrícula
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('matricula', '666058')
        .maybeSingle();

    if (clientError) {
        console.error('Erro ao buscar cliente:', clientError.message);
        return;
    }

    if (!client) {
        console.log('❌ Cliente com matrícula 666058 NÃO ENCONTRADO no Supabase.');
        console.log('\nVerificando se existe algum cliente com matrícula parecida...\n');

        const { data: similarClients } = await supabase
            .from('clients')
            .select('matricula, cpf, phone, user_id')
            .like('matricula', '%666%')
            .limit(5);

        if (similarClients && similarClients.length > 0) {
            console.log('Clientes encontrados com "666" na matrícula:');
            similarClients.forEach(c => {
                console.log(`  - Matrícula: ${c.matricula}, CPF: ${c.cpf}, Phone: ${c.phone}`);
            });
        }
        return;
    }

    console.log('✅ Cliente encontrado!');
    console.log(`   CPF: ${client.cpf}`);
    console.log(`   Phone: ${client.phone}`);
    console.log(`   User ID: ${client.user_id}`);
    console.log(`   Matrícula: ${client.matricula}\n`);

    // Buscar produtos do cliente
    if (client.user_id) {
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', client.user_id)
            .eq('is_active', true);

        if (productsError) {
            console.error('Erro ao buscar produtos:', productsError.message);
            return;
        }

        console.log(`\n📦 PRODUTOS NO SUPABASE: ${products?.length || 0}\n`);

        if (products && products.length > 0) {
            products.forEach((p, i) => {
                console.log(`${i + 1}. ${p.name}`);
                console.log(`   Código: ${p.code || 'S/C'}`);
                console.log(`   Preço: R$ ${p.price.toFixed(2)}`);
                console.log(`   Categoria: ${p.category || 'Sem categoria'}`);
                console.log('');
            });
        } else {
            console.log('❌ Nenhum produto encontrado no Supabase para este cliente.');
        }

        // Verificar se existe pasta local
        console.log('\n📁 STATUS DA PASTA LOCAL:');
        const fs = await import('fs');
        const path = await import('path');
        const localPath = path.resolve(`/root/INOVAPRO/isa-1.0-de9193c7/memoria/${client.matricula}`);

        if (fs.existsSync(localPath)) {
            console.log(`✅ Pasta existe: ${localPath}`);
            const dbPath = path.join(localPath, 'memoria_ia.db');
            if (fs.existsSync(dbPath)) {
                console.log(`✅ Banco SQLite existe: ${dbPath}`);
            } else {
                console.log(`❌ Banco SQLite NÃO existe: ${dbPath}`);
            }
        } else {
            console.log(`❌ Pasta NÃO existe: ${localPath}`);
            console.log('\n⚠️ AÇÃO NECESSÁRIA: O cliente precisa salvar as configurações no dashboard para criar a pasta local.');
        }
    }
}

checkMatricula666058().catch(console.error);
