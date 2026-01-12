export class OpenRouterService {
    private apiKey: string;
    private baseUrl = 'https://openrouter.ai/api/v1';

    // Models matching ISA Test Environment (Edge Function)
    private models = [
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
        { id: 'openai/gpt-4o', name: 'GPT-4o' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
        { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' },
    ];

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateResponse(message: string, context: string, clientId: string): Promise<string> {
        for (const model of this.models) {
            const res = await this.tryModel(model.id, message, context);
            if (res) return res;
        }

        throw new Error('Todos os modelos de IA falharam.');
    }

    private async tryModel(model: string, message: string, context: string): Promise<string | null> {
        try {
            console.log(`[OpenRouter] Tentando modelo: ${model}`);
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://isa-whatsapp-bot.com', // Must be a valid URL format
                    'X-Title': 'ISA WhatsApp Bot'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: context },
                        { role: 'user', content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                console.warn(`[OpenRouter] Falha no modelo ${model}: ${response.status} ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
                return data.choices[0].message.content;
            }
            return null;

        } catch (error) {
            console.error(`[OpenRouter] Erro ao chamar modelo ${model}:`, error);
            return null;
        }
    }
}
