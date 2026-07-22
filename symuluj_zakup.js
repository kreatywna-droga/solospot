// Skrypt do symulacji webhooka z 1koszyk (Testowanie zakupów offline)
// Uruchomienie: node symuluj_zakup.js [opcjonalny_email]

// Pobieramy email z argumentu wywołania lub używamy domyślnego
const email = process.argv[2] || "testowy_zakup@test.pl";

console.log("=================================================");
console.log(`🛸 SYMULACJA ZAKUPU 1KOSZYK DLA: ${email}`);
console.log("=================================================\n");

fetch('https://na-dobranoc.pl/api/webhooks/onekoszyk', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    // W 1koszyk struktura jest bardziej skomplikowana, ale nasz kod na backendzie 
    // jest na tyle sprytny, że potrafi wyciągnąć email z dowolnego pola poniżej.
    body: JSON.stringify({ 
        customer: { email: email },
        order_id: "TEST_ORDER_12345"
    })
})
.then(response => response.json().then(data => ({ status: response.status, body: data })))
.then(({ status, body }) => {
    console.log(`Status HTTP: ${status}`);
    console.log("Odpowiedź Serwera:", body);
    
    if (status === 200) {
        console.log("\n✅ SUKCES! Serwer przyjął sztuczny zakup.");
        console.log("👉 Zobacz w oknie terminala Next.js (tam gdzie działa npm run dev),");
        console.log("czy widzisz komunikat 'Zapisano w pending_licenses' lub 'Nadano status Premium'.");
        
        console.log(`\n🎉 Następny krok: Zarejestruj się w aplikacji używając e-maila: ${email}`);
        console.log("System automatycznie połączy 'zaległą' licencję z Twoim nowym kontem!");
    } else {
        console.log("\n❌ UWAGA: Serwer zwrócił błąd. Zobacz logi w konsoli Next.js.");
    }
})
.catch(error => {
    console.log("\n❌ BŁĄD POŁĄCZENIA.");
    console.log("Czy na pewno w drugim terminalu włączony jest serwer deweloperski (npm run dev)?");
    console.log("Szczegóły błędu:", error.message);
});
