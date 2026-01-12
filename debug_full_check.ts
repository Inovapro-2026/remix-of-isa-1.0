import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('=== VERIFICAÇÃO COMPLETA ===\n');

    // 1. Contar regras
    const { count: rulesCount } = await supabase
        .from('ai_behavior_rules')
        .select('*', { count: 'exact', head: true });

    console.log(`Total de regras na tabela: ${rulesCount || 0}\n`);

    // 2. Listar todas as regras
    const { data: rules } = await supabase
        .from('ai_behavior_rules')
        .select('*')
        .limit(10);

    if (rules && rules.length > 0) {
        console.log('Regras encontradas:');
        rules.forEach((r, i) => {
            console.log(`\n[${i + 1}] User ID: ${r.user_id}`);
            console.log(`    Regras (primeiros 100 chars): ${r.rules?.substring(0, 100) || '(vazio)'}...`);
            console.log(`    Criado em: ${r.created_at}`);
            console.log(`    Atualizado em: ${r.updated_at}`);
        });
    } else {
        console.log('❌ Nenhuma regra encontrada na tabela ai_behavior_rules');
    }

    // 3. Verificar clientes
    console.log('\n\n=== CLIENTES ===');
    const { data: clients } = await supabase
        .from('clients')
        .select('user_id, cpf, phone, matricula')
        .not('user_id', 'is', null)
        .limit(5);

    console.log(`Clientes com user_id: ${clients?.length || 0}`);
    if (clients && clients.length > 0) {
        console.table(clients);
    }
}

main();
