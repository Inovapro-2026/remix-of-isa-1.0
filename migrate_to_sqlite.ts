import { createClient } from '@supabase/supabase-js';
import localMemoryService from './backend/services/localMemoryService.js';

const supabaseUrl = 'https://mcmkzimvkomfytfaybpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jbWt6aW12a29tZnl0ZmF5YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MDk1NjcsImV4cCI6MjA4MjQ4NTU2N30.6HSUi7Sa9dpFkv1bQEZOF4syZzjaC0MNdIFIZ_SncQA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateToSQLite() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  MIGRAÇÃO: Supabase → SQLite Local');
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
        // 1. Buscar todas as regras de comportamento do Supabase
        console.log('📥 Buscando regras de comportamento do Supabase...');
        const { data: rules, error } = await supabase
            .from('ai_behavior_rules')
            .select('*');

        if (error) {
            console.error('❌ Erro ao buscar regras:', error);
            return;
        }

        if (!rules || rules.length === 0) {
            console.log('⚠️  Nenhuma regra encontrada no Supabase.');
            return;
        }

        console.log(`✅ Encontradas ${rules.length} regras no Supabase\n`);

        // 2. Migrar cada regra para SQLite local
        for (const rule of rules) {
            if (!rule.matricula) {
                console.log(`⚠️  Pulando regra sem matrícula (user_id: ${rule.user_id})`);
                continue;
            }

            console.log(`\n📝 Migrando matrícula: ${rule.matricula}`);
            console.log(`   User ID: ${rule.user_id}`);
            console.log(`   Regras (preview): ${rule.rules?.substring(0, 60)}...`);

            // Salvar no SQLite local
            const success = await localMemoryService.saveBehaviorRules(
                rule.matricula,
                rule.rules || ''
            );

            if (success) {
                console.log(`   ✅ Migrado com sucesso!`);
            } else {
                console.log(`   ❌ Erro ao migrar`);
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('  MIGRAÇÃO CONCLUÍDA!');
        console.log('═══════════════════════════════════════════════════════════\n');

        // 3. Verificar arquivos criados
        console.log('📁 Arquivos SQLite criados:');
        const fs = await import('fs');
        const path = await import('path');
        const contasDir = path.resolve('./contas');

        if (fs.existsSync(contasDir)) {
            const matriculas = fs.readdirSync(contasDir);
            matriculas.forEach(matricula => {
                const dbPath = path.join(contasDir, matricula, 'memoria_ia.db');
                if (fs.existsSync(dbPath)) {
                    const stats = fs.statSync(dbPath);
                    console.log(`   ✅ /contas/${matricula}/memoria_ia.db (${stats.size} bytes)`);
                }
            });
        }

        console.log('\n🎉 Migração completa! Agora você pode testar o sistema.');

    } catch (error) {
        console.error('❌ Erro durante migração:', error);
    } finally {
        await localMemoryService.closeAll();
    }
}

// Executar migração
migrateToSQLite();
