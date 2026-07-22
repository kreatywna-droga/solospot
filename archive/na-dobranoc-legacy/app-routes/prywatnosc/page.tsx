import Link from 'next/link';
import { Moon, ChevronLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0a0e] text-slate-200 selection:bg-purple-500/30 font-light">
      {/* Nawigacja powrotna */}
      <nav className="relative z-50 px-6 lg:px-12 py-8 max-w-[1200px] mx-auto border-b border-white/5">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" /> Wróć na stronę główną
        </Link>
      </nav>

      <main className="max-w-[800px] mx-auto py-16 px-6 lg:px-12 relative z-10">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Polityka Prywatności (RODO/GDPR)</h1>
        <p className="text-slate-400 mb-12">Ostatnia aktualizacja: Czerwiec 2026</p>

        <div className="space-y-8 text-lg leading-relaxed text-slate-300">
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Administrator Danych</h2>
            <p>
              Zgodnie z przepisami ogólnego rozporządzenia o ochronie danych (RODO), Administratorem Twoich danych osobowych przekazywanych w ramach korzystania z aplikacji &quot;Na Dobranoc&quot; jest twórca aplikacji.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li><strong>Adres e-mail we wszystkich sprawach związanych z RODO:</strong> kreatywna.droga@gmail.com</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Jakie dane przetwarzamy, w jakim celu i na jakiej podstawie?</h2>
            <p className="mb-4">Zbieramy tylko te dane, które są absolutnie niezbędne do świadczenia naszych usług. Poniżej przedstawiamy szczegółowe zestawienie:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse mt-4">
                <thead>
                  <tr className="border-b border-white/10 text-white">
                    <th className="py-3 pr-4">Kategoria Danych</th>
                    <th className="py-3 px-4">Cel Przetwarzania</th>
                    <th className="py-3 pl-4">Podstawa Prawna (RODO)</th>
                  </tr>
                </thead>
                <tbody className="text-base text-slate-400">
                  <tr className="border-b border-white/5">
                    <td className="py-4 pr-4"><strong>Adres e-mail</strong> i hasło</td>
                    <td className="py-4 px-4">Utworzenie i zarządzanie Kontem, logowanie do aplikacji, autoryzacja</td>
                    <td className="py-4 pl-4">Wykonanie umowy (art. 6 ust. 1 lit. b)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-4 pr-4"><strong>Dane Płatności</strong> (częściowe)</td>
                    <td className="py-4 px-4">Obsługa płatności jednorazowych za dostęp dożywotni (przetwarzane w pełni przez 1koszyk)</td>
                    <td className="py-4 pl-4">Wykonanie umowy (art. 6 ust. 1 lit. b)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-4 pr-4"><strong>Dane Urządzeń</strong> (ID, model)</td>
                    <td className="py-4 px-4">Egzekwowanie limitu licencji (np. max 3 urządzenia na konto) oraz rozwiązywanie problemów technicznych</td>
                    <td className="py-4 pl-4">Uzasadniony interes / Wykonanie umowy (art. 6 ust. 1 lit. f / b)</td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-4"><strong>Logi Systemowe</strong> (IP)</td>
                    <td className="py-4 px-4">Ochrona serwerów przed atakami, zapobieganie oszustwom i nadużyciom</td>
                    <td className="py-4 pl-4">Uzasadniony interes (art. 6 ust. 1 lit. f)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Odbiorcy Danych (Komu udostępniamy dane?)</h2>
            <p>Twoje dane nigdy nie są sprzedawane. Udostępniamy je wyłącznie zaufanym podmiotom trzecim (tzw. Procesorom), z którymi mamy podpisane Umowy Powierzenia Przetwarzania Danych (DPA). Są to:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li><strong>Operator płatności (1koszyk)</strong> – w celu bezpiecznego przetwarzania Twoich kart płatniczych i rozliczeń.</li>
              <li><strong>Dostawca usług chmurowych (np. AWS / Google Cloud)</strong> – w celu bezpiecznego hostowania bazy danych kont i aplikacji.</li>
              <li><strong>Dostawca usług e-mail</strong> – w celu wysyłki powiadomień systemowych (np. reset hasła, potwierdzenie płatności).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Okres Przechowywania Danych (Retencja)</h2>
            <p>Dane są przechowywane tylko tak długo, jak to niezbędne:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li><strong>Dane Konta (e-mail, urządzenia):</strong> Przechowujemy przez okres posiadania aktywnego Konta w aplikacji. Po zażądaniu usunięcia konta dane są trwale anonimizowane lub usuwane w ciągu 30 dni.</li>
              <li><strong>Dane Rozliczeniowe:</strong> Przechowywane przez okres narzucony przez prawo podatkowe (zazwyczaj 5 lat od końca roku obrachunkowego).</li>
              <li><strong>Kopie Zapasowe (Backupy):</strong> Są bezpiecznie nadpisywane/usuwane po maksymalnie 90 dniach.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Bezpieczeństwo Danych</h2>
            <p>Stosujemy najwyższe standardy techniczne w celu ochrony Twoich informacji, w tym:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Pełne szyfrowanie transmisji danych od Użytkownika do serwerów za pomocą nowoczesnego protokołu <strong>HTTPS/TLS</strong>.</li>
              <li>Silne kryptograficzne hashowanie haseł w bazie danych (nigdy nie przechowujemy ich jawnym tekstem).</li>
              <li>Ścisła kontrola dostępu na serwerach oraz ciągłe monitorowanie infrastruktury w poszukiwaniu podatności.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Ochrona Dzieci (COPPA/RODO-K)</h2>
            <p>
              Choć aplikacja &quot;Na Dobranoc&quot; jest przeznaczona do użytku (odtwarzania dźwięków) w środowisku dziecka, <strong>Konto może założyć i opłacać wyłącznie osoba pełnoletnia (Rodzic / Opiekun Prawny)</strong>. Aplikacja nie zbiera bezpośrednio żadnych danych osobowych dzieci.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Działanie w Trybie Samolotowym</h2>
            <p>
              Zalecamy używanie aplikacji w trybie samolotowym dla zminimalizowania promieniowania w pokoju dziecka. Podczas działania w trybie offline aplikacja <strong>nie łączy się</strong> z siecią internetową, nie przesyła strumienia dźwięku na żywo z mikrofonu ani nie wysyła na bieżąco danych analitycznych. Informacje o ewentualnych błędach odtwarzacza (Crash Logs), niezbędne do poprawy stabilności aplikacji, są kolejkowane lokalnie i przesyłane automatycznie dopiero po ponownym połączeniu z Internetem.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Pliki Cookies</h2>
            <p>
              Szczegółowe informacje na temat wykorzystywania ciasteczek przez naszą stronę internetową i aplikację webową (np. panel płatności) znajdują się w odrębnej <Link href="/na-dobranoc/cookies" className="text-purple-400 hover:text-pink-400 transition-colors">Polityce Cookies</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Twoje Prawa (Zgodnie z RODO)</h2>
            <p className="mb-4">Jako Użytkownik, któremu zależy na prywatności, masz szerokie prawa dotyczące swoich danych:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Prawo dostępu:</strong> Możesz zażądać informacji o tym, jakie dane przetwarzamy.</li>
              <li><strong>Prawo do sprostowania:</strong> Możesz poprawić błędne dane w swoim profilu.</li>
              <li><strong>Prawo do usunięcia (&quot;bycia zapomnianym&quot;):</strong> Możesz zażądać trwałego skasowania Konta i danych, o ile nie stoją temu na przeszkodzie przepisy prawne (np. prawo podatkowe).</li>
              <li><strong>Prawo do ograniczenia przetwarzania oraz przenoszenia danych.</strong></li>
              <li><strong>Prawo do sprzeciwu:</strong> Wobec przetwarzania danych opartego na naszym uzasadnionym interesie.</li>
              <li><strong>Prawo wniesienia skargi:</strong> Jeżeli uznasz, że przetwarzamy dane niezgodnie z prawem, masz prawo wnieść skargę do właściwego organu nadzorczego (w Polsce - Prezes UODO).</li>
            </ul>
            <p className="mt-4 text-purple-400 font-medium">
              Aby zrealizować swoje prawa, napisz do nas z adresu e-mail przypisanego do Konta na: <a href="mailto:kreatywna.droga@gmail.com" className="underline hover:text-pink-400">kreatywna.droga@gmail.com</a>. Czas realizacji żądania wynosi do 30 dni.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Zmiany Polityki Prywatności</h2>
            <p>
              Polityka Prywatności może ulegać aktualizacjom ze względu na zmiany technologiczne lub prawne. O każdej zmianie poinformujemy Użytkowników z zachowaniem 14-dniowego wyprzedzenia za pomocą komunikatu w aplikacji lub wiadomości e-mail. Nowa polityka obowiązuje od wskazanej daty wejścia w życie.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-white/5 bg-[#0a0a0e]/80 backdrop-blur-lg py-8 text-center mt-20">
        <div className="flex items-center justify-center gap-2 opacity-50">
          <Moon className="w-5 h-5 text-purple-500" />
          <span className="text-lg font-serif font-black tracking-tighter text-white">na.dobranoc</span>
        </div>
      </footer>
    </div>
  );
}
