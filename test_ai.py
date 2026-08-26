from openai import OpenAI

# 1. Wklej tutaj swój klucz API z TokenRouter lub Pokee AI
API_KEY = "TWÓJ_KLUCZ_API_HERE"

# 2. Ustawienia połączenia
client = OpenAI(
    base_url='https://api.tokenrouter.com/v1',
    api_key=API_KEY,
)

# 3. Wybór darmowego modelu
# Możesz użyć: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" lub "moonshotai/kimi-k3-free"
MODEL_NAME = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"

def main():
    print(f"Łączenie z modelem {MODEL_NAME}...")
    
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": "Jesteś pomocnym asystentem AI."},
            {"role": "user", "content": "Witaj! Napisz krótki program w Pythonie, który wita użytkownika imiennie."}
        ]
    )

    print("\n--- Odpowiedź modelu ---")
    print(response.choices[0].message.content)

if __name__ == "__main__":
    main()
