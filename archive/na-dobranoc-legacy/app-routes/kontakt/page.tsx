'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Send, ChevronLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Pomoc techniczna (Błąd w aplikacji)');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setIsLoading(true);
    setIsError(false);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message: `[TEMAT: ${topic}]\n\n${message}`
        }),
      });
      const result = await response.json();
      if (result.success) {
        setIsSent(true);
        setName('');
        setEmail('');
        setMessage('');
        setTimeout(() => setIsSent(false), 6000);
      } else {
        setIsError(true);
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white selection:bg-purple-500/30">
      <nav className="relative z-50 px-6 lg:px-12 py-8 max-w-[1200px] mx-auto border-b border-white/5">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" /> Wróć na stronę główną
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

        <div className="grid md:grid-cols-2 gap-16 items-start">

          {/* Informacje kontaktowe */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 font-serif">Skontaktuj się z nami</h1>
            <p className="text-lg text-slate-400 mb-12">
              Masz pytania dotyczące aplikacji, problem z płatnością, a może chcesz podzielić się z nami swoją sugestią dotyczącą nowej bajki? Napisz do nas!
            </p>

            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Adres e-mail</h3>
                  <p className="text-slate-400 mb-2">Główny kanał komunikacji. Odpowiadamy zazwyczaj w ciągu 24 godzin.</p>
                  <a href="mailto:kreatywna.droga@gmail.com" className="text-lg font-bold text-white hover:text-purple-400 transition-colors">kreatywna.droga@gmail.com</a>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Social Media</h3>
                  <p className="text-slate-400 mb-2">Obserwuj nas, by być na bieżąco z nowościami i aktualizacjami.</p>
                  <div className="flex flex-wrap gap-4">
                    <a href="https://www.facebook.com/profile.php?id=61590365431185" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-400 font-medium transition-colors">Facebook</a>
                    <a href="https://www.instagram.com/kreatywna.droga/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-400 font-medium transition-colors">Instagram</a>
                    <a href="https://www.tiktok.com/@kreatywna.droga" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-400 font-medium transition-colors">TikTok</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formularz */}
          <div className="bg-[#111118] border border-white/5 rounded-3xl p-8 relative">
            <h2 className="text-2xl font-bold mb-8">Wyślij wiadomość</h2>

            {isSent ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-xl font-bold text-white mb-2">Wiadomość wysłana! 🚀</p>
                <p className="text-slate-400">Dziękujemy za kontakt. Odpiszemy w ciągu 24 godzin.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Twoje imię</label>
                    <input
                      type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Jan Kowalski"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Adres e-mail</label>
                    <input
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="jan@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Temat wiadomości</label>
                  <select
                    value={topic} onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                  >
                    <option className="bg-[#111118]">Pomoc techniczna (Błąd w aplikacji)</option>
                    <option className="bg-[#111118]">Płatności i Licencje</option>
                    <option className="bg-[#111118]">Propozycja współpracy</option>
                    <option className="bg-[#111118]">Inne</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Wiadomość</label>
                  <textarea
                    rows={5} required value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Opisz swój problem lub pytanie..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold rounded-full hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(147,51,234,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Wysyłanie...' : 'Wyślij Wiadomość'} {!isLoading && <Send className="w-5 h-5" />}
                </button>

                {isError && (
                  <p className="text-red-400 text-sm text-center">
                    Wystąpił błąd. Napisz bezpośrednio na kreatywna.droga@gmail.com
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-[#0a0a0e]/80 py-8 text-center mt-20">
        <div className="flex flex-col items-center justify-center gap-2 opacity-50">
          <span className="text-lg font-serif font-black tracking-tighter text-white">na.dobranoc</span>
          <p className="text-sm text-slate-500">© 2026 Wszelkie prawa zastrzeżone.</p>
        </div>
      </footer>
    </div>
  );
}
