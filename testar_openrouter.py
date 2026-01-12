#!/usr/bin/env python3
"""
Testador de Modelos OpenRouter
Verifica quais modelos de IA estão disponíveis e funcionando com sua API key
"""

import requests
import json
import time
from datetime import datetime

# Sua API key
API_KEY = "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"
BASE_URL = "https://openrouter.ai/api/v1"

# Modelos para testar (baseado no guia)
MODELOS_TESTAR = [
    "openai/gpt-4o",
    "openai/gpt-4o-mini", 
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-3-haiku",
    "meta-llama/llama-3.1-8b-instruct",
    "google/gemini-pro-1.5",
    "google/gemini-flash-1.5"
]

def testar_modelo(modelo_nome):
    """Testa um modelo específico"""
    print(f"\n🔄 Testando: {modelo_nome}")
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "HTTP-Referer": "https://github.com/teste",
        "X-Title": "Testador OpenRouter"
    }
    
    dados = {
        "model": modelo_nome,
        "messages": [
            {
                "role": "user",
                "content": "Olá! Quem é você? Por favor responda em português."
            }
        ],
        "max_tokens": 100
    }
    
    try:
        inicio = time.time()
        resposta = requests.post(
            f"{BASE_URL}/chat/completions",
            headers=headers,
            json=dados,
            timeout=30
        )
        tempo_resposta = time.time() - inicio
        
        if resposta.status_code == 200:
            resultado = resposta.json()
            mensagem = resultado['choices'][0]['message']['content']
            tokens_usados = resultado['usage']['total_tokens']
            
            print(f"✅ SUCESSO - Tempo: {tempo_resposta:.1f}s - Tokens: {tokens_usados}")
            print(f"📝 Resposta: {mensagem[:100]}...")
            
            return {
                "status": "sucesso",
                "modelo": modelo_nome,
                "tempo_resposta": tempo_resposta,
                "tokens_usados": tokens_usados,
                "resposta": mensagem[:200],
                "custo_estimado": calcular_custo(modelo_nome, tokens_usados)
            }
        else:
            erro = resposta.json().get('error', {}).get('message', 'Erro desconhecido')
            print(f"❌ ERRO {resposta.status_code}: {erro}")
            return {
                "status": "erro",
                "modelo": modelo_nome,
                "erro": erro,
                "codigo": resposta.status_code
            }
            
    except requests.exceptions.Timeout:
        print(f"❌ TIMEOUT: Demorou mais de 30 segundos")
        return {
            "status": "timeout",
            "modelo": modelo_nome
        }
    except Exception as e:
        print(f"❌ EXCEÇÃO: {str(e)}")
        return {
            "status": "excecao",
            "modelo": modelo_nome,
            "erro": str(e)
        }

def calcular_custo(modelo, tokens):
    """Calcula custo estimado baseado em preços aproximados"""
    precos = {
        "openai/gpt-4o": 0.03,
        "openai/gpt-4o-mini": 0.01,
        "anthropic/claude-3.5-sonnet": 0.03,
        "anthropic/claude-3-haiku": 0.01,
        "meta-llama/llama-3.1-8b-instruct": 0.001,
        "google/gemini-pro-1.5": 0.02,
        "google/gemini-flash-1.5": 0.01
    }
    
    preco_por_1k = precos.get(modelo, 0.01)
    return (tokens / 1000) * preco_por_1k

def verificar_creditos():
    """Verifica créditos disponíveis na conta"""
    print("\n💰 Verificando créditos disponíveis...")
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "HTTP-Referer": "https://github.com/teste",
        "X-Title": "Testador OpenRouter"
    }
    
    try:
        resposta = requests.get(
            "https://openrouter.ai/api/v1/auth/key",
            headers=headers,
            timeout=10
        )
        
        if resposta.status_code == 200:
            dados = resposta.json()
            creditos = dados.get('data', {}).get('total_credits', 0)
            print(f"💳 Créditos disponíveis: ${creditos:.4f}")
            return creditos
        else:
            print(f"❌ Não foi possível verificar créditos")
            return 0
            
    except Exception as e:
        print(f"❌ Erro ao verificar créditos: {e}")
        return 0

def main():
    """Função principal"""
    print("=" * 70)
    print("🔍 TESTADOR DE MODELOS OPENROUTER")
    print("=" * 70)
    print(f"📅 Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"🔑 API Key: {API_KEY[:20]}...")
    
    # Verificar créditos
    creditos = verificar_creditos()
    
    print(f"\n🎯 Iniciando testes com {len(MODELOS_TESTAR)} modelos...")
    print("-" * 70)
    
    resultados = []
    total_tokens = 0
    
    # Testar cada modelo
    for modelo in MODELOS_TESTAR:
        resultado = testar_modelo(modelo)
        resultados.append(resultado)
        
        if resultado['status'] == 'sucesso':
            total_tokens += resultado['tokens_usados']
        
        # Pequena pausa entre testes
        time.sleep(1)
    
    # Relatório final
    print("\n" + "=" * 70)
    print("📊 RELATÓRIO FINAL")
    print("=" * 70)
    
    funcionando = [r for r in resultados if r['status'] == 'sucesso']
    erros = [r for r in resultados if r['status'] != 'sucesso']
    
    print(f"\n✅ MODELOS FUNCIONANDO ({len(funcionando)}):")
    for resultado in funcionando:
        print(f"  • {resultado['modelo']}")
        print(f"    Tempo: {resultado['tempo_resposta']:.1f}s | Tokens: {resultado['tokens_usados']} | Custo: ${resultado['custo_estimado']:.4f}")
    
    if erros:
        print(f"\n❌ MODELOS COM ERRO ({len(erros)}):")
        for resultado in erros:
            print(f"  • {resultado['modelo']}: {resultado.get('erro', 'Erro desconhecido')}")
    
    print(f"\n💰 RESUMO DE CUSTOS:")
    print(f"  • Total de tokens utilizados: {total_tokens}")
    print(f"  • Custo total estimado: ${sum(r.get('custo_estimado', 0) for r in funcionando):.4f}")
    print(f"  • Créditos restantes: ${creditos:.4f}")
    
    print(f"\n📝 RECOMENDAÇÕES:")
    if len(funcionando) > 0:
        print(f"  • Use 'openai/gpt-4o-mini' para melhor custo-benefício")
        print(f"  • Use 'anthropic/claude-3-haiku' para velocidade")
        print(f"  • Use 'openai/gpt-4o' ou 'anthropic/claude-3.5-sonnet' para qualidade máxima")
    
    # Salvar resultados em arquivo
    with open('resultados_teste_openrouter.json', 'w', encoding='utf-8') as f:
        json.dump({
            "data_teste": datetime.now().isoformat(),
            "api_key": API_KEY[:20] + "...",
            "creditos_disponiveis": creditos,
            "total_modelos_testados": len(MODELOS_TESTAR),
            "modelos_funcionando": len(funcionando),
            "modelos_erro": len(erros),
            "total_tokens_utilizados": total_tokens,
            "resultados": resultados
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Resultados salvos em: resultados_teste_openrouter.json")

if __name__ == "__main__":
    main()