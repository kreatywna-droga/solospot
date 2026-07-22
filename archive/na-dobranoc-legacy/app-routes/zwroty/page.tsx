import Link from 'next/link';
import { Moon, ChevronLeft } from 'lucide-react';

export default function RefundsPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0a0e] text-slate-200 selection:bg-purple-500/30 font-light">
      <nav className="relative z-50 px-6 lg:px-12 py-8 max-w-[1200px] mx-auto border-b border-white/5">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" /> Wróć na stronę główną
        </Link>
      </nav>

      <main className="max-w-[800px] mx-auto py-16 px-6 lg:px-12 relative z-10">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-600/10 blur-[150px] rounded-full pointer-events-none" />
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Polityka Zwrotów i Reklamacji</h1>
        <p className="text-slate-400 mb-12">Ostatnia aktualizacja: Czerwiec 2026</p>

        <div className="space-y-8 text-lg leading-relaxed text-slate-300">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Prawo do Odstąpienia od Umowy</h2>
            <p>
              Zgodnie z przepisami prawa konsumenckiego, Użytkownikowi będącemu Konsumentem co do zasady przysługuje prawo odstąpienia od umowy zawartej na odległość w terminie 14 dni bez podania przyczyny. 
              <strong>UWAGA:</strong> Ze względu na to, że &quot;Na Dobranoc&quot; jest usługą dostarczania treści cyfrowych, które nie są zapisane na nośniku materialnym, akceptując realizację zamówienia i odblokowując dostęp Premium, Konsument wyraża zgodę na natychmiastowe rozpoczęcie świadczenia usługi i tym samym przyjmuje do wiadomości, że traci prawo do odstąpienia od umowy, jeśli usługa została w pełni wykonana.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Zwroty z tytułu Niezadowolenia (Gwarancja Satysfakcji)</h2>
            <p>
              Pomimo utraty ustawowego prawa do odstąpienia (z racji natychmiastowego dostępu do treści), oferujemy dobrowolną Gwarancję Satysfakcji. Jeśli Aplikacja w żaden sposób nie spełnia Twoich oczekiwań, możesz złożyć wniosek o zwrot środków w ciągu <strong>7 dni od daty zakupu licencji dożywotniej</strong>. Rozpatrujemy takie zgłoszenia indywidualnie, chcąc zachować 100% zadowolenie naszych klientów.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Reklamacje Techniczne</h2>
            <p>
              W przypadku gdy Aplikacja nie działa poprawnie (np. brak dostępu pomimo opłacenia zakupu, błędy uniemożliwiające odtwarzanie), Użytkownik ma prawo zgłosić reklamację techniczną.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Zgłoszenia prosimy kierować na adres e-mail: <strong>kreatywna.droga@gmail.com</strong>.</li>
              <li>Reklamacja zostanie rozpatrzona w terminie do 14 dni roboczych.</li>
              <li>W przypadku uznania reklamacji, zwrócimy Ci koszty zakupu w odpowiedniej części lub w całości.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Procedura Zwrotu Pieniędzy</h2>
            <p>
              Jeśli zwrot środków zostanie przyznany (w ramach uznanej reklamacji lub gwarancji satysfakcji), pieniądze zostaną zwrócone dokładnie tą samą metodą płatności, jakiej użyto do zakupu (przez system 1koszyk). Zwrot trwa zazwyczaj od 3 do 10 dni roboczych, w zależności od banku.
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
