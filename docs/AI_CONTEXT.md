# MotoQuest - AI Context

## Informacje podstawowe

- Nazwa projektu: MotoQuest
- Wersja produktu: 1.4
- Wersja pakietu web: 0.1.0
- Data aktualizacji: 2026-06-20
- Platformy: PWA, Android (Capacitor), mobilna przegladarka iOS/Android

## Opis projektu

MotoQuest jest mobilna gra eksploracyjna oparta o rzeczywiste podroze motocyklem. Aplikacja rejestruje GPS, odkrywa fragmenty mapy, wyprawy, miasta i wojewodztwa, przyznaje XP oraz pozwala rywalizowac wedlug odkrytego obszaru. Nieodkryty swiat zakrywa animowana mgla Fog of Discovery.

## Aktualne funkcje

| Funkcja | Status | Opis | Powiazane pliki |
| --- | --- | --- | --- |
| Mapa MapLibre | ACTIVE | Zoom, przesuwanie, obracanie i centrowanie GPS | `components/MapView.tsx`, `components/MapHud.tsx` |
| Fog of Discovery | ACTIVE | Animowana mgla z wycieciami odkrytych kafelkow | `components/MapView.tsx` |
| Odkrywanie kafelkow | ACTIVE | Trwaly zapis odkryc na podstawie GPS | `lib/tiles.ts`, `lib/useMotoQuestTracking.ts` |
| Miejscowosci i regiony | ACTIVE | Reverse geocoding, herby i postep wojewodztw | `components/TownsPanel.tsx`, `components/PolandMap.tsx` |
| Wyprawy | ACTIVE | Nagrywanie, historia, filtry, GPX i galerie | `components/TripsPanel.tsx`, `lib/trips.ts` |
| XP i osiagniecia | ACTIVE | Poziomy, kategorie, postep i odznaki | `components/AchievementsPanel.tsx`, `lib/usePlayerStats.ts` |
| Misje miejskie | ACTIVE | 80 miast, GPS, prywatne zdjecia i 5 typow misji | `components/CityMissionsPanel.tsx`, `lib/cityMissions.ts` |
| Ranking | ACTIVE | Zarejestrowani gracze wedlug odkrytego obszaru | `components/LeaderboardPanel.tsx` |
| Garaz | ACTIVE | Motocykle, zdjecia i synchronizacja | `components/GaragePanel.tsx`, `lib/playerService.ts` |
| Konto | ACTIVE | Auth, OAuth, reset hasla i trwala sesja | `app/(auth)`, `lib/auth.ts` |
| Android | ACTIVE | Background GPS i Picture in Picture | `android/`, `lib/nativeAndroid.ts` |
| PWA | ACTIVE | Service Worker, instalacja i safe area | `app/layout.tsx`, `public/sw.js` |

## Systemy projektu

### Mapa i mgla

MapLibre wyswietla podklad CARTO Dark Matter. Canvas nad mapa renderuje teksture mgly i usuwa ja w odkrytych kafelkach. Na slabszych urzadzeniach renderer zmniejsza rozdzielczosc i liczbe klatek. Panel warstw steruje mgla, etykietami i granicami odkryc.

### Geolokalizacja

`useMotoQuestTracking` laczy Web Geolocation API z natywnym trackerem Android. Pozycje aktualizuja dystans, trase, kafelki, miejscowosc i wojewodztwo. Znacznik jest interpolowany, a mapa obraca sie wedlug kierunku ruchu.

### Supabase

Postep lokalny jest laczony z chmura i zapisywany do Supabase. Garaz jest czescia synchronizowanego postepu. Edge Function `verify-mission-photo` sprawdza GPS bez OpenAI.

## Struktura projektu

```text
app/                    Next.js App Router, auth i style
components/             Ekrany, mapa i panele gry
lib/                    Logika domenowa, GPS i Supabase
android/                Projekt Capacitor Android
public/                 PWA, mgla, ikony i herby
supabase/functions/     Edge Functions
docs/                   Dokumentacja projektu
*.sql                   Migracje Supabase
```

## Struktura bazy danych

| Tabela / funkcja | Przeznaczenie |
| --- | --- |
| `profiles` | Nick i avatar uzytkownika |
| `player_progress` | Kafelki, miasta, trasy, XP, dystans i garaz |
| `mq_cities` | 80 miast i ich centra GPS |
| `mq_city_missions` | Cele, promienie i nagrody misji |
| `mq_mission_assignments` | Przypisane misje |
| `mq_mission_submissions` | Proby zaliczenia i dane GPS |
| `mq_mission_completions` | Zaliczone misje |
| `mq_city_completions` | Ukonczone miasta |
| `mq_special_badges` | Definicje specjalnych odznak |
| `mq_user_special_badges` | Zdobyte specjalne odznaki |
| `mq_real_player_leaderboard()` | Ranking bez kont anonimowych |
| Storage | `avatars`, `bike-photos`, `trip-photos`, `mission-photos` |

## Znane bledy i ryzyka

| Status | Priorytet | Opis |
| --- | --- | --- |
| MONITORING | HIGH | Wydajnosc mgly wymaga testow na slabszych fizycznych urzadzeniach |
| MONITORING | HIGH | Jakosc GPS zalezy od telefonu i oszczedzania baterii |
| OPEN | MEDIUM | Weryfikacja GPS nie potwierdza zawartosci zdjecia |
| OPEN | MEDIUM | Reverse geocoding wymaga sieci i podlega limitom dostawcy |
| OPEN | LOW | Pozostaly starsze, czesciowo zastapione moduly domenowe |

## Funkcje planowane

### Najblizszy etap

- Testy wydajnosci na fizycznych telefonach.
- Test stabilnosci GPS w tle.
- Test pelnego procesu misji miejskiej.

### Sredni termin

- Odkryte drogi i procent przejechanych drog.
- Punkty widokowe, fotograficzne i miejsca dla motocyklistow.
- Statystyki i wykresy.

### Długi termin

- Nawigacja zakret po zakrecie.
- Sezony i wyzwania spolecznosci.
- Anty-cheat GPS.

Pelna historia znajduje sie w [CHANGELOG.md](CHANGELOG.md).

