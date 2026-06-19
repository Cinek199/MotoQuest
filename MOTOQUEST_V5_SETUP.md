# MotoQuest V5 - uruchomienie

1. Uruchom w Supabase SQL Editor plik:
   `supabase_migration_city_missions_v5.sql`
2. Wdroz funkcje:
   `supabase functions deploy verify-mission-photo`
3. Zbuduj aplikacje:
   `npm run build`

Weryfikacja jest bezplatna i nie korzysta z OpenAI. Serwer sprawdza sesje gracza,
prywatna sciezke zdjecia oraz odleglosc GPS od celu. Zdjecie pozostaje zapisane
w prywatnym bucketcie `mission-photos` jako dowod wykonania zadania.
