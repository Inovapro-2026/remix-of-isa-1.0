import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRules() {
    const userId = '82a578cd-86ee-49ca-8b48-b45db1aa345d';
    console.log(`🔍 Buscando regras para User ID: ${userId}`);

    const { data: rules } = await supabase
        .from('ai_behavior_rules')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (rules) {
        console.log(`✅ Regras encontradas:`);
        console.log(rules.rules);
    } else {
        console.log(`⚠️  Nenhuma regra encontrada para este User ID.`);

        // Se não tem regras, mas tem Produtos, talvez devêssemos criar regras padrão de software?
        // Ou deixar limpo.
    }
}

checkUserRules();
