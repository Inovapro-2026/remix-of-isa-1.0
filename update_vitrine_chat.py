#!/usr/bin/env python3
# Replace chat messages and input sections in Vitrine.tsx

file_path = '/root/INOVAPRO/isa-1.0-de9193c7/src/pages/Vitrine.tsx'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# New messages section (lines 913-978)
new_messages = '''              {chatMessages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: colors.buttons }}
                    >
                      <Store className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user' 
                        ? 'rounded-br-sm' 
                        : 'rounded-tl-sm'
                    }`}
                    style={{
                      backgroundColor: message.role === 'user' ? colors.buttons : colors.card,
                      border: message.role === 'assistant' ? `1px solid ${colors.border}` : 'none',
                      color: message.role === 'user' ? '#FFFFFF' : colors.text
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-60 mt-1 block">
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {message.role === 'user' && (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: colors.border }}
                    >
                      <User className="h-4 w-4" style={{ color: colors.muted }} />
                    </div>
                  )}
                </div>
              ))}

              {isSendingMessage && (
                <div className="flex gap-3 justify-start">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: colors.buttons }}
                  >
                    <Store className="h-4 w-4 text-white animate-pulse" />
                  </div>
                  <div 
                    className="rounded-2xl rounded-tl-sm px-4 py-3"
                    style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
                  >
                    <div className="flex gap-1 items-center">
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colors.muted }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colors.muted, animationDelay: '0.1s' }} />
                      <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: colors.muted, animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
'''

# New input section (lines 980-1002)
new_input = '''            {/* Chat Input */}
            <div 
              className="p-5 border-t shrink-0"
              style={{ borderColor: colors.border, backgroundColor: colors.card }}
            >
              <div className="flex gap-3">
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendChatMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  disabled={isSendingMessage}
                />
                <Button
                  onClick={handleSendChatMessage}
                  disabled={isSendingMessage || !chatInput.trim()}
                  className="px-4 text-white"
                  style={{ backgroundColor: colors.buttons }}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs" style={{ color: colors.muted }}>
                  Powered by ISA AI
                </p>
                <button
                  onClick={openWhatsApp}
                  className="text-xs hover:underline flex items-center gap-1"
                  style={{ color: colors.accent }}
                >
                  <MessageCircle className="h-3 w-3" />
                  Ir para WhatsApp
                </button>
              </div>
            </div>
'''

# Replace lines 913-977 (messages section)
lines[912:977] = [new_messages]

# Replace lines 980-1002 (input section) - adjust index after first replacement
lines[913:936] = [new_input]

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Chat modal fully updated with interactive AI chat!")
