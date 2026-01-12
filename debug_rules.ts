
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Listing behavior rules...');
    const { data, error } = await supabase
        .from('ai_behavior_rules')
        .select('user_id, rules')
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Users with rules:');
        data.forEach(d => {
            console.log(`User ID: ${d.user_id}`);
            console.log(`Rules preview: ${d.rules.substring(0, 50)}...`);
            console.log('---');
        });
    }
}

main();
