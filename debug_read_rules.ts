import localMemoryService from './backend/services/localMemoryService.js';

async function checkRules() {
    const matricula = '758322';
    console.log(`🔍 Verificando Regras para Matrícula: ${matricula}`);

    const rules = await localMemoryService.getBehaviorRules(matricula);
    console.log(`📜 Regras encontradas (${rules.length} chars):`);
    console.log(rules);

    await localMemoryService.closeAll();
}

checkRules();
