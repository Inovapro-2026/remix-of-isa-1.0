import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, HelpCircle, Star, AlertTriangle } from "lucide-react";
import { Contact } from "./ChatSidebar";

// ISA Support fixed contact - always visible
export const ISA_SUPPORT_CONTACT: Contact = {
  id: 'isa-support-fixed',
  name: 'ISA Suporte',
  phone: '+55 11 99999-9999',
  avatar: undefined,
  lastMessage: 'Como posso ajudar?',
  lastMessageTime: '',
  unreadCount: 0,
  status: 'online'
};

interface EnhancedChatSidebarProps {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (contact: Contact) => void;
  isLoading: boolean;
  favoriteIds?: string[];
  priorityIds?: string[];
}

// Simple fuzzy search - handles typos and variations
const fuzzyMatch = (text: string, query: string): boolean => {
  const textLower = text.toLowerCase().replace(/\s+/g, '');
  const queryLower = query.toLowerCase().replace(/\s+/g, '');
  
  // Direct inclusion check
  if (textLower.includes(queryLower)) return true;
  
  // Character-by-character fuzzy match
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === queryLower.length;
};

export const EnhancedChatSidebar = ({ 
  contacts, 
  selectedId, 
  onSelect, 
  isLoading,
  favoriteIds = [],
  priorityIds = []
}: EnhancedChatSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredContacts = useMemo(() => {
    let result = contacts;
    
    if (searchTerm) {
      result = contacts.filter(c =>
        fuzzyMatch(c.name, searchTerm) ||
        fuzzyMatch(c.phone.replace(/\D/g, ''), searchTerm.replace(/\D/g, ''))
      );
    }

    // Sort: Priority > Favorites > Unread > Recent
    result = [...result].sort((a, b) => {
      const aPriority = priorityIds.includes(a.id) ? 1 : 0;
      const bPriority = priorityIds.includes(b.id) ? 1 : 0;
      if (aPriority !== bPriority) return bPriority - aPriority;

      const aFav = favoriteIds.includes(a.id) ? 1 : 0;
      const bFav = favoriteIds.includes(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;

      const aUnread = a.unreadCount || 0;
      const bUnread = b.unreadCount || 0;
      return bUnread - aUnread;
    });

    return result;
  }, [contacts, searchTerm, favoriteIds, priorityIds]);

  const renderContact = (contact: Contact, isFixed = false) => {
    const isSelected = selectedId === contact.id;
    const isFavorite = favoriteIds.includes(contact.id);
    const isPriority = priorityIds.includes(contact.id);

    return (
      <div
        key={contact.id}
        className={`p-3 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:bg-[#2A2A2A] group
          ${isSelected ? 'bg-[#2A2A2A] border-l-4 border-[#007BFF]' : 'border-l-4 border-transparent'}
          ${isPriority ? 'bg-red-950/30' : ''}
          ${isFixed ? 'bg-gradient-to-r from-[#007BFF]/10 to-transparent border-b border-[#27272a]' : ''}
        `}
        onClick={() => onSelect(contact)}
      >
        <div className="relative">
          <Avatar className={`w-12 h-12 ${isFixed ? 'ring-2 ring-[#007BFF]/50' : ''}`}>
            {isFixed ? (
              <AvatarFallback className="bg-gradient-to-br from-[#007BFF] to-[#0056B3] text-white">
                <HelpCircle className="w-6 h-6" />
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage src={contact.avatar} />
                <AvatarFallback className="bg-[#333] text-gray-300">
                  {contact.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          {contact.status === 'online' && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#28A745] border-2 border-[#1E1E1E] rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-1.5">
              <span className={`font-semibold truncate max-w-[120px] ${isFixed ? 'text-[#007BFF]' : 'text-white'}`}>
                {contact.name}
              </span>
              {isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
              {isPriority && <AlertTriangle className="w-3 h-3 text-red-500" />}
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{contact.lastMessageTime}</span>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400 truncate">
              {isFixed ? '💬 Dúvidas sobre o ISA 1.0' : contact.lastMessage}
            </p>
            {contact.unreadCount ? (
              <Badge className="bg-[#007BFF] hover:bg-[#0069d9] text-white rounded-full h-5 px-1.5 min-w-[20px] flex items-center justify-center text-[10px]">
                {contact.unreadCount}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] border-r border-[#27272a]">
      {/* Header */}
      <div className="p-4 border-b border-[#27272a]">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          💬 Conversas
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou número..."
            className="pl-9 bg-[#2A2A2A] border-none text-white focus-visible:ring-1 focus-visible:ring-[#007BFF] placeholder:text-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Fixed ISA Support Contact */}
      {renderContact(ISA_SUPPORT_CONTACT, true)}

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {searchTerm ? (
              <div>
                <p className="mb-2">Nenhum resultado para "{searchTerm}"</p>
                <p className="text-xs">Tente buscar por nome ou número</p>
              </div>
            ) : (
              <div>
                <p className="mb-2">Nenhuma conversa iniciada</p>
                <p className="text-xs">Aguardando conexão WhatsApp</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#27272a]/30">
            {filteredContacts.map(contact => renderContact(contact))}
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="p-3 border-t border-[#27272a] bg-[#1a1a1a]">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{filteredContacts.length} conversas</span>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#28A745]" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};
