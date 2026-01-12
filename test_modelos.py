import requests
import json
import time

api_key = "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"
url = "https://openrouter.ai/api/v1/chat/completions"
cabecalhos = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

modelos = [
    "openai/gpt-4o",
    "openai/gpt-4o-mini", 
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-3-haiku",
    "meta-llama/llama-3.1-8b-instruct",
    "google/gemini-pro"
]

print("🧪 Testando múltiplos modelos...")
print("=" * 50)

for modelo in modelos:
    print(f"\n📍 Testando: {modelo}")
    dados = {
        "model": modelo,
        "messages": [{"role": "user", "content": "Olá! Qual modelo você é?"}],
        "max_tokens": 30
    }
    
    try:
        resposta = requests.post(url, headers=cabecalhos, data=json.dumps(dados))
        if resposta.status_code == 200:
            resultado = resposta.json()
            texto = resultado['choices'][0]['message']['content']
            tokens = resultado['usage'].get('total_tokens', 0)
            print(f"✅ {texto[:50]}... (Tokens: {tokens})")
        else:
            erro = resposta.json().get('error', {}).get('message', 'Erro')
            print(f"❌ Erro: {erro[:40]}...")
    except Exception as e:
        print(f"💥 Exceção: {str(e)[:40]}...")
    
    time.sleep(1)

print("\n✅ Teste concluído!")