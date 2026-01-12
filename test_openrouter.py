import requests
import json

# Sua chave de API
api_key = "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"

# Endpoint da OpenRouter
url = "https://openrouter.ai/api/v1/chat/completions"

# Headers com sua chave
cabecalhos = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# Dados da requisição
dados = {
    "model": "openai/gpt-4o",  # Você pode mudar para outros modelos
    "messages": [
        {
            "role": "user",
            "content": "Olá! Qual é o seu nome e qual modelo de IA você é?"
        }
    ]
}

print("🧪 Testando sua API do OpenRouter...")
print("-" * 50)

try:
    # Faz a requisição
    resposta = requests.post(url, headers=cabecalhos, data=json.dumps(dados))
    
    # Verifica se foi bem sucedida
    if resposta.status_code == 200:
        resultado = resposta.json()
        
        print(f"✅ Sucesso! Status: {resposta.status_code}")
        print(f"📊 Modelo usado: {resultado.get('model', 'Desconhecido')}")
        print(f"🤖 Resposta do modelo:")
        print(f"   {resultado['choices'][0]['message']['content']}")
        
        # Mostra informações adicionais
        if 'usage' in resultado:
            print(f"\n📈 Estatísticas:")
            print(f"   - Tokens usados: {resultado['usage'].get('total_tokens', 'N/A')}")
            print(f"   - Tokens de entrada: {resultado['usage'].get('prompt_tokens', 'N/A')}")
            print(f"   - Tokens de saída: {resultado['usage'].get('completion_tokens', 'N/A')}")
            
    else:
        print(f"❌ Erro! Status: {resposta.status_code}")
        print(f"📄 Resposta: {resposta.text}")
        
except Exception as e:
    print(f"💥 Erro ao fazer requisição: {str(e)}")

print("-" * 50)