'use client';

import { useState } from 'react';
import { LifeBuoy, FileQuestion, MessageSquare, Download, CreditCard, Shield, ChevronLeft, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
        body: JSON.stringify({ name, email, message: `[CENTRUM POMOCY]\n\n${message}` }),
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

  const categories = [
    { title: "Pierwsze Kroki i Logowanie", icon: <Download className="w-8 h-8 text-emerald-400" />, desc: "Jak założyć darmowe konto, rozpocząć 7-dniowy okres próbny i dodać skrót do ekranu głównego.", href: "#faq-section" },
    { title: "Twoja Licencja", icon: <Shield className="w-8 h-8 text-purple-400" />, desc: "Zarządzanie licencją Lifetime, limit urządzeń i udostępnianie dostępu rodzinie.", href: "#faq-section" },
    { title: "Płatności i Faktury", icon: <CreditCard className="w-8 h-8 text-pink-400" />, desc: "Metody płatności, bezpieczeństwo transakcji oraz pobieranie faktur VAT.", href: "#faq-section" },
    { title: "Rozwiązywanie Problemów", icon: <LifeBuoy className="w-8 h-8 text-blue-400" />, desc: "Odtwarzanie dźwięku w tle, resetowanie hasła i obsługa odtwarzacza bajek.", href: "#faq-section" }
  ];

  const faqs = [
    { q: "Jak zainstalować aplikację na telefonie?", a: "Ponieważ 'Na Dobranoc' to nowoczesna aplikacja przeglądarkowa (PWA), nie musisz nic pobierać ze sklepu. Otwórz naszą stronę w przeglądarce (np. Safari na iOS lub Chrome na Androidzie), otwórz opcje przeglądarki i wybierz 'Dodaj do ekranu głównego'. Na Twoim telefonie pojawi się ikona aplikacji!" },
    { q: "W jaki sposób działa darmowy okres próbny?", a: "Każdy nowy użytkownik po zarejestrowaniu konta otrzymuje automatycznie 7 dni pełnego, darmowego dostępu Premium. Po tym czasie poprosimy Cię o dokonanie jednorazowego zakupu licencji dożywotniej (Lifetime). Nie wymagamy podpinania karty przy rejestracji." },
    { q: "Czy pobieracie opłaty co miesiąc (abonament)?", a: "Nie! Aplikacja 'Na Dobranoc' odeszła od modelu subskrypcyjnego. Oferujemy wyłącznie licencję dożywotnią, co oznacza jednorazową, uczciwą płatność. Brak automatycznych odnowień i ukrytych kosztów." },
    { q: "Dlaczego po wygaszeniu ekranu telefonu przestaję słyszeć bajkę?", a: "Nasza platforma natywnie wspiera odtwarzanie dźwięku przy zablokowanym ekranie. Jeśli jednak dźwięk przerywa, upewnij się, że Twój system Android nie ma włączonego agresywnego trybu oszczędzania baterii, który 'usypia' karty przeglądarki. Użytkownicy iOS (Apple) zazwyczaj nie muszą nic konfigurować." },
    { q: "Zapomniałem hasła. Jak mogę je zresetować?", a: "Na stronie logowania kliknij w link 'Nie pamiętasz hasła?'. Podaj swój adres e-mail, a wyślemy Ci bezpieczny link (Magic Link) do natychmiastowego logowania i zmiany hasła." },
    { q: "Z ilu urządzeń mogę korzystać w ramach jednej licencji?", a: "Z jednego konta (licencji Premium) możesz korzystać maksymalnie na 3 różnych urządzeniach jednocześnie. Idealnie sprawdza się to na telefonie mamy, taty oraz tablecie w pokoju dziecka." },
    { q: "Czy potrzebuję dostępu do internetu, aby słuchać bajek?", a: "Tak. Ponieważ aplikacja jest oparta o przeglądarkę, do pobrania utworu i rozpoczęcia odtwarzania potrzebujesz połączenia z siecią (Wi-Fi lub LTE). Jeśli chcesz uśpić dziecko w trybie samolotowym, włącz odtwarzanie danej bajki przed wyłączeniem sieci – plik załaduje się do pamięci na czas trwania utworu." },
    { q: "Nie słyszę żadnego dźwięku po kliknięciu 'Play', co robić?", a: "Upewnij się, że Twój telefon nie jest wyciszony suwakiem z boku obudowy (w trybie cichym iOS blokuje media z przeglądarek). Zwiększ głośność multimediów i sprawdź, czy w przeglądarce nie masz zablokowanego autoodtwarzania (autoplay)." },
    { q: "Jak udostępnić aplikację drugiemu rodzicowi?", a: "Nie musisz kupować drugiego konta. Po prostu podaj partnerowi swój login (e-mail) i hasło. Może on/ona zalogować się u siebie na telefonie – mieści się to w naszym limicie 3 urządzeń na licencję." },
    { q: "Gdzie znajdę fakturę VAT za zakup?", a: "Faktura VAT lub rachunek od operatora płatności (1koszyk) przychodzi bezpośrednio na podany przy zakupie adres e-mail chwilę po zaksięgowaniu płatności. Sprawdź folder SPAM, jeśli nie widzisz wiadomości w skrzynce głównej." },
    { q: "Dlaczego w aplikacji nie ma obrazu (wideo), a jest sam dźwięk?", a: "To celowy zabieg. Światło niebieskie emitowane przez ekrany i szybko zmieniające się animacje blokują wydzielanie melatoniny (hormonu snu) u dziecka. Naszym zadaniem jest wyciszenie malucha, dlatego stawiamy na potęgę samej wyobraźni wspieranej czystym, kojącym dźwiękiem." },
    { q: "Dla jakiego wieku przeznaczone są bajki?", a: "Nasze treści i częstotliwości w tle są optymalizowane przede wszystkim dla dzieci w wieku od 2 do 8 lat. Słownictwo jest dopasowane, a tempo czytania zwalnia z każdą minutą." },
    { q: "Czy mogę zmienić adres e-mail przypisany do konta?", a: "Tak, jeśli potrzebujesz zaktualizować swój adres e-mail, skontaktuj się z nami poprzez poniższy formularz kontaktowy. Pomożemy zaktualizować Twoje dane ręcznie w systemie." },
    { q: "Mój 7-dniowy okres próbny się skończył. Co teraz?", a: "Dostęp do biblioteki bajek został zablokowany. Aby odzyskać pełny dostęp do wszystkich utworów oraz przyszłych nowości, zaloguj się na swoje konto i opłać jednorazowo licencję Lifetime." }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white selection:bg-purple-500/30">
      <nav className="relative z-50 px-6 lg:px-12 py-8 max-w-[1200px] mx-auto border-b border-white/5">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" /> Wróć na stronę główną
        </Link>
      </nav>

      <header className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-serif">W czym możemy pomóc?</h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Witaj w Centrum Pomocy aplikacji &quot;Na Dobranoc&quot;. Znajdziesz tu odpowiedzi na najczęstsze pytania, instrukcje obsługi i wsparcie techniczne.
          </p>
          <div className="mt-10 max-w-xl mx-auto relative">
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Wpisz swój problem (np. logowanie, płatność, brak dźwięku...)"
              className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:outline-none focus:border-purple-500 transition-colors pl-14 shadow-lg shadow-black/50"
            />
            <FileQuestion className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
            {searchQuery && (
              <div className="absolute -bottom-8 left-0 w-full text-center text-sm text-purple-400 font-medium">
                Znaleziono wyników: {filteredFaqs.length}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {!searchQuery && (
          <section className="mb-24">
            <h2 className="text-2xl font-bold mb-8 text-center">Baza wiedzy</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat, idx) => (
                <a href={cat.href} key={idx} onClick={() => setSearchQuery(cat.title.split(' ')[0])} className="bg-[#111118] border border-white/5 hover:border-purple-500/30 rounded-3xl p-6 transition-colors group cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">{cat.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{cat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{cat.desc}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        <section id="faq-section" className="mb-24 max-w-3xl mx-auto scroll-mt-24">
          <h2 className="text-3xl font-bold mb-10 text-center">
            {searchQuery ? 'Wyniki wyszukiwania' : 'Najczęściej zadawane pytania (FAQ)'}
          </h2>
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => (
                <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-6 transition-all hover:bg-white/10">
                  <h3 className="text-lg font-bold mb-3 text-purple-300">{faq.q}</h3>
                  <p className="text-slate-300 leading-relaxed">{faq.a}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-xl text-slate-400 mb-2">Brak wyników dla &quot;{searchQuery}&quot;</p>
                <p className="text-sm text-slate-500">Spróbuj użyć innych słów kluczowych lub skontaktuj się z nami poniżej.</p>
                <button onClick={() => setSearchQuery('')} className="mt-6 text-purple-400 hover:text-purple-300 font-medium">Wyczyść wyszukiwanie</button>
              </div>
            )}
          </div>
        </section>

        {/* Formularz kontaktowy */}
        <section className="max-w-2xl mx-auto bg-gradient-to-br from-purple-900/30 to-[#111118] border border-purple-500/20 rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] pointer-events-none" />
          <div className="relative z-10 text-center mb-8">
            <MessageSquare className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3">Nie znalazłeś odpowiedzi?</h2>
            <p className="text-slate-400">Opisz swój problem, a nasz zespół odpowie najszybciej jak to możliwe.</p>
          </div>

          {isSent ? (
            <div className="text-center py-8 relative z-10">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-xl font-bold text-white mb-2">Wiadomość wysłana! 🚀</p>
              <p className="text-slate-400">Dziękujemy za kontakt. Odpiszemy najszybciej jak to możliwe.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Twoje Imię</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0a0a0e] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder-slate-600"
                    placeholder="Jak masz na imię?" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Adres E-mail</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0a0a0e] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder-slate-600"
                    placeholder="twoj@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Opisz swój problem</label>
                <textarea rows={4} required value={message} onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#0a0a0e] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors resize-none placeholder-slate-600"
                  placeholder="Opisz dokładnie, z czym masz problem..." />
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold rounded-full hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(147,51,234,0.3)] disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? 'Wysyłanie...' : 'Wyślij Zgłoszenie'} {!isLoading && <Send className="w-5 h-5" />}
              </button>
              {isError && (
                <p className="text-red-400 text-sm text-center">Wystąpił błąd. Napisz bezpośrednio na kreatywna.droga@gmail.com</p>
              )}
            </form>
          )}
        </section>
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
