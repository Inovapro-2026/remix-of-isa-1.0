import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarMatriculas() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  TESTE: Buscar Cliente por Matrícula');
    console.log('═══════════════════════════════════════════════════════════\n');

    const matriculas = ['758322', '666058', '390151'];

    for (const matricula of matriculas) {
        console.log(`\n🔍 Matrícula: ${matricula}`);
        console.log('─'.repeat(60));

        const { data: client } = await supabase
            .from('clients')
            .select('*')
            .eq('matricula', matricula)
            .maybeSingle();

        if (client) {
            console.log(`✅ Cliente encontrado:`);
            console.log(`   Nome: ${client.full_name || 'N/A'}`);
            console.log(`   CPF: ${client.cpf || 'N/A'}`);
            console.log(`   Phone: ${client.phone || 'N/A'}`);
            console.log(`   User ID: ${client.user_id || 'NULL'}`);

            // Buscar regras por matrícula
            const { data: rules } = await supabase
                .from('ai_behavior_rules')
                .select('rules')
                .eq('matricula', matricula)
                .maybeSingle();

            if (rules?.rules) {
                console.log(`   🎯 TEM REGRAS VINCULADAS!`);
                console.log(`   Preview: ${rules.rules.substring(0, 60)}...`);
            } else {
                console.log(`   ⚠️  Sem regras vinculadas`);
            }
        } else {
            console.log(`❌ Cliente não encontrado`);
        }
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');
}

testarMatriculas();
