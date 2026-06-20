# MotoQuest - Next Tasks

Glowny kanal zadan pomiedzy ChatGPT i Codex.

## TASK-001: System dokumentacji AI

- Status: DONE
- Priorytet: HIGH
- Zrodlo: MOTOQUEST AI DEVELOPMENT SYSTEM.pdf
- Data dodania: 2026-06-20

### Cel

Utworzyc dokumentacje bedaca zrodlem prawdy.

### Kryteria ukonczenia

- Wymagane pliki istnieja w `docs/`.
- Opisuja wersje 1.4.
- Architektura zawiera diagramy Mermaid.

## TASK-002: Test wydajnosci na slabszym Androidzie

- Status: READY
- Priorytet: HIGH
- Zrodlo: Codex
- Data dodania: 2026-06-20

### Cel

Potwierdzic plynna mape na Huawei P20 Lite.

### Zakres

- Gesty mapy, mgla, znacznik, bateria i pamiec.

### Kryteria ukonczenia

- Brak blokowania gestow.
- Stabilne sledzenie podczas jazdy.
- Udokumentowane wyniki.

### Notatki projektowe

Wymaga fizycznego telefonu i rzeczywistego GPS.

## TASK-003: Test end-to-end misji GPS

- Status: READY
- Priorytet: MEDIUM
- Zrodlo: Codex
- Data dodania: 2026-06-20

### Cel

Sprawdzic przypisanie i zaliczenie misji.

### Kryteria ukonczenia

- Przycisk Sprawdz pokazuje stan.
- Misja poza promieniem jest odrzucana.
- Misja w promieniu zapisuje postep i XP.
- Zdjecie trafia do prywatnego bucketu tylko gdy jest wymagane.

## TASK-004: UI Premium - etap 1 - logowanie i rejestracja

- Status: DONE
- Priorytet: HIGH
- Zrodlo: Uzytkownik
- Data dodania: 2026-06-20

### Cel

Ujednolicic wejscie do aplikacji w stylu premium bez zmiany Supabase Auth, sesji i OAuth.

### Zakres

- `components/AuthShell.tsx`
- `components/AuthLoginForm.tsx`
- `components/AuthRegisterForm.tsx`
- `app/(auth)/*/page.tsx`
- Wylacznie klasy prezentacyjne auth w `app/globals.css`

### Wymagania

- Nie zmieniac `lib/auth.ts` ani `lib/supabase.ts`.
- Zachowac logowanie, rejestracje, reset hasla, OAuth i zapamietanie sesji.
- Zachowac safe area i obsluge klawiatury mobilnej.

### Kryteria ukonczenia

- Build przechodzi.
- Formularze dzialaja na mobile i desktop.
- Bledy, loading, disabled i powrot do profilu sa czytelne.

### Wynik

- Wdrozono dark premium UI dla logowania, rejestracji i resetu hasla.
- Zachowano istniejaca logike Supabase Auth, OAuth i sesji.
- `npm run build` zakonczony poprawnie 2026-06-20.

## TASK-005: UI Premium - etap 2 - profil

- Status: DONE
- Priorytet: HIGH
- Zrodlo: Uzytkownik
- Data dodania: 2026-06-20

### Cel

Przebudowac hierarchie wizualna profilu bez zmiany synchronizacji gracza.

### Zakres

- `components/PlayerProfilePanel.tsx`
- `components/XPBar.tsx`
- `components/SpecialBadgesPanel.tsx`
- `components/CloudStatusPanel.tsx`
- `components/SettingsPanel.tsx`

### Wymagania

- Nie zmieniac `lib/playerService.ts`, schematu Supabase ani storage.
- Zachowac stany zalogowany/niezalogowany i obsluge avatara.

### Kryteria ukonczenia

- Dane profilu, XP, aktywny motocykl i status chmury pozostaja zgodne.
- Nawigacja profil - ustawienia - osiagniecia dziala.

### Wynik

