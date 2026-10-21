import { Bot, Send, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { chatWithBot, type ChatMessage } from '../services/aiService';

interface ChatbotProps {
  onClose?: () => void;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border text-xs ${
          isUser
            ? 'border-[#334155] bg-[#1E293B] text-white'
            : 'border-[#334155] bg-[#0F172A] text-[#94A3B8]'
        }`}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>
      <div
        className={`max-w-[82%] rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${
          isUser
            ? 'border-[#334155] bg-[#1E293B] text-white'
            : 'border-[#334155] bg-[#0F172A] text-[#94A3B8]'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export function ChatbotPanel({ onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Welcome to MarketBot. Ask questions regarding technical indicators (RSI, MACD, SMA), market metrics, or signal calculations. Note: Output is for analytical education only and does not constitute investment advice.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const result = await chatWithBot([{ role: 'user', content: text }]);
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Unable to process assistant query. Please confirm your session status or backend availability.',
        },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div
      className="flex flex-col rounded-xl border border-[#334155] bg-[#0F172A] shadow-2xl overflow-hidden"
      style={{ height: '480px', width: '100%' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#334155] bg-[#1E293B]/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#334155] bg-[#0F172A] text-white">
            <Bot size={15} />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">MarketBot Intelligence</div>
            <div className="text-[10px] text-[#94A3B8]">Analytical Q&amp;A Assistant</div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#94A3B8] hover:bg-[#334155] hover:text-white transition"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Generating response...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#334155] p-3 bg-[#0F172A]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about indicators, formulas, or concepts..."
            className="flex-1 rounded-lg border border-[#334155] bg-[#1E293B] px-3 py-2 text-xs text-white placeholder-[#94A3B8] focus:border-[#F8FAFC] focus:outline-none transition-colors"
            disabled={isTyping}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8FAFC] text-[#0F172A] hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
