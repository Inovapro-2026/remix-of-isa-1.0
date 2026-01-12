import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCode() {
    const code = 'B1B717';
    console.log(`🔍 Buscando produtos com código: ${code}`);

    const { data: products } = await supabase
        .from('products')
        .select('*');

    if (products) {
        const matches = products.filter(p => p.code === code);
        matches.forEach(p => {
            console.log(`- Nome: ${p.name}`);
            console.log(`  Descrição: ${p.description}`);
            console.log(`  Preço: ${p.price}`);
        });
    }
}

checkCode();