- Wdrozono premium dashboard profilu dla stanu zalogowanego i niezalogowanego.
- Ujednolicono wizualnie XP, odznaki specjalne, status chmury i ustawienia.
- `npm run build` zakonczony poprawnie 2026-06-20.

## TASK-006: UI Premium - etap 3 - glowna mapa

- Status: BLOCKED
- Priorytet: HIGH
- Zrodlo: Uzytkownik
- Data dodania: 2026-06-20

### Cel

Odnowic HUD mapy bez ingerencji w silnik MapLibre i Fog of Discovery.

### Zakres

- `components/MapHud.tsx`
- Bezpieczne klasy HUD w `app/globals.css`

### Wymagania

- Bezwzglednie nie zmieniac `components/MapView.tsx`.
- Nie zmieniac `lib/useMotoQuestTracking.ts`, `lib/tiles.ts` ani kluczy `mq_*`.
- Nie zmieniac Canvas Fog, projekcji kafelkow i animacji mgly.

### Kryteria ukonczenia

- Przed rozpoczeciem wymagane wyniki TASK-002.
- Gesty mapy, sledzenie, warstwy, zoom i nagrywanie dzialaja bez regresji.
- Porownanie pion/poziom na iOS i Android.

### Notatki projektowe

Status BLOCKED do czasu fizycznego testu wydajnosci mapy.

## TASK-007: UI Premium - etap 4 - misje miejskie

- Status: BLOCKED
- Priorytet: MEDIUM
- Zrodlo: Uzytkownik
- Data dodania: 2026-06-20

### Cel

Poprawic prezentacje listy miast, misji, postepu i komunikatow.

### Zakres

- Warstwa prezentacyjna `components/CityMissionsPanel.tsx`.
- Ikony i klasy wizualne misji.

### Wymagania

- Nie zmieniac `lib/cityMissions.ts`, Edge Function, Storage, RPC ani schematu bazy.
- Zachowac wszystkie stany GPS, zdjecia, busy, success i error.

### Kryteria ukonczenia

- Przed rozpoczeciem zakonczony TASK-003.
- Zaliczenie GPS i upload zdjecia przechodza test regresji.

## TASK-008: UI Premium - etap 5 - garaz

- Status: DONE
- Priorytet: MEDIUM
- Zrodlo: Uzytkownik
- Data dodania: 2026-06-20

### Cel

Ujednolicic karty motocykli, formularz i aktywna maszyne.

### Zakres

- `components/GaragePanel.tsx`
- `components/BikeProfilePanel.tsx`

### Wymagania

- Nie zmieniac `lib/garage.ts`, `lib/playerService.ts`, Storage i Supabase.
- Zachowac upload zdjecia i synchronizacje wielourzadzeniowa.

### Kryteria ukonczenia

- Dodanie i wybor motocykla dzialaja.
- Motocykl pojawia sie po zalogowaniu na drugim urzadzeniu.

### Wynik

- Wdrozono premium UI garazu, formularza dodawania motocykla i aktywnej maszyny.
- Zachowano istniejace akcje: dodawanie motocykla, upload zdjecia i wybor aktywnego motocykla.
- `npm run build` zakonczony poprawnie 2026-06-20.

## TASK-009: UI Premium - etap 6 - odznaki i ranking

- Status: READY
- Priorytet: MEDIUM
- Zrodlo: Uzytkownik
- Data dodania: 2026-06-20

### Cel

Ujednolicic wizualnie osiagniecia, mape Polski i ranking.

### Zakres

- `components/AchievementsPanel.tsx`
- `components/SpecialBadgesPanel.tsx`
- `components/PolandMap.tsx`
- `components/LeaderboardPanel.tsx`

### Wymagania

- Nie zmieniac naliczania XP, kluczy storage ani `mq_real_player_leaderboard()`.
- Zachowac filtry, zwijanie sekcji i sortowanie po obszarze.

### Kryteria ukonczenia

- Wszystkie filtry i sekcje dzialaja.
- Ranking pokazuje tylko zarejestrowane konta.
- Build i test regresji danych przechodza.
