import React, { useState, useRef, useEffect } from 'react';
import { Bot, MessageCircle, Send, X, Headset, ShoppingBag, ShoppingCart } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  // structured product cards returned by the AI
  products?: {
    id: string;
    name: string;
    nameEn: string;
    price: number;
    salePrice: number | null;
    weight: string;
    weightEn: string;
    image: string;
    stock: number;
    category: string;
  }[];
}

// Mini product card rendered inside the chat
const ChatProductCard: React.FC<{
  p: ChatMessage['products'][0];
  language: string;
  t: any;
  onAdd: () => void;
  added: boolean;
}> = ({ p, language, t, onAdd, added }) => {
  const ar = language === 'ar';
  const name = ar ? p.name : p.nameEn;
  const weight = ar ? p.weight : (p.weightEn || p.weight);
  const price = p.salePrice ?? p.price;

  return (
    <div className="bg-white border border-[#E9DFD3] rounded-xl overflow-hidden shadow-sm flex flex-col w-36 shrink-0 snap-start">
      <div className="aspect-square w-full bg-[#FAF7F2] overflow-hidden">
        <img
          src={p.image || '/images/hero-dates.jpg'}
          alt={name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="p-2 flex flex-col gap-1 flex-1">
        <p className="text-[11px] font-bold text-[#2C1D11] line-clamp-2 leading-tight">{name}</p>
        <p className="text-[10px] text-[#8C7662]">{weight}</p>
        <div className="flex items-center gap-1 flex-wrap mt-auto">
          {p.salePrice != null ? (
            <>
              <span className="text-xs font-black text-[#A66C2E]">{p.salePrice} {t.sar}</span>
              <span className="text-[9px] text-[#A89381] line-through">{p.price}</span>
            </>
          ) : (
            <span className="text-xs font-black text-[#2C1D11]">{price} {t.sar}</span>
          )}
        </div>
        <button
          onClick={onAdd}
          disabled={p.stock <= 0 || added}
          className={`w-full mt-1 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
            added
              ? 'bg-green-100 text-green-700 border border-green-300'
              : p.stock <= 0
              ? 'bg-[#E5DCD2] text-[#8C7662] cursor-not-allowed'
              : 'bg-[#3B2213] text-white hover:bg-[#52311C] active:scale-95'
          }`}
        >
          {added ? (
            <><ShoppingCart className="w-3 h-3" /><span>{ar ? 'أضيف ✓' : 'Added ✓'}</span></>
          ) : p.stock <= 0 ? (
            <span>{t.outOfStock}</span>
          ) : (
            <><ShoppingBag className="w-3 h-3" /><span>{t.addToCart}</span></>
          )}
        </button>
      </div>
    </div>
  );
};

export const ChatWidget: React.FC = () => {
  const { cms, language, dir, t, addToCart, products: storeProducts } = useStore();
  const ar = language === 'ar';
  const L = (arabic: string, english: string) => (ar ? arabic : english);

  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Track which product ids the user has added via chat
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const hasWhatsapp = !!cms.contact.whatsapp;
  const whatsappPhone = cms.contact.whatsapp.replace(/\D/g, '');
  const whatsappText = encodeURIComponent(
    ar
      ? 'السلام عليكم، أود الاستفسار عن منتجات تمور الحرمين وعروض الضيافة'
      : 'Hello, I would like to inquire about Tmoor Alharmain products and hospitality orders',
  );
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${whatsappText}`;

  const handleAddToCart = (chatProduct: ChatMessage['products'][0]) => {
    // Find the full product object from the store so addToCart gets all fields
    const full = storeProducts.find((p) => p.id === chatProduct.id);
    if (full) {
      addToCart(full, 1);
      setAddedIds((prev) => new Set([...prev, chatProduct.id]));
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');

    // Send plain text history only (products are frontend-only display data)
    const apiHistory = messages.map(({ role, content }) => ({ role, content }));
    const newApiHistory = [...apiHistory, { role: 'user' as const, content: userMessage }];

    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newApiHistory }),
      });
      const data = await res.json();

      // On HTTP error, throw so the catch block shows a real error message
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      // Always show the reply. Attach product cards if returned.
      const replyText = data.reply || L('تفضل 👇', 'Here you go 👇');
      const cards =
        data.intent === 'show_products' && Array.isArray(data.products) && data.products.length > 0
          ? data.products
          : undefined;
      setMessages((prev) => [...prev, { role: 'assistant', content: replyText, products: cards }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: L(
            'عذراً، حدث خطأ في الاتصال. حاول مجدداً أو تواصل معنا عبر واتساب.',
            'Sorry, connection error. Please try again or contact us via WhatsApp.',
          ),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={dir} className={`fixed bottom-6 ${dir === 'rtl' ? 'left-6' : 'right-6'} z-40 select-none`}>
      {/* Option menu: AI Assistant / WhatsApp */}
      {menuOpen && !chatOpen && (
        <div
          className={`absolute bottom-full ${dir === 'rtl' ? 'left-0' : 'right-0'} mb-3 w-56 bg-white border border-[#E8DDD0] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
          <button
            onClick={() => {
              setChatOpen(true);
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAF7F2] transition-colors cursor-pointer text-start"
          >
            <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </span>
            <span className="text-sm font-bold text-[#3B2213]">{L('المساعد الذكي', 'AI Assistant')}</span>
          </button>
          {hasWhatsapp && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAF7F2] transition-colors cursor-pointer text-start border-t border-[#F0E6D8]"
            >
              <span className="w-9 h-9 rounded-full bg-[#25D366]/15 text-[#1EBE5D] flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 fill-current" />
              </span>
              <span className="text-sm font-bold text-[#3B2213]">{L('واتساب', 'WhatsApp')}</span>
            </a>
          )}
        </div>
      )}

      {/* AI chat panel */}
      {chatOpen && (
        <div
          className={`absolute bottom-full ${dir === 'rtl' ? 'left-0' : 'right-0'} mb-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden`}
          style={{ height: '500px' }}
        >
          {/* Header */}
          <div className="bg-[#3B2213] text-white p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <h3 className="font-bold text-sm">{L('مساعد تمور الحرمين', 'Haramain Assistant')}</h3>
                <p className="text-[10px] text-amber-300 opacity-80">{L('اسألني عن أي منتج أو اطلب ما تريد', 'Ask me anything or place an order')}</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="hover:bg-white/10 p-1 rounded-lg cursor-pointer transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#FAF7F2]">
            {messages.length === 0 && (
              <div className="text-center mt-6 space-y-3">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                  <Bot className="w-7 h-7 text-amber-700" />
                </div>
                <p className="text-sm text-stone-500 font-medium">
                  {L('مرحباً! أنا مساعدك في تمور الحرمين 🌴', 'Hello! I\'m your Haramain assistant 🌴')}
                </p>
                <p className="text-xs text-stone-400">
                  {L('اسألني عن التمور أو الحلويات أو أضف مباشرة للسلة', 'Ask about dates, sweets, or add items to your cart')}
                </p>
                {/* Quick suggestion chips */}
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {(ar
                    ? ['أنواع التمور', 'عروض اليوم', 'هدايا']
                    : ['Types of dates', 'Today\'s offers', 'Gifts']
                  ).map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setInput(chip)}
                      className="text-xs bg-white border border-[#D5C2AF] text-[#3B2213] px-3 py-1.5 rounded-full hover:bg-[#3B2213] hover:text-white transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Text bubble */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-sm leading-6 ${
                    msg.role === 'user'
                      ? 'bg-[#3B2213] text-white rounded-br-none'
                      : 'bg-white border border-[#E9DFD3] rounded-bl-none text-stone-800 shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Product cards carousel */}
                {msg.products && msg.products.length > 0 && (
                  <div className={`mt-2 w-full max-w-full`}>
                    <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#D5C2AF] scrollbar-track-transparent">
                      {msg.products.map((p) => (
                        <ChatProductCard
                          key={p.id}
                          p={p}
                          language={language}
                          t={t}
                          onAdd={() => handleAddToCart(p)}
                          added={addedIds.has(p.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-3 bg-white border border-[#E9DFD3] rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t bg-white flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={L('اكتب رسالتك...', 'Type your message...')}
              className="flex-1 bg-[#FAF7F2] border border-[#E9DFD3] rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#C59B58] focus:border-transparent"
              dir={ar ? 'rtl' : 'ltr'}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#3B2213] text-white p-2.5 rounded-full hover:bg-[#52311C] disabled:opacity-40 cursor-pointer transition-colors active:scale-95"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Single floating trigger button */}
      <button
        onClick={() => {
          if (chatOpen) {
            setChatOpen(false);
          } else {
            setMenuOpen((v) => !v);
          }
        }}
        className="w-14 h-14 rounded-full bg-[#3B2213] hover:bg-[#52311C] text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        title={L('تواصل معنا', 'Contact us')}
        aria-label={L('تواصل معنا', 'Contact us')}
      >
        {menuOpen || chatOpen ? <X className="w-6 h-6" /> : <Headset className="w-6 h-6" />}
      </button>
    </div>
  );
};
