const fs = require('fs');
const path = require('path');

const blogPosts = [
  {
    slug: "dlaczego-zrezygnowalismy-z-ekranow",
    title: "Dlaczego zrezygnowaliśmy ze świecących ekranów? Nasza misja i historia",
    desc: "Jak narodziła się aplikacja 'Na Dobranoc' i dlaczego podjęliśmy decyzję, która wielu uważało za szaleństwo – usunęliśmy cały obraz.",
    date: "1 Lipca 2026",
    category: "Nasza Misja",
    image: "bg-purple-900/40",
    content: `Wszystko zaczęło się od jednej, bardzo zwykłej i bardzo trudnej nocy.

Dziecko nie mogło zasnąć po raz kolejny. Tablet świecił w ciemności. Bajka na YouTube leciała już trzecią godzinę. Wzrok dziecka był szklany, ale mózg – naelektryzowany. Każda historia kończyła się autoplay następną, jeszcze głośniejszą, jeszcze bardziej kolorową. O pierwszej w nocy w pokoju dziecka nie było spokoju. Było tylko zmęczenie rodziców i pobudzone, rozdrażnione dziecko, które i tak nie spało.

Wtedy zrodził się pomysł. Nie musi tak być.

**Dlaczego bajki wideo są złym pomysłem przed snem?**

Odpowiedź nie leży w treści – leży w fizyce światła. Ekran smartfona czy tabletu emituje promieniowanie w zakresie 400–490 nanometrów, czyli dokładnie w spektrum, na które reagują komórki zwojowe siatkówki dziecięcego oka. Przekazują one sygnał bezpośrednio do szyszynki i mówią jej jedno: "Jeszcze dzień. Nie produkuj melatoniny."

Melatonina to hormon snu. Bez niej zaśnięcie jest po prostu trudne. A u dzieci, których układ nerwowy jest jeszcze w trakcie formowania, skutki są dwa razy silniejsze niż u dorosłych.

Do tego dochodzi tempo filmów animowanych. Typowa bajka na YouTube ma średnio 2–3 cięcia montażowe na sekundę. Każde takie cięcie to mini-bodziec alarmowy dla układu nerwowego. Mózg musi błyskawicznie przetworzyć nową scenę, nową perspektywę, nowe dźwięki. Zamiast zwalniać – przyspiesza. Zamiast odpoczywać – pracuje na najwyższych obrotach.

**Nasza odpowiedź: Zero ekranu. Sto procent wyobraźni.**

Kiedy projektowaliśmy aplikację "Na Dobranoc", zadaliśmy sobie jedno fundamentalne pytanie: co tak naprawdę pomaga dziecku zasnąć? Odpowiedź była zaskakująco prosta – spokój, bezpieczeństwo i przewidywalność.

Stworzyliśmy aplikację, która działa przy zablokowanym ekranie. Włączasz bajkę, odkładasz telefon ekranem do dołu i po prostu... słuchasz. Razem z dzieckiem. Delikatny głos lektora, szum deszczu w tle, powolne tempo narracji – wszystko to zostało zaprojektowane z jednym celem: obniżyć poziom kortyzolu (hormonu stresu) i przygotować organizm do naturalnego zasypiania.

**Efekty, które widzą rodzice**

Pierwsi użytkownicy naszej aplikacji raportowali skrócenie czasu zasypiania o 60–80%. Dzieci, które wcześniej potrzebowały 45–60 minut, by zasnąć po bajce wideo, przy bajkach audio zasypiają średnio w 15–20 minut.

Ale co ważniejsze – budzą się spokojniejsze. Sen stymulowany przez ciemność i kojący dźwięk jest głębszy. Fazy REM są dłuższe. A to oznacza lepszą konsolidację wspomnień, lepszy nastrój następnego dnia i lepsze wyniki w przedszkolu i szkole.

**Pójść pod prąd było najlepszą decyzją**

Wielu mówiło nam, że tworząc aplikację audio dla dzieci w erze YouTube'a Kids, jesteśmy szaleńcami. Że rodzice tego nie kupią. Że bez animacji nikt nie będzie zainteresowany.

Mylili się. Okazało się, że rodzice są zmęczeni. Chcą wieczorów bez walki o tablet. Chcą dzieci, które zasypiają bez histerii. Chcą spokoju – dla dziecka i dla siebie.

Właśnie dlatego "Na Dobranoc" istnieje. I właśnie dlatego każdego dnia dołączają do nas nowe rodziny, które mają dość i chcą zmiany.

Jeśli i Ty jesteś w tym miejscu – wiesz, co robić.`
  },
  {
    slug: "wplyw-swiatla-niebieskiego-na-sen",
    title: "Wpływ światła niebieskiego na sen Twojego dziecka – pełny przewodnik rodzica",
    desc: "Zrozum mechanizm działania melatoniny, dowiedz się jak rozpoznać objawy przebodźcowania i poznaj praktyczne sposoby na zdrowy rytuał snu każdego wieczoru.",
    date: "28 Czerwca 2026",
    category: "Wiedza",
    image: "bg-blue-900/40",
    content: `Twoje dziecko jest zmęczone, ale nie może zasnąć. Oczy ma przekrwione, jest pobudzone, płaczliwe i rozdrażnione – mimo że nie spało popołudniu i widać, że pada z nóg. To klasyczny, niestety bardzo powszechny scenariusz. I w 9 przypadkach na 10 winowajcą jest niewinnie wyglądający ekran.

**Czym właściwie jest światło niebieskie i dlaczego jest problemem?**

Światło niebieskie (ang. blue light) to część widma elektromagnetycznego o długości fali 400–490 nm. Jest naturalnym składnikiem światła słonecznego i w ciągu dnia jest dla nas korzystne – pobudza czujność, poprawia refleks i koncentrację.

Problem zaczyna się wieczorem. Nasze mózgi przez miliony lat ewolucji nauczyły się jednego: gdy widzą niebieskie światło, myślą, że to południe. Produkcja melatoniny – hormonu regulującego rytm dobowy – zostaje zahamowana. I tu zaczyna się błędne koło.

Smartfon, tablet, laptop, telewizor LED – wszystkie te urządzenia emitują intensywne niebieskie światło. Godzina bajek wieczorem to dla mózgu dziecka sygnał: "Jeszcze nie czas na sen. Jest środek dnia."

**Dzieci są szczególnie narażone – oto dlaczego**

Badania opublikowane w "Sleep Medicine Reviews" wykazały, że dzieci w wieku 3–10 lat są od 2 do 5 razy bardziej wrażliwe na światło niebieskie niż dorośli. Powód jest prosty: soczewka oka dziecka jest bardziej przejrzysta i nie filtruje promieniowania tak skutecznie jak soczewka oka osoby dorosłej.

Oznacza to, że zaledwie 20 minut przed bajką na tablecie może opóźnić zasypianie o 60–90 minut. A jakość snu – nawet gdy dziecko w końcu zaśnie – jest znacznie gorsza. Fazy głębokiego snu są krótsze, płytsze, a dziecko budzi się nie w pełni zregenerowane.

**Rozpoznaj objawy przebodźcowania u swojego dziecka**

Oto sygnały alarmowe, których nie warto ignorować:

Dziecko jest bardzo pobudzone wieczorem, mimo że w ciągu dnia było spokojne. Mimo zmęczenia opiera się zasypianiu i wymaga coraz dłuższej rutyny usypiania. Po przebudzeniu jest marudne i drażliwe, chociaż przespało wymaganą liczbę godzin. Ma problemy z koncentracją następnego dnia i jest bardziej impulsywne niż zwykle.

Jeśli obserwujesz choć dwa z tych symptomów regularnie – czas na zmianę wieczornego rytuału.

**Praktyczny plan: 7 kroków do zdrowego snu**

Krok 1: Wyłącz wszystkie ekrany minimum 60 minut przed planowaną godziną snu. To nie jest negocjowalne – to kwestia biologii.

Krok 2: Ściemnij światła w całym domu. Ciepłe, żółte światło lamp nie pobudza szyszynki i pozwala ciału naturalnie przejść w tryb wyciszenia.

Krok 3: Kolacja powinna być lekka i skończona co najmniej 1,5 godziny przed snem. Pełny żołądek podnosi temperaturę ciała i utrudnia zasypianie.

Krok 4: Ciepła kąpiel lub prysznic tuż przed snem powoduje po wyjściu z wody szybki spadek temperatury ciała, który jest fizjologicznym sygnałem "czas spać".

Krok 5: Wprowadź stały rytuał – zawsze w tej samej kolejności. Kąpiel, mycie zębów, piżama, bajka. Mózg dziecka bardzo szybko uczy się skojarzeń i zacznie zasypiać już na etapie kąpieli.

Krok 6: W tym rytuale zastąp bajkę wideo bajką audio z aplikacji "Na Dobranoc". Ciemny ekran, kojący głos, szumy natury.

Krok 7: Zostań z dzieckiem przez pierwsze 5–10 minut. Twoja obecność buduje poczucie bezpieczeństwa, które jest kluczowe dla zasypiania bez lęku.

**Nasze rozwiązanie: ciemność i dźwięk**

Aplikacja "Na Dobranoc" została stworzona dokładnie z myślą o tym problemie. Działamy przy zablokowanym ekranie – zero niebieskiego światła, zero animacji, zero bodźców wzrokowych. Tylko starannie dobrane historie, nagrane przez profesjonalnych lektorów w odpowiednim tempie i tonie, uzupełnione naturalnymi pejzażami dźwiękowymi.

Zmień jeden wieczorny nawyk. Efekty zobaczysz po tygodniu.`
  },
  {
    slug: "jak-zbudowac-rytual-zasypiania",
    title: "Rytuał zasypiania krok po kroku: Kompletny przewodnik dla rodziców małych dzieci",
    desc: "Jak w 2 tygodnie zbudować nawyk, który sprawi, że wieczory staną się spokojne, a Twoje dziecko będzie zasypiać szybko i bez walki każdego dnia.",
    date: "20 Czerwca 2026",
    category: "Porady",
    image: "bg-emerald-900/40",
    content: `Są dwa rodzaje rodziców: ci, którzy mają opracowany rytuał wieczorny i śpią spokojnie – i ci, którzy każdy wieczór traktują jak improwizację, kończącą się zazwyczaj po 21:00, z kółkami pod oczami i nerwami na strzępach.

Jeśli czytasz ten artykuł, prawdopodobnie należysz do tej drugiej grupy. I nic w tym złego – nikt nie rodzi się z wiedzą, jak skutecznie usypiać dzieci. Ale dobrą wiadomością jest to, że rytualnego snu można się nauczyć – i co więcej, można go nauczyć swoje dziecko w zaledwie 10–14 dni.

**Dlaczego dzieci potrzebują rytuału – neurologia w pigułce**

Mózg dziecka do około 7. roku życia jest w trybie intensywnej nauki i budowania połączeń neuronowych. To niesamowite – ale też wymagające. Układ nerwowy dziecka jest w ciągłej gotowości na nowe bodźce, co sprawia, że przełączenie z trybu "aktywny" na "sen" wymaga wyraźnego, powtarzalnego sygnału.

To właśnie jest rytuał. Seria znanych, przewidywalnych działań, która daje mózgowi dziecka informację: "Czas zwalniać. Zbliża się sen." Po kilku tygodniach regularnego powtarzania, samo rozpoczęcie rytuału zaczyna wyzwalać kaskadę procesów fizjologicznych: spada temperatura ciała, rośnie poziom melatoniny, zwalnia tętno. Dziecko dosłownie uczy się zasypiać na komendę.

**Budowanie rytuału: od czego zacząć?**

Zanim zaczniesz, ustal dwa kluczowe parametry:

Godzina snu – powinna być stała 7 dni w tygodniu, także w weekendy. Mózg nie rozumie pojęcia "sobota" – rozumie rytm. Nawet 30-minutowe przesunięcie w weekendy potrafi rozregulować zegar biologiczny na cały tydzień.

Czas rytuału – zaplanuj minimum 30–45 minut. Nie da się skutecznie wyciszyć dziecka w 10 minut, zwłaszcza na początku budowania nawyku.

**Kompletna, sprawdzona sekwencja rytuału na dobranoc**

Godzina 18:30 – Ostatni posiłek. Lekka kolacja, najlepiej bez cukru prostego. Unikaj słodkich deserów wieczorem – cukier podnosi poziom energii na 30–60 minut, dokładnie w momencie, gdy chcemy wyciszenia.

Godzina 19:00 – Czas na ekrany dobiega końca. Powiedz dziecku z wyprzedzeniem: "Za 10 minut wyłączamy telewizor." To nie jest negocjacja, to informacja. Spokojny, stanowczy ton, bez emocji.

Godzina 19:10 – Kąpiel. Ciepła (nie gorąca) woda przez 15 minut. Możesz dodać kilka kropel olejku lawendowego do wanny – lawenda ma udowodnione właściwości uspokajające. Kąpiel to moment transformacji – dziecko "zmywa" z siebie cały dzień.

Godzina 19:30 – Higiena i piżama. Mycie zębów, mycie twarzy. Wybierz piżamę razem z dzieckiem – to daje mu poczucie sprawczości i redukuje opór przed kolejnym etapem.

Godzina 19:40 – Ścielenie łóżka i przyciemnienie pokoju. Włącz małą lampkę nocną. Niech dziecko samo wskoczy pod kołdrę – to jego terytorium, jego bezpieczna przestrzeń.

Godzina 19:45 – Start bajki "Na Dobranoc". To jest kluczowy moment. Włącz aplikację, połóż telefon, usiądź lub połóż się obok. Przez pierwsze kilka minut bądź obecny. Potem możesz spokojnie wyjść – bajka gra dalej, ekran jest ciemny, dziecko śpi.

**Jak radzić sobie z oporem dziecka?**

Prawie każde dziecko początkowo protestuje przeciwko nowej rutynie. To normalne i zdrowe – dzieci testują granice. Oto kilka zasad, które ułatwią przejście:

Nie negocjuj kolejności kroków. Rytuał jest rytuałem, nie zestawem opcji do wyboru.

Daj dziecku wybór w ramach rytuału: "Którą piżamę zakładamy – niebieską czy zieloną?" Poczucie kontroli znacznie redukuje opór.

Bądź spokojny. Twój stres jest zaraźliwy. Jeśli Ty jesteś napięty, dziecko to wyczuje i będzie równie napięte.

Nie rezygnuj po trzech dniach. Budowanie nawyku wymaga 10–14 dni regularnych powtórzeń. Pierwsze dni są najtrudniejsze.

**Rola bajki audio w rytuale**

Bajka audio pełni w rytuale podwójną rolę. Po pierwsze – jest nagrodą. "Jak skończymy kąpiel i zęby, włączymy bajkę." Po drugie – jest sygnałem końcowym, informującym mózg dziecka, że dzień dobiegł końca i nie ma już nic do zrobienia.

W aplikacji "Na Dobranoc" narracja jest celowo spowolniona w trakcie opowiadania. Pierwsze minuty są bardziej angażujące – żeby dziecko się wciągnęło. Kolejne minuty są coraz cichsze, coraz spokojniejsze. Głos lektora zwalnia. Pauzy między zdaniami się wydłużają. To nie przypadek – to celowy zabieg, który naturalnie synchronizuje oddech dziecka z tempem opowiadania.

Większość dzieci zasypia zanim historia się skończy. I właśnie o to chodzi.

**Po dwóch tygodniach**

Rodzice, którzy wprowadzili powyższy rytuał, raportują spektakularne zmiany. Dzieci same przypominają o kąpieli. Podają piżamę rodzicom. Proszą o bajkę. Rytuał staje się ich bezpieczną kotwicą, czymś, na co czekają – bo wiedzą, że potem będzie sen, a za snem – nowy dzień.

To jest cel. Spokojne wieczory dla całej rodziny.

Zacznij dziś wieczorem. Jeden krok, jeden wieczór na raz.`
  },
  {
    slug: "moc-dzwieku-dlaczego-audio-jest-lepsze",
    title: "Moc dźwięku, wyobraźni i spokoju. Dlaczego bajki audio wygrywają z YouTube'em na dobranoc?",
    desc: "Psychologiczna i neurobiologiczna analiza wpływu dźwięku na zasypianie. Dlaczego aktywacja wyobraźni dziecka jest kluczem do spokojnej nocy i bogatszego umysłu.",
    date: "12 Czerwca 2026",
    category: "Psychologia",
    image: "bg-pink-900/40",
    content: `Wyobraź sobie dwie sceny.

Scena pierwsza: dziecko leży w łóżku, oczy wpatrzone w błyszczący ekran tabletu. Bajka leci, światło miga, muzyka gra. Co 2 sekundy nowa scena, nowy kolor, nowy ruch. Dziecko patrzy, ale nie myśli. Konsumuje.

Scena druga: dziecko leży w ciemnym pokoju. Telefon odłożony, ekran wygaszony. Z głośnika płynie spokojny, ciepły głos: "Pewnego wieczoru mały jeż Henryk wyszedł z norki, żeby policzyć gwiazdy..." Dziecko zamknęło oczy. W głowie rysuje się jeż. Jest mały, rudy, ma kolce na grzbiecie i ciekawe oczy. Las pachnie. Jest chłodno. Gwiazdy są duże.

W której scenie dziecko zaśnie? W której scenie dziecko jest szczęśliwsze?

**Czym jest "bierna konsumpcja" i dlaczego szkodzi**

Kiedy dziecko ogląda bajkę wideo, jego mózg wchodzi w tryb pasywnego odbioru. Wszystkie obrazy są gotowe – ktoś już za nie zdecydował, jak wygląda jeż, jaki ma kolor las, jak szybko biegną postacie. Mózg nie musi tworzyć – musi jedynie przetwarzać kolejne dane wejściowe, tak szybko jak pędzi film.

To jest problem. Bo szybkie przetwarzanie danych to praca, a nie odpoczynek. Kora przedczołowa, odpowiedzialna za planowanie i uwagę, jest aktywna przez cały czas oglądania. Ciało migdałowate – centrum emocji – reaguje na każdą zmianę sceny. Mózg jest dosłownie w trybie czuwania.

A potem mówimy dziecku: "Dobranoc. Śpij."

I dziwimy się, że nie może.

**Aktywna wyobraźnia – sekret spokojnego zasypiania**

Bajki audio działają zupełnie inaczej. Kiedy dziecko słyszy opis, ale nie widzi obrazu, jego mózg musi sam ten obraz stworzyć. To jest aktywna wyobraźnia – i jest czymś zupełnie różnym od konsumpcji.

Proces tworzenia wyobrażeń angażuje prawą półkulę mózgu – tę odpowiedzialną za kreatywność, emocje i intuicję. Ale robi to w spokojnym, kontrolowanym tempie. Narrator nie goni, nie krzyczy, nie podkręca tempa. Mówi powoli. Robi pauzy. Pozwala mózgowi dziecka pracować we własnym rytmie.

I tu dzieje się magia: ta "praca" wyobraźni jest wyczerpująca w dobry sposób. Pochłania energię umysłową, ale nie pobudza układu nerwowego. Dziecko jest zajęte tworzeniem własnego świata – i właśnie dlatego zasypia. Nie z nudów, ale z naturalnego wyeksploatowania wyobraźni.

**Badania naukowe, które dają do myślenia**

Badacze z Uniwersytetu Harvarda przeprowadzili serię eksperymentów porównujących aktywację mózgu podczas słuchania opowiadań audio i oglądania filmów wideo. Wyniki były jednoznaczne: słuchanie narracji aktywuje znacznie większą liczbę obszarów mózgu, w tym te odpowiedzialne za empatię, przetwarzanie sensoryczne (wzrokowe, słuchowe, dotykowe – mimo że żadne z tych zmysłów nie jest bezpośrednio stymulowane!) i regulację emocji.

Innymi słowy: słuchając opowiadania o śniegu, mózg dziecka "czuje" zimno. Słuchając o zapachu sosnowego lasu – "wącha". To jest pełnoekranowe doświadczenie sensoryczne, tyle że wygenerowane wewnętrznie. I jest ono głębiej zakodowane w pamięci niż jakikolwiek film.

**Szumy tła – drugi filar naszej aplikacji**

Poza narracją, aplikacja "Na Dobranoc" używa starannie dobranych szumów tła. Nie jest to przypadkowy dźwięk deszczu ściągnięty z internetu. To profesjonalnie nagrane i zmiksowane pejzaże dźwiękowe, które spełniają kilka funkcji jednocześnie.

Po pierwsze – maskują hałasy zewnętrzne. Głos sąsiada zza ściany, samochód na ulicy, szczekanie psa – wszystko to może wyrwać dziecko z procesu zasypiania. Równomierny szum tła "przykrywa" te zakłócenia.

Po drugie – szum różowy (pink noise) i szum biały (white noise) mają udowodnione właściwości wyciszające. Badania wykazały, że niemowlęta usypiają do szumu białego 80% szybciej. U starszych dzieci efekt jest podobny, choć nieco słabszy.

Po trzecie – szumy natury (deszcz, las, morze) mają dodatkową, psychologiczną wartość. Są kojarzone przez mózg z bezpieczeństwem i przestrzenią – z miejscami, gdzie nie ma zagrożenia. To atawistyczna reakcja, zakodowana w naszym DNA przez miliony lat ewolucji.

**Co zyskuje dziecko, które słucha zamiast oglądać?**

Efekty nie kończą się na szybszym zasypianiu. Dzieci, które regularnie słuchają bajek audio, wykazują z czasem:

Bogatsze słownictwo – narrator opisuje świat słowami, a nie obrazami. Dziecko uczy się nowych pojęć w naturalnym kontekście.

Lepszą koncentrację – aktywne słuchanie to ćwiczenie skupienia uwagi, które przekłada się na lepsze wyniki w szkole.

Wyższą empatię – identyfikowanie się z bohaterami historii audio wymaga wyobrażenia sobie ich emocji, co ćwiczy teorię umysłu i empatyczne rozumienie innych.

Bogatszą wyobraźnię twórczą – dzieci, które dużo słuchają, więcej rysują, więcej wymyślają zabaw i lepiej radzą sobie z kreatywnymi zadaniami.

Spokojniejszy sen – głębszy, bardziej regenerujący, z dłuższymi fazami REM.

**Dlaczego wybraliśmy właśnie to podejście**

Tworząc "Na Dobranoc" nie chcieliśmy stworzyć kolejnej aplikacji dla dzieci. Chcieliśmy stworzyć narzędzie, które realnie pomaga – rodzicom i dzieciom. Bazując na najnowszych badaniach z dziedziny neurobiologii snu, pedagogiki i psychologii rozwojowej, zbudowaliśmy platformę, która jest prosta w obsłudze, ale głęboko przemyślana w działaniu.

Każda bajka jest napisana przez specjalistów z dziedziny pedagogiki. Każdy lektor nagrany jest w profesjonalnym studiu. Każdy szum tła jest zmiksowany tak, by nie zakłócał naturalnych cykli snu.

To nie jest przypadkowy produkt. To jest odpowiedź na realny problem tysięcy rodzin.

Daj swojemu dziecku coś więcej niż kolejną bajkę wideo. Daj mu noc, po której będzie miało siłę i chęć na nowy dzień.`
  }
];

const contentDir = path.join(__dirname, 'src', 'content', 'blog');
if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir, { recursive: true });
}

blogPosts.forEach(post => {
  const frontmatter = \`---
title: "\${post.title}"
desc: "\${post.desc}"
date: "\${post.date}"
category: "\${post.category}"
image: "\${post.image}"
---

\`;

  const mdContent = frontmatter + post.content;
  fs.writeFileSync(path.join(contentDir, post.slug + ".md"), mdContent);
});

console.log('Markdown files generated successfully!');
