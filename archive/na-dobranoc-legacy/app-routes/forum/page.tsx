'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Heart, UserCircle, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ForumPage() {
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<{ id: number, author_name: string, created_at: string, content: string }[]>([]);

  // Wczytywanie danych z bazy Supabase
  useEffect(() => {
    const fetchForumData = async () => {
      try {
        // Pobierz lajki
        const { data: statsData } = await supabase.from('forum_stats').select('likes_count').eq('id', 1).single();
        if (statsData) {
          setLikes(statsData.likes_count || 0);
        }

        // Pobierz odpowiedzi
        const { data: repliesData } = await supabase.from('forum_replies').select('*').order('created_at', { ascending: true });
        if (repliesData) {
          setReplies(repliesData);
        }
        
        // Pamięć o tym czy JA już lajkowałem, nadal trzymamy tylko u mnie w przeglądarce, 
        // żeby nie pozwolić mi kliknąć 100 razy
        const savedHasLiked = localStorage.getItem('forum_has_liked');
        if (savedHasLiked === 'true') {
          setHasLiked(true);
        }
      } catch (e) {
        console.error("Błąd wczytywania forum", e);
      }
    };
    
    fetchForumData();
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLike = async () => {
    if (hasLiked) return; // Można dać serduszko tylko raz z jednego urządzenia

    const newLikes = likes + 1;
    setLikes(newLikes);
    setHasLiked(true);
    localStorage.setItem('forum_has_liked', 'true');
    
    // Zapis do Supabase
    await supabase.from('forum_stats').update({ likes_count: newLikes }).eq('id', 1);
  };

  const handleReplyClick = () => {
    if (isLoggedIn) {
      setIsReplying(true);
      // Smooth scroll to reply box
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } else {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;

    // Pobierz dane usera
    let authorName = 'Użytkownik';
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      authorName = user.user_metadata?.name || user.email?.split('@')[0] || 'Użytkownik';
    }

    const newReply = {
      author_name: authorName,
      content: replyText
    };

    // Optymistyczny update UI
    const tempReply = {
      id: Date.now(),
      author_name: authorName,
      content: replyText,
      created_at: new Date().toISOString()
    };
    setReplies([...replies, tempReply]);
    
    // Zapis do Supabase
    const { error } = await supabase.from('forum_replies').insert([newReply]);
    
    if (error) {
      console.error(error);
      alert("Błąd komunikacji z bazą danych: " + error.message);
      return;
    }
    
    setReplyText('');
    setIsReplying(false);
    
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white relative">
      {/* Toast Notification */}
      <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-[#1a1a24] border border-red-500/30 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
          <UserCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm font-medium">Musisz być zalogowany, aby dodać odpowiedź na forum.</span>
        </div>
      </div>

      {/* Success Toast */}
      <div className={`fixed top-36 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${showSuccessToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-[#1a1a24] border border-green-500/30 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-sm font-medium">Odpowiedź została pomyślnie dodana!</span>
        </div>
      </div>

      {/* Background FX */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0e]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-20 flex items-center gap-4">
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </Link>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold tracking-wide">Forum dla Rodziców</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-32 pb-24 max-w-4xl mx-auto px-4 md:px-8 relative z-10">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Temat: Jak odzyskałam swoje wieczory. Moja trudna droga do przespanej nocy.</h2>
          <div className="flex items-center gap-6 text-sm text-slate-400 border-b border-white/10 pb-6">
            <div className="flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              <span className="font-semibold text-slate-200">MamaKacperka_90</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Napisano: Wczoraj, 21:45</span>
            </div>
          </div>
        </div>

        <article className="prose prose-invert prose-lg max-w-none text-slate-300">
          <p>
            Cześć wszystkim. Długo zastanawiałam się, czy o tym napisać, ale pomyślałam, że może moja historia pomoże jakiejś mamie, która czuje się dzisiaj dokładnie tak bezsilna, jak ja czułam się jeszcze kilka miesięcy temu.
          </p>
          <p>
            Mój syn, Kacper, skończył niedawno trzy lata. Zawsze był "żywym srebrem", ale to, co działo się wieczorami, przechodziło ludzkie pojęcie. Kładzenie go spać przypominało codzienną bitwę. Zaczynaliśmy rytuał o 19:30 – kąpiel, kolacja, czytanie książeczek. O 20:00 lądowaliśmy w łóżku. I wtedy zaczynał się koszmar. Płacz, wymyślanie pretekstów ("chce mi się pić", "muszę siku", "boję się cienia"), ciągłe wybieganie z pokoju. Czasem usypianie trwało do 22:30.
          </p>
          <p>
            Byłam cieniem samej siebie. Kiedy w końcu zasypiał, nie miałam siły na nic. Mój mąż wracał z pracy, a ja z płaczem mijałam go w drzwiach sypialni, padając na kanapę z wyczerpania. Moje wieczory po prostu nie istniały.
          </p>
          <h3>Błąd, który popełnialiśmy wszyscy</h3>
          <p>
            Zaczęłam szukać rozwiązań. Lekarz wzruszał ramionami ("wyrośnie z tego"), teściowa mówiła, że za bardzo go rozpieszczam. Próbowałam włączać mu bajki w telewizorze, żeby się zmęczył. Z tabletem było tylko gorzej – niby patrzył w ekran jak zahipnotyzowany, ale potem jego mózg był tak przebodźcowany światłem niebieskim, że skakał po łóżku do północy.
          </p>
          <p>
            Pewnego wieczoru, gdy siedziałam na podłodze przy jego łóżku i płakałam z bezsilności, postanowiłam drastycznie zmienić podejście. Wyrzuciłam z sypialni wszystkie świecące zabawki. Zrozumiałam, że problemem nie było to, że Kacper "nie chciał" spać, tylko to, że jego układ nerwowy był zbyt pobudzony, by móc się wyciszyć.
          </p>
          <h3>Odkrycie magii "ciemnego audio"</h3>
          <p>
            Zaczęłam eksperymentować. Kupiłam czarne rolety zaciemniające. Wprowadziliśmy zasadę zera ekranów na dwie godziny przed snem – żadnych wyjątków. Zamiast tego zaczęłam puszczać mu z małego głośniczka ciche słuchowiska w całkowitych ciemnościach, łącząc to ze stłumionym białym szumem z wentylatora.
          </p>
          <p>
            Pierwsze trzy dni były trudne – domagał się światła, telefonu, "obrazków". Ale czwartego dnia stał się cud. Leżał spokojnie i wsłuchiwał się w opowieść lektora o zasypiającym lesie, podczas gdy w tle cicho szumiał wiatr. Zamiast szukać bodźców wizualnych, jego umysł zaczął sam budować obrazy. Po 15 minutach usłyszałam ten charakterystyczny, głęboki i spokojny oddech. Zasnął.
          </p>
          <p>
            Od tamtej pory zasada jest jedna: w sypialni ma być ciemno, a zamiast migoczących ekranów używamy tylko kojącego dźwięku i narracji. Zrozumiałam, że dziecięcy mózg potrzebuje wyciszenia bodźców wzrokowych. Słowo mówione i uspokajające dźwięki tła działają jak magiczne zaklęcie, które pozwala im bezpiecznie odpłynąć.
          </p>
          <p>
            Jeśli jesteście na skraju wyczerpania – odłóżcie telefony, wyłączcie lampki, stwórzcie dzieciom przestrzeń bez rażącego światła i postawcie na spokojny, kojący dźwięk. To uratowało moje macierzyństwo i pozwoliło mi odzyskać moje wieczory z mężem.
          </p>
          <p>
            Trzymam za was kciuki, drogie mamy!
          </p>
        </article>

        {/* Forum Actions */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center gap-4">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-semibold ${hasLiked ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-transparent'}`}
          >
            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : 'text-pink-500'}`} />
            <span>Podziękuj ({likes})</span>
          </button>
          {!isReplying && (
            <button 
              onClick={handleReplyClick}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors text-indigo-300 font-semibold"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Odpowiedz</span>
            </button>
          )}
        </div>

        {/* Reply Box */}
        {isReplying && (
          <div className="mt-8 bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-indigo-400" /> Napisz swoją odpowiedź
            </h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Podziel się swoimi doświadczeniami..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 min-h-[120px] resize-y mb-4"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsReplying(false)}
                className="px-6 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors font-medium"
              >
                Anuluj
              </button>
              <button 
                onClick={submitReply}
                disabled={!replyText.trim()}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors"
              >
                Wyślij
              </button>
            </div>
          </div>
        )}

        {/* Comments Section */}
        {replies.length > 0 && (
          <div className="mt-16 space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">
              Odpowiedzi społeczności ({replies.length})
            </h3>
            <div className="space-y-6">
              {replies.map((reply) => (
                <div key={reply.id} className="bg-[#111118] border border-white/5 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {reply.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-200">{reply.author_name}</p>
                      <p className="text-xs text-slate-500">{new Date(reply.created_at).toLocaleString('pl-PL')}</p>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
