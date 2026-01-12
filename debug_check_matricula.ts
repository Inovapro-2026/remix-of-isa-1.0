import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMatricula() {
    const matricula = '758322';

    console.log(`🔍 Buscando dados para Matrícula: ${matricula}`);

    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('matricula', matricula)
        .maybeSingle();

    if (client) {
        console.log(`👤 Cliente encontrado:`);
        console.log(`   Nome: ${client.name}`);
        console.log(`   Telefone: ${client.phone}`);
        console.log(`   User ID (Supabase Auth): ${client.user_id}`);
    } else {
        console.log(`❌ Matrícula não encontrada.`);
    }
}

checkMatricula();
