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

- Status: DONE
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

### Wynik

- Wdrozono premium UI dla osiagniec, specjalnych odznak, mapy Polski i rankingu.
- Zachowano filtry, zwijanie sekcji, ranking RPC i herby wojewodztw.
- `npm run build` zakonczony poprawnie 2026-06-20.

## TASK-010: Manualny test regresji UI Premium na urzadzeniach

- Status: READY
- Priorytet: HIGH
- Zrodlo: Codex
- Data dodania: 2026-06-20

### Cel

Potwierdzic na fizycznych urzadzeniach brak regresji po etapach Auth, Profile, Garage, Achievements i Ranking.

### Zakres

- iPhone maly i duzy ekran
- Android maly i duzy ekran
- PWA standalone
- safe area
- wysunieta klawiatura
- pion i poziom
- logowanie, rejestracja, reset hasla
- profil zalogowany i niezalogowany
- ustawienia profilu
- garaz, upload zdjecia motocykla i aktywna maszyna
- osiagniecia, filtry, zwijanie sekcji, mapa Polski i ranking

### Kryteria ukonczenia

- Wszystkie kluczowe widoki sa czytelne na mobile i desktop.
- Nie ma uciec elementow przy safe area i klawiaturze.
- Upload motocykla, logowanie i synchronizacja zachowuja sie poprawnie na fizycznych telefonach.

## TASK-011: Manualny smoke test Mobile UI Fix Pack
- Status: PARTIAL
- Priorytet: HIGH
- Zrodlo: Codex
- Data dodania: 2026-06-21
- Zakres: iPhone / Android, profil, auth, wyprawy, garaz, odznaki, mapa pion/poziom po poprawkach safe area i bottom nav

### Wynik

- iPhone PWA smoke test PASS.
- Android pozostaje do fizycznej weryfikacji.

## TASK-012: Fizyczny test mapy, mgly i GPS

- Status: PARTIAL
- Priorytet: HIGH
- Zrodlo: Codex
- Data dodania: 2026-06-23

### Cel

Potwierdzic, ze mapa MapLibre, Fog of Discovery, sledzenie GPS, odkrywanie kafelkow, obrot mapy i dolny HUD dzialaja stabilnie na fizycznym telefonie.

### Zakres testu

- mapa pionowo
- mapa poziomo
- gesty mapy
- zoom
- centrowanie GPS
- obrot mapy wedlug kierunku ruchu
- marker gracza
- Fog of Discovery
- odkrywanie kafelkow
- panel warstw
- dolna nawigacja na mapie
- zuzycie baterii
- plynnosc na telefonie
- dzialanie po zablokowaniu ekranu
- powrot do aplikacji po kilku minutach

### Kryteria ukonczenia

- mapa nie zacina sie podczas przesuwania
- marker GPS aktualizuje sie poprawnie
- kafelki odkrywaja sie po ruchu
- mgla dziala i nie zaslania odkrytych kafelkow
- dolna nawigacja nie przeszkadza w uzywaniu mapy
- aplikacja nie crashuje po powrocie z tla
- GPS nie gubi sledzenia przy krotkim zablokowaniu ekranu

### Wynik testu iPhone PWA

- mapa pionowo: PASS
- mapa poziomo: PASS
- gesty, zoom, centrowanie, marker i dolny HUD: PASS
- marker podczas jazdy dziala plynnie: PASS
- po powrocie do aplikacji PWA na iPhone odswieza tylko aktualny kafelek; przejazd przy zablokowanym ekranie nie odkrywa trasy, bo iOS wstrzymuje PWA w tle
- mgla dzialala, ale dryf wizualny byl zbyt szybki; tempo dryfu zostalo spowolnione po tescie

### Kolejny krok

- zweryfikowac spowolniona mgle na iPhone
- wykonac TASK-013: Android background GPS test
- uwzglednic ograniczenie iPhone PWA: przy zablokowanym ekranie iOS moze wstrzymac PWA w tle, dlatego na iPhonie zalecane jest odkrywanie z aktywnym ekranem

### Android P20 Lite performance result

- Huawei P20 Lite: FAIL przed optymalizacja - mapa dzialala bardzo slabo, gesty przesuwania praktycznie nie byly uzywalne.
- Wykonano optymalizacje renderingowe: usunieto niewidoczne warstwy kafelkow MapLibre, ograniczono przeliczenia mgly do widocznego obszaru i zmniejszono koszt canvas fog na slabszych urzadzeniach.
- Wymagany ponowny test fizyczny po wdrozeniu nowej wersji APK/PWA.

## TASK-013: Android background GPS test

- Status: READY
- Priorytet: HIGH
- Zrodlo: Codex
- Data dodania: 2026-06-23

### Cel

Potwierdzic, ze Android APK/Capacitor poprawnie sledzi GPS, odkrywa kafelki i zapisuje trase po zablokowaniu ekranu oraz po powrocie do aplikacji.

### Zakres

- uruchomienie APK na Androidzie
- przyznanie uprawnien lokalizacji
- test lokalizacji tylko podczas uzywania aplikacji
- test lokalizacji caly czas, jesli aplikacja tego wymaga
- mapa otwarta na ekranie
- ekran zablokowany przez 3-5 minut podczas ruchu
- powrot do aplikacji
- sprawdzenie, czy punkty GPS zostaly nadrobione
- sprawdzenie, czy kafelki odkryly trase
- sprawdzenie, czy dystans sie naliczyl
- sprawdzenie, czy wyprawa zapisala punkty
- sprawdzenie, czy aplikacja nie crashuje
- sprawdzenie zuzycia baterii
- test po ubiciu aplikacji przez system, jesli mozliwe

### Kryteria PASS

- Android nie gubi GPS po krotkim zablokowaniu ekranu
- po powrocie do aplikacji trasa jest zachowana
- kafelki odkrywaja przejazd
- dystans nalicza sie poprawnie
- mgla odkrywa przejechana trase
- aplikacja nie crashuje
- dane zapisuja sie lokalnie i/lub w Supabase zgodnie z obecna logika

### Kryteria FAIL

- po zablokowaniu ekranu trasa nie zapisuje sie
- kafelki nie odkrywaja przejazdu
- aplikacja resetuje wyprawe
- GPS przestaje dzialac bez informacji dla uzytkownika
- aplikacja crashuje po powrocie z tla
