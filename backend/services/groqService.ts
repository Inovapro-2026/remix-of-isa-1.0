export class GroqService {
    private apiKey: string;
    private baseUrl = 'https://api.groq.com/openai/v1';

    // Groq Free Models (Fast and Reliable)
    private tier1Models = [
        'llama-3.3-70b-versatile',  // Latest Llama 3.3 70B - Best quality
        'llama-3.1-70b-versatile'   // Llama 3.1 70B - Excellent fallback
    ];

    private tier2Models = [
        'llama-3.1-8b-instant',     // Fast 8B model
        'mixtral-8x7b-32768'        // Mixtral - Good for complex tasks
    ];

    private tier3Models = [
        'gemma2-9b-it',             // Google's Gemma 2
        'llama3-8b-8192'            // Llama 3 8B
    ];

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        const keyPreview = apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : 'EMPTY';
        console.log(`[Groq] Service initialized with API key: ${keyPreview}`);
    }

    async generateResponse(message: string, context: string, clientId: string): Promise<string> {
        // Try Tier 1 (Best Quality)
        for (const model of this.tier1Models) {
            const res = await this.tryModel(model, message, context);
            if (res) return res;
        }

        // Try Tier 2 (Fast)
        for (const model of this.tier2Models) {
            const res = await this.tryModel(model, message, context);
            if (res) return res;
        }

        // Try Tier 3 (Fallback)
        for (const model of this.tier3Models) {
            const res = await this.tryModel(model, message, context);
            if (res) return res;
        }

        throw new Error('Todos os modelos Groq falharam.');
    }

    private async tryModel(model: string, message: string, context: string): Promise<string | null> {
        try {
            console.log(`[Groq] Tentando modelo: ${model}`);
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: context },
                        { role: 'user', content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                    top_p: 1,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`[Groq] Falha no modelo ${model}: ${response.status} ${response.statusText} - ${errorText}`);
                return null;
            }

            const data = await response.json();
            if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
                console.log(`[Groq] ✅ Sucesso com modelo ${model}`);
                return data.choices[0].message.content;
            }
            return null;

        } catch (error) {
            console.error(`[Groq] Erro ao chamar modelo ${model}:`, error);
            return null;
        }
    }
}
