# MotoQuest TODO

## CRITICAL

Brak otwartych zadan krytycznych.

## HIGH

### Baseline przed UI Premium

- Status: DONE
- Priorytet: HIGH
- Wplyw: wysoki - potwierdza stabilny punkt startowy.
- Opis: `npm run build` zakonczony poprawnie 2026-06-20; 8 tras wygenerowanych, TypeScript bez bledow.

### Macierz regresji UI Premium

- Status: READY
- Priorytet: HIGH
- Wplyw: wysoki - chroni dzialajace funkcje podczas zmian wizualnych.
- Opis: przygotowac testy loginu, sesji, profilu, garazu, wypraw, misji, rankingu i safe area przed pierwsza implementacja UI.

### Fizyczne testy wydajnosci mapy

- Status: READY
- Priorytet: HIGH
- Wplyw: wysoki - komfort jazdy.
- Opis: zmierzyc mape i mgle na Huawei P20 Lite oraz nowym telefonie.

### Stabilnosc sledzenia w tle

- Status: READY
- Priorytet: HIGH
- Wplyw: wysoki - ochrona postepu przy zablokowanym ekranie.

### Zamrozenie systemow wysokiego ryzyka podczas UI Premium

- Status: ACTIVE
- Priorytet: HIGH
- Wplyw: wysoki - zapobiega regresjom odkrywania.
- Opis: bez osobnego zadania i testow nie zmieniac `MapView.tsx`, `useMotoQuestTracking.ts`, Fog of Discovery, `tiles.ts`, `playerService.ts`, Android background tracking, Supabase ani kluczy `mq_*`.

## MEDIUM

### UI Premium - login i rejestracja

- Status: READY
- Priorytet: MEDIUM
- Wplyw: wysoki - pierwsze wrazenie i czytelnosc autoryzacji.

### UI Premium - profil

- Status: READY
- Priorytet: MEDIUM
- Wplyw: wysoki - glowny ekran postepu gracza.

### UI Premium - HUD mapy

- Status: BLOCKED
- Priorytet: MEDIUM
- Wplyw: wysoki - centralny ekran aplikacji.
- Opis: odblokowac dopiero po fizycznych testach mapy; zmieniac tylko `MapHud.tsx` i CSS.

### UI Premium - misje miejskie

- Status: BLOCKED
- Priorytet: MEDIUM
- Wplyw: sredni - ergonomia zadan.
- Opis: odblokowac po tescie end-to-end GPS i zdjec.

### UI Premium - garaz

- Status: READY
- Priorytet: MEDIUM
- Wplyw: sredni - zarzadzanie motocyklem.

### UI Premium - odznaki i ranking

- Status: READY
- Priorytet: MEDIUM
- Wplyw: sredni - motywacja i rywalizacja.

### Testy responsywnosci UI Premium

- Status: READY
- Priorytet: MEDIUM
- Wplyw: wysoki - zgodnosc iOS/Android.
- Opis: pion, poziom, safe area, klawiatura, male ekrany i PWA standalone.

### Testy misji miejskich

- Status: READY
- Priorytet: MEDIUM
- Wplyw: sredni - poprawne cele GPS i nagrody.

### Odkrywanie drog

- Status: PLANNED
- Priorytet: MEDIUM
- Wplyw: wysoki - nowe dlugoterminowe cele.

### Anty-cheat GPS

- Status: PLANNED
- Priorytet: MEDIUM
- Wplyw: sredni - wiarygodny ranking.

## LOW

### Porzadki starszych modulow

- Status: PLANNED
- Priorytet: LOW
- Wplyw: utrzymanie kodu.
- Opis: przeanalizowac starsze pliki `player*`, `achievements*` i `regions*`.
