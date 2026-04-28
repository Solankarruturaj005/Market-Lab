import { Bot, Send, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { chatWithBot, type ChatMessage } from '../services/aiService';

interface ChatbotProps {
  onClose?: () => void;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex-shrink-0 rounded-full p-2 text-sm ${isUser
          ? 'bg-cyan-400/10 text-cyan-300'
          : 'bg-purple-400/10 text-purple-300'
          }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${isUser
          ? 'bg-cyan-400/10 text-cyan-100 rounded-tr-sm'
          : 'bg-white/5 text-slate-200 rounded-tl-sm'
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
        "Hi! I'm MarketBot 🤖 Ask me about stock market concepts, technical indicators (RSI, MACD, SMA), or how to interpret signals. Note: I can't give personalized investment advice.",
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
      // Only send the last 10 messages to avoid token limit
      const history = updatedMessages.slice(-10);
      const result = await chatWithBot(history);
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I encountered an error. Make sure you are logged in and the backend is running.',
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
    <div className="flex flex-col rounded-[28px] border border-white/10 bg-slate-950/80 shadow-2xl shadow-slate-950/40 backdrop-blur-xl overflow-hidden"
      style={{ height: '480px', width: '100%' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-purple-400/10 p-2 text-purple-300">
            <Bot size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">MarketBot</div>
            <div className="text-xs text-slate-500">AI stock market assistant</div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {isTyping && (
          <div className="flex gap-2 items-center">
            <div className="flex-shrink-0 rounded-full bg-purple-400/10 p-2 text-purple-300">
              <Bot size={14} />
            </div>
            <div className="flex gap-1 rounded-2xl bg-white/5 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about RSI, MACD, market trends…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            disabled={isTyping}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!input.trim() || isTyping}
            className="rounded-xl bg-purple-400/10 p-2 text-purple-300 transition hover:bg-purple-400/20 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
