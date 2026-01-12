import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Video, MoreVertical, Smile, Paperclip, Send, Mic, Bot, User, Zap, Check, CheckCheck } from "lucide-react";
import { Contact } from "./ChatSidebar";

export interface Message {
    id: string;
    text: string;
    sender: 'me' | 'other' | 'ai';
    timestamp: string;
    status?: 'sent' | 'delivered' | 'read';
    senderType?: 'human' | 'ai';
}

interface ChatAreaProps {
    contact: Contact | null;
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (text: string, mode: 'ai' | 'manual') => void;
}

export const ChatArea = ({ contact, messages, isLoading, onSendMessage }: ChatAreaProps) => {
    const [input, setInput] = useState("");
    const [mode, setMode] = useState<'ai' | 'manual' | 'mixed'>('ai');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        // Determine mode: if mixed, treat as manual if sending text? Or use selected mode?
        // Spec says: "Digite instruções para IA ou envie vazio..." implies specific logic.
        // For now, simple logic: Use selected mode.
        const effectiveMode = mode === 'mixed' ? 'manual' : mode;
        onSendMessage(input, effectiveMode);
        setInput("");
    };

    if (!contact) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#0D0D0D] text-gray-500">
                <div className="text-center">
                    <p className="text-lg mb-2">Selecione uma conversa para começar</p>
                    <div className="w-16 h-16 bg-[#1E1E1E] rounded-full mx-auto flex items-center justify-center opacity-50">
                        <span className="text-2xl">💬</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0D0D0D]">
            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between bg-[#1E1E1E] border-b border-[#27272a]">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback className="bg-[#333] text-gray-300">
                            {contact.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="text-white font-medium text-sm">{contact.name}</h3>
                        <p className="text-xs flex items-center gap-1 text-gray-400">
                            {contact.status === 'online' ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#28A745]" />
                                    <span className="text-[#28A745]">Online</span>
                                </>
                            ) : (
                                "Offline"
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                    <Button variant="ghost" size="icon" className="hover:bg-[#2A2A2A] hover:text-white"><Phone className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="hover:bg-[#2A2A2A] hover:text-white"><Video className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="hover:bg-[#2A2A2A] hover:text-white"><MoreVertical className="w-4 h-4" /></Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('/bg-chat-dark.png')] bg-repeat">
                {isLoading ? (
                    <div className="flex justify-center p-4"><span className="text-gray-500 text-sm">Carregando mensagens...</span></div>
                ) : messages.map((msg) => (
                    <div key={msg.id} className={`flex w-full ${msg.sender === 'other' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[70%] rounded-lg p-2.5 shadow-sm relative ${msg.sender === 'other'
                                ? 'bg-[#1E1E1E] text-white rounded-tl-none'
                                : msg.senderType === 'ai'
                                    ? 'bg-[#0056B3] text-white rounded-tr-none'
                                    : 'bg-[#15803d] text-white rounded-tr-none' // Green-700
                            }`}>
                            {/* Sender Label */}
                            {msg.sender !== 'other' && (
                                <div className="flex items-center gap-1 mb-1 text-[10px] opacity-75 font-semibold uppercase tracking-wider">
                                    {msg.senderType === 'ai' ? <><Bot className="w-3 h-3" /> IA</> : <><User className="w-3 h-3" /> Manual</>}
                                </div>
                            )}

                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                            <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                                <span className="text-[10px]">{msg.timestamp}</span>
                                {msg.sender !== 'other' && (
                                    msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-300" /> :
                                        msg.status === 'delivered' ? <CheckCheck className="w-3 h-3" /> :
                                            <Check className="w-3 h-3" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-[#1E1E1E] border-t border-[#27272a]">
                {/* Mode Toggles */}
                <div className="flex gap-2 mb-2 justify-center">
                    <button
                        onClick={() => setMode('ai')}
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${mode === 'ai' ? 'bg-[#007BFF] text-white' : 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]'}`}
                    >
                        <Bot className="w-3 h-3" /> Auto (IA)
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${mode === 'manual' ? 'bg-[#28A745] text-white' : 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]'}`}
                    >
                        <User className="w-3 h-3" /> Manual
                    </button>
                    <button
                        onClick={() => setMode('mixed')}
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${mode === 'mixed' ? 'bg-[#EAB308] text-white' : 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]'}`}
                    >
                        <Zap className="w-3 h-3" /> Misto
                    </button>
                </div>

                <div className="flex items-end gap-2 bg-[#2A2A2A] rounded-xl p-1.5">
                    <Button variant="ghost" size="icon" className="hover:bg-[#333] text-gray-400 h-9 w-9"><Smile className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="hover:bg-[#333] text-gray-400 h-9 w-9"><Paperclip className="w-5 h-5" /></Button>

                    <Input
                        className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-gray-500 h-9"
                        placeholder={mode === 'ai' ? "Digite instrução para IA..." : "Digite uma mensagem..."}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />

                    {input ? (
                        <Button size="icon" className="bg-[#007BFF] hover:bg-[#0069d9] h-9 w-9" onClick={handleSend}>
                            <Send className="w-4 h-4" />
                        </Button>
                    ) : (
                        <Button variant="ghost" size="icon" className="hover:bg-[#333] text-gray-400 h-9 w-9">
                            <Mic className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
