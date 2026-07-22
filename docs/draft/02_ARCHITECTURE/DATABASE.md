# WEB FACTOR Enterprise Documentation
## TOM IV — DATA

### 13. Domain Model
*   **Tenant / Store:** Główny agregat grupujący wszystkie inne encje.
*   **Product / Order / Customer:** B-C encje przypięte do konkretnego Tenant'a.

### 14. Database Specification
*   **ERD:** Relacyjna baza Supabase. Główne tabele: `stores`, `store_users`, `products`, `orders`, `order_items`, `customers`.
*   **Indeksy:** Na każdym kluczu obcym i na `store_id` (konieczne dla RLS i wydajności).
*   **Migracje:** Ściśle wersjonowane pliki SQL.
*   **Storage:** Buckyty na zdjęcia (np. `store-assets`) z regułami dostępu przypisanymi do sklepu.

### 15. Event Contracts
Logika asynchroniczna. Gdy następuje zdarzenie, np. `OrderCreated`, system wysyła Event na Event Bus, co wyzwala: mail do klienta, zmniejszenie stanu magazynowego, powiadomienie operatora.

### 16. API Specification
*   **REST:** Dostępne dla ewentualnych zewnętrznych integracji sklepu.
*   **Webhooki:** Otrzymywanie sygnałów z bramek płatności w celu zautomatyzowania zmiany statusu zamówień.
