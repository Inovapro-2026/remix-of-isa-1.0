import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function consultarBehaviorRules() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  CONSULTA: ai_behavior_rules');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Contar total de registros
    const { count } = await supabase
        .from('ai_behavior_rules')
        .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de registros: ${count || 0}\n`);

    if (count === 0) {
        console.log('⚠️  A tabela está vazia. Nenhuma regra de comportamento foi salva ainda.\n');
        console.log('💡 Para adicionar regras:');
        console.log('   1. Faça login no painel web');
        console.log('   2. Vá em "Memória de Comportamento"');
        console.log('   3. Cole suas regras e clique em "Salvar"\n');
        return;
    }

    // Buscar todos os registros
    const { data: rules, error } = await supabase
        .from('ai_behavior_rules')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Erro ao consultar:', error);
        return;
    }

    // Exibir cada registro
    rules?.forEach((rule, index) => {
        console.log(`\n┌─────────────────────────────────────────────────────────┐`);
        console.log(`│ REGISTRO #${index + 1}`);
        console.log(`├─────────────────────────────────────────────────────────┤`);
        console.log(`│ ID:         ${rule.id}`);
        console.log(`│ User ID:    ${rule.user_id}`);
        console.log(`│ Criado em:  ${new Date(rule.created_at).toLocaleString('pt-BR')}`);
        console.log(`│ Atualizado: ${new Date(rule.updated_at).toLocaleString('pt-BR')}`);
        console.log(`├─────────────────────────────────────────────────────────┤`);
        console.log(`│ REGRAS:`);
        console.log(`└─────────────────────────────────────────────────────────┘`);

        if (rule.rules && rule.rules.trim()) {
            // Exibir as regras com indentação
            const lines = rule.rules.split('\n');
            lines.forEach(line => {
                console.log(`  ${line}`);
            });
        } else {
            console.log(`  (vazio)`);
        }

        console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════\n');
}

// Executar
consultarBehaviorRules().catch(console.error);
