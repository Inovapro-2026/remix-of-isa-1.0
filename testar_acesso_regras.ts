import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarAcessoRegras() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  TESTE: Acesso às Regras via Backend (chave anon)');
    console.log('═══════════════════════════════════════════════════════════\n');

    // IDs visíveis na captura de tela
    const userIds = [
        '8f0f7e82-1bd7-4999-866f-ddb4948b7554',
        '82ae78cd-86ae-49ca-8b48-b45db1aa345'
    ];

    for (const userId of userIds) {
        console.log(`\n🔍 Testando acesso para user_id: ${userId}`);
        console.log('─'.repeat(60));

        const { data, error } = await supabase
            .from('ai_behavior_rules')
            .select('rules')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.log(`❌ Erro: ${error.message}`);
            console.log(`   Code: ${error.code}`);
        } else if (data) {
            console.log(`✅ SUCESSO! Regras encontradas:`);
            console.log(`   Preview: ${data.rules?.substring(0, 80)}...`);
        } else {
            console.log(`⚠️  Nenhum dado retornado (possível RLS bloqueando)`);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');
}

testarAcessoRegras();
