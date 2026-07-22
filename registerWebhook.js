

const ONEKOSZYK_API_KEY = "9c4c8b3ee02cdb4eecfc8253f63efb4bec01c8d4edc87513ec3ed96ab3f6fe22c336ad818b000865621655f7bda27d9a0cbc60f0559c0ee25758d4d56b648638";
const ONEKOSZYK_CLIENT_ID = "27e628d8-f4d8-45b2-9dec-94f962ad442d";
// Zmień to na swoją domenę Vercel
const WEBHOOK_URL = "https://frontend-web-omega-ten.vercel.app/api/webhooks/onekoszyk";

async function registerWebhook() {
  try {
    const response = await fetch("https://api.1koszyk.pl/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ONEKOSZYK_API_KEY}`
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        events: ["order.paid", "order.created"] // Przykładowe zdarzenia z 1koszyk
      })
    });

    const data = await response.json();
    console.log("Odpowiedź z serwera 1koszyk:");
    console.log(data);
  } catch (err) {
    console.error("Błąd podczas rejestracji webhooka:", err);
  }
}

registerWebhook();
