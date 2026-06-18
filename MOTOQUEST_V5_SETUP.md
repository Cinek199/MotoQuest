# MotoQuest V5 - uruchomienie

1. Otworz Supabase SQL Editor i uruchom caly plik:
   `supabase_migration_city_missions_v5.sql`
2. Ustaw sekret AI w Supabase:
   `supabase secrets set OPENAI_API_KEY=twoj_klucz`
3. Opcjonalnie ustaw model:
   `supabase secrets set OPENAI_VISION_MODEL=gpt-4.1-mini`
4. Wdroż funkcje:
   `supabase functions deploy verify-mission-photo`
5. Zbuduj aplikacje:
   `npm run build`

Klucz OpenAI znajduje sie wyłącznie w Supabase Edge Function. Nie dodawaj go do
`NEXT_PUBLIC_*`, `.env.local` ani kodu aplikacji.

Weryfikacja zdjecia obejmuje:

- aktywna sesje użytkownika,
- prywatny bucket `mission-photos`,
- limit 20 prob na godzine,
- sprawdzenie promienia GPS,
- analize POI i motocykla przez model z obsługa obrazu,
- odrzucanie zrzutow ekranu, kolazy i niepasujacych scen,
- zapis wyniku, pewnosci i uzasadnienia w Supabase,
- automatyczne ukończenie misji, miasta i odznaki specjalnej.
