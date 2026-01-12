import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { clientWhatsAppISA } from "@/services/clientWhatsAppISA";

interface SimulatorProps {
    clientId: string;
    config: any;
}

export const Simulator = ({ clientId, config }: SimulatorProps) => {
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput("");
        setLoading(true);
        setAnalysis([]);

        try {
            // @ts-ignore
            const res = await clientWhatsAppISA.testAI(clientId, userMsg, config);
            setMessages(prev => [...prev, { role: 'ai', text: res.reply }]);
            setAnalysis(res.analysis || []);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', text: "Erro ao simular resposta." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1E1E1E] rounded-xl border border-[#27272a] overflow-hidden">
            <div className="p-4 border-b border-[#27272a] bg-[#1E1E1E] flex justify-between items-center">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Simulador em Tempo Real
                </h3>
                <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">Ambiente de Teste</span>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                        <Sparkles className="h-8 w-8 opacity-20" />
                        <p className="text-sm">Envie uma mensagem para testar a IA</p>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-[#27272a] text-zinc-200 rounded-bl-none'
                            }`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-[#27272a] rounded-2xl px-4 py-2 rounded-bl-none flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-100" />
                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Analysis Panel */}
            {analysis.length > 0 && (
                <div className="bg-[#151515] p-3 border-t border-[#27272a]">
                    <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Análise da Resposta</p>
                    <div className="space-y-1">
                        {analysis.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-green-400">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-3 bg-[#1E1E1E] border-t border-[#27272a] flex gap-2">
                <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    className="bg-[#27272a] border-none text-white focus-visible:ring-1 focus-visible:ring-blue-600"
                    placeholder="Digite como um cliente..."
                />
                <Button size="icon" onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
