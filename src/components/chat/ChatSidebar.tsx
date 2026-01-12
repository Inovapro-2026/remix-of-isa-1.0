import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface Contact {
    id: string; // JID
    name: string;
    phone: string;
    avatar?: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
    status?: string; // online, offline
}

interface ChatSidebarProps {
    contacts: Contact[];
    selectedId: string | null;
    onSelect: (contact: Contact) => void;
    isLoading: boolean;
}

export const ChatSidebar = ({ contacts, selectedId, onSelect, isLoading }: ChatSidebarProps) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredContacts = useMemo(() => {
        if (!searchTerm) return contacts;

        // Fuzzy-like search: Check if name includes term (case insensitive)
        // Could optimize to check phone number too
        const lowerTerm = searchTerm.toLowerCase();
        return contacts.filter(c =>
            c.name.toLowerCase().includes(lowerTerm) ||
            c.phone.includes(lowerTerm)
        );
    }, [contacts, searchTerm]);

    return (
        <div className="flex flex-col h-full bg-[#1E1E1E] border-r border-[#27272a]">
            {/* Header */}
            <div className="p-4 border-b border-[#27272a]">
                <h2 className="text-xl font-bold text-white mb-4">Conversas</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar..."
                        className="pl-9 bg-[#2A2A2A] border-none text-white focus-visible:ring-1 focus-visible:ring-[#007BFF] placeholder:text-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        {searchTerm ? "Nenhum resultado." : "Nenhuma conversa iniciada."}
                    </div>
                ) : (
                    <div className="divide-y divide-[#27272a]/50">
                        {filteredContacts.map(contact => (
                            <div
                                key={contact.id}
                                className={`p-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-[#2A2A2A] ${selectedId === contact.id ? 'bg-[#2A2A2A] border-l-4 border-[#007BFF]' : 'border-l-4 border-transparent'
                                    }`}
                                onClick={() => onSelect(contact)}
                            >
                                <div className="relative">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={contact.avatar} />
                                        <AvatarFallback className="bg-[#333] text-gray-300">
                                            {contact.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    {contact.status === 'online' && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#28A745] border-2 border-[#1E1E1E] rounded-full" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-white truncate max-w-[120px]">{contact.name}</span>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">{contact.lastMessageTime}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-400 truncate">{contact.lastMessage}</p>
                                        {contact.unreadCount ? (
                                            <Badge className="bg-[#007BFF] hover:bg-[#0069d9] text-white rounded-full h-5 px-1.5 min-w-[20px] flex items-center justify-center text-[10px]">
                                                {contact.unreadCount}
                                            </Badge>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
