import Link from 'next/link';
import { Moon, ChevronLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0a0a0e] text-slate-200 selection:bg-purple-500/30 font-light">
      <nav className="relative z-50 px-6 lg:px-12 py-8 max-w-[1200px] mx-auto border-b border-white/5">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" /> Wróć na stronę główną
        </Link>
      </nav>

      <main className="max-w-[800px] mx-auto py-16 px-6 lg:px-12 relative z-10">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-600/10 blur-[150px] rounded-full pointer-events-none" />
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Regulamin Świadczenia Usług (Terms of Service)</h1>
        <p className="text-slate-400 mb-12">Ostatnia aktualizacja: Czerwiec 2026</p>

        <div className="space-y-8 text-lg leading-relaxed text-slate-300">
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Wstęp</h2>
            <p>
              Niniejszy dokument określa warunki, na jakich Usługodawca świadczy usługi drogą elektroniczną w ramach platformy i aplikacji &quot;Na Dobranoc&quot;. Rejestrując Konto lub dokonując Zakupu, Użytkownik potwierdza, że zapoznał się z Regulaminem, w pełni go rozumie i akceptuje jego postanowienia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Definicje</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Usługodawca</strong> – właściciel i twórca aplikacji &quot;Na Dobranoc&quot;, odpowiedzialny za jej funkcjonowanie.</li>
              <li><strong>Użytkownik</strong> – pełnoletnia osoba fizyczna, która akceptuje Regulamin i korzysta z Aplikacji.</li>
              <li><strong>Konto</strong> – indywidualny panel Użytkownika, chroniony hasłem, umożliwiający zarządzanie Licencją i Urządzeniami.</li>
              <li><strong>Licencja</strong> – odpłatne, dożywotnie prawo do korzystania z Aplikacji, z uwzględnieniem zapisów EULA.</li>
              <li><strong>Urządzenie</strong> – smartfon lub tablet, na którym Użytkownik zainstalował Aplikację.</li>
              <li><strong>Gospodarstwo domowe</strong> – zbiór osób mieszkających i gospodarujących wspólnie, do użytku których przypisana jest Licencja.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Warunki Założenia Konta</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Konto może założyć wyłącznie osoba pełnoletnia posiadająca pełną zdolność do czynności prawnych.</li>
              <li>Użytkownik zobowiązany jest do podania prawidłowego adresu e-mail oraz dbania o bezpieczeństwo swojego hasła. Usługodawca nie ponosi odpowiedzialności za szkody wynikłe z udostępnienia hasła osobom trzecim.</li>
              <li>Każdy Użytkownik może posiadać tylko jedno Konto przypisane do danego adresu e-mail.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Licencja, Urządzenia i Prawa Autorskie</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Wszelkie treści, nagrania, grafiki i kod Aplikacji pozostają własnością Usługodawcy i są chronione prawem autorskim.</li>
              <li>Wykupienie dostępu uprawnia Użytkownika do korzystania z Aplikacji na maksymalnie 3 (trzech) Urządzeniach jednocześnie w ramach jednego Gospodarstwa domowego.</li>
              <li>Użytkownik może samodzielnie zarządzać listą przypisanych Urządzeń z poziomu Konta (dodawać i usuwać Urządzenia). Ze względów bezpieczeństwa częstotliwość zmian Urządzeń może podlegać limitom technicznym opisanym w panelu.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Zasady Korzystania z Usługi</h2>
            <p className="mb-4">Użytkownikowi surowo zabrania się:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dekompresji, dekompilacji, inżynierii wstecznej oraz modyfikacji kodu Aplikacji.</li>
              <li>Udostępniania danych logowania do Konta osobom spoza własnego Gospodarstwa domowego.</li>
              <li>Wykorzystywania skryptów, botów lub jakichkolwiek narzędzi automatyzujących interakcje z serwerami Usługodawcy.</li>
              <li>Korzystania z nagrań udostępnianych w Aplikacji w celach komercyjnych (np. w przedszkolach, kanałach YouTube) bez pisemnej zgody Usługodawcy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Płatności i Zakupy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Płatności są przetwarzane natychmiastowo przez zewnętrznego certyfikowanego dostawcę (1koszyk). Licencja zostaje aktywowana bezzwłocznie po odnotowaniu wpłaty.</li>
              <li>Dostęp do Aplikacji w wariancie Premium wymaga jednorazowej zapłaty za Licencję. W Aplikacji nie obowiązują żadne subskrypcje, abonamenty ani ukryte płatności odnawialne.</li>
              <li>Po dokonaniu jednorazowego zakupu, Użytkownik otrzymuje nielimitowany czasowo dostęp do zakupionych funkcji.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Zawieszenie i Usunięcie Konta</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>W przypadku rażącego naruszenia niniejszego Regulaminu (np. nadużycia limitu urządzeń, piractwa), Usługodawca ma prawo tymczasowo zawiesić lub trwale zablokować Konto po uprzedniej analizie naruszenia.</li>
              <li>Zablokowanie Konta z winy Użytkownika nie uprawnia go do zwrotu uiszczonych opłat za niewykorzystany okres.</li>
              <li>Użytkownik ma prawo złożyć odwołanie od blokady za pośrednictwem poczty e-mail, które Usługodawca rozpatrzy w ciągu 14 dni.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Dostępność i Odpowiedzialność</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Aplikacja została zaprojektowana do działania w trybie offline. Funkcje chmurowe (np. zarządzanie kontem, pobieranie nowych nagrań) wymagają dostępu do sieci.</li>
              <li>Usługodawca dokłada wszelkich starań, by serwery działały bezprzerwanie. Mogą jednak wystąpić planowane przerwy techniczne, o których będziemy informować z wyprzedzeniem. Nie gwarantujemy 100% czasu działania (uptime).</li>
              <li>Usługodawca nie ponosi odpowiedzialności za szkody wynikające z przerw w dostępie do Internetu, awarii urządzenia Użytkownika lub zdarzeń siły wyższej, z zastrzeżeniem bezwzględnie obowiązujących przepisów prawa konsumenckiego.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Zastrzeżenie Medyczne</h2>
            <p>
              Aplikacja &quot;Na Dobranoc&quot; ma charakter wyłącznie wspierający, relaksacyjny i edukacyjny. W żadnym wypadku nie służy do diagnozowania, zapobiegania ani leczenia bezsenności, chorób i zaburzeń u dzieci. W przypadku wątpliwości dotyczących zdrowia dziecka należy niezwłocznie skonsultować się z lekarzem pediatrą.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Pozostałe dokumenty powiązane</h2>
            <p>Szczegóły dotyczące prywatności, zwrotów czy oprogramowania regulują osobne dokumenty:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-purple-400">
              <li><Link href="/na-dobranoc/prywatnosc" className="hover:text-pink-400">Polityka Prywatności i Plików Cookies</Link></li>
              <li><Link href="/na-dobranoc/zwroty" className="hover:text-pink-400">Polityka Zwrotów i Reklamacji</Link></li>
              <li><Link href="/na-dobranoc/eula" className="hover:text-pink-400">Umowa EULA</Link></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Postanowienia Końcowe i Zmiany Regulaminu</h2>
            <p>
              Zastrzegamy sobie prawo do modyfikacji Regulaminu w przypadku zmian prawnych lub technologicznych. O zmianach poinformujemy z co najmniej 14-dniowym wyprzedzeniem. Dalsze korzystanie z Usługi po wejściu zmian w życie oznacza ich akceptację, z zastrzeżeniem praw konsumentów wynikających z obowiązujących przepisów.
              Właściwym sądem do rozstrzygania sporów jest sąd powszechny, zgodnie z prawem polskim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Kontakt</h2>
            <p>
              Adres e-mail: kreatywna.droga@gmail.com
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
