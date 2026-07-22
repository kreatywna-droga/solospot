import Link from 'next/link';
import { Moon, ChevronLeft } from 'lucide-react';

export default function EulaPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0a0e] text-slate-200 selection:bg-purple-500/30 font-light">
      <nav className="relative z-50 px-6 lg:px-12 py-8 max-w-[1200px] mx-auto border-b border-white/5">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" /> Wróć na stronę główną
        </Link>
      </nav>

      <main className="max-w-[800px] mx-auto py-16 px-6 lg:px-12 relative z-10">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-600/10 blur-[150px] rounded-full pointer-events-none" />
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Umowa Licencyjna Użytkownika Końcowego (EULA)</h1>
        <p className="text-slate-400 mb-12">Ostatnia aktualizacja: Czerwiec 2026</p>

        <div className="space-y-8 text-lg leading-relaxed text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Przedmiot Umowy</h2>
            <p>
              Niniejsza umowa ("EULA") stanowi prawne porozumienie pomiędzy Tobą ("Licencjobiorcą") a twórcami aplikacji Na Dobranoc ("Licencjodawcą"). Pobierając, instalując lub używając oprogramowania, wyrażasz zgodę na związanie się warunkami niniejszej EULA.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Udzielenie Licencji</h2>
            <p>
              Licencjodawca udziela Licencjobiorcy odwoływalnej, niewyłącznej, niezbywalnej i ograniczonej licencji na pobranie, instalację i używanie Aplikacji wyłącznie w celach osobistych, niekomercyjnych, ściśle zgodnie z warunkami niniejszej Umowy oraz Regulaminu Świadczenia Usług.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Ograniczenia Licencyjne</h2>
            <p className="mb-4">Licencjobiorca zgadza się, że nie będzie, ani nie zezwoli osobom trzecim na:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Licencjonowanie, sprzedawanie, wynajmowanie, dzierżawienie, przypisywanie, dystrybuowanie, hostowanie ani na inne komercyjne wykorzystywanie Aplikacji.</li>
              <li>Modyfikowanie, tworzenie prac pochodnych, deasemblację, dekompilację ani na stosowanie inżynierii wstecznej w jakiejkolwiek części Aplikacji.</li>
              <li>Usuwanie, zmienianie lub zaciemnianie jakichkolwiek informacji o prawach autorskich lub prawach własności intelektualnej w Aplikacji.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Aktualizacje Oprogramowania</h2>
            <p>
              Licencjodawca może od czasu do czasu zapewniać ulepszenia lub poprawki funkcji Aplikacji, w tym łatki (patches), poprawki błędów (bug fixes), aktualizacje i inne modyfikacje. Zastrzegamy sobie prawo do wymagania od Użytkownika instalacji aktualizacji w celu dalszego korzystania z Aplikacji.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Własność Intelektualna</h2>
            <p>
              Aplikacja (wraz z całym jej kodem źródłowym, strukturami baz danych, nagraniami audio i graficznymi interfejsami) pozostaje wyłączną własnością Licencjodawcy. Niniejsza EULA nie przenosi na Licencjobiorcę żadnych praw własnościowych, a jedynie ograniczone prawo użytkowania.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Czas Trwania i Zakończenie</h2>
            <p>
              Niniejsza umowa wchodzi w życie z chwilą pierwszego uruchomienia Aplikacji i obowiązuje do czasu jej rozwiązania przez Ciebie lub Licencjodawcę (w przypadku złamania jej warunków lub rezygnacji z usługi). Po zakończeniu umowy zobowiązujesz się usunąć wszystkie kopie Aplikacji ze swoich urządzeń.
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
