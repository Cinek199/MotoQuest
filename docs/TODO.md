# MotoQuest TODO

## CRITICAL

Brak otwartych zadan krytycznych.

## Wyniki testu regresji UI Premium

- Data: 2026-06-20
- Status builda: PASS (`npm run build`)
- Status systemow wysokiego ryzyka: PASS - brak diffow w `MapView.tsx`, `useMotoQuestTracking.ts`, `tiles.ts`, `playerService.ts`, `supabase.ts`, `auth.ts` i `android/`
- Status tras HTTP: PASS - `/, /login, /register, /reset-password` zwracaja `200` na lokalnym serwerze
- Status kontroli kodu UI: PASS - logika filtrow osiagniec, zwijania sekcji, rankingu RPC, garazu, profilu i auth pozostala spojna z zakresem zmian
- Status responsywnosci mobilnej: PARTIAL - brak automatycznej weryfikacji viewportow i safe area z powodu ograniczen sandboxa przegladarki headless
- Status interakcji z chmura i drugim urzadzeniem: PARTIAL - wymaga recznego testu logowania, uploadu zdjecia motocykla i synchronizacji na fizycznych telefonach
- Wniosek: mozna bezpiecznie przejsc dalej z kolejnymi etapami UI, ale przed publikacja produkcyjna warto wykonac reczny przebieg na iPhone i Androidzie

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

- Status: DONE
- Priorytet: MEDIUM
- Wplyw: wysoki - pierwsze wrazenie i czytelnosc autoryzacji.
- Opis: wdrozono 2026-06-20; build poprawny, logika Auth pozostala bez zmian.

### UI Premium - profil

- Status: DONE
- Priorytet: MEDIUM
- Wplyw: wysoki - glowny ekran postepu gracza.
- Opis: wdrozono 2026-06-20; build poprawny, logika synchronizacji i danych gracza pozostala bez zmian.

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

- Status: DONE
- Priorytet: MEDIUM
- Wplyw: sredni - zarzadzanie motocyklem.
- Opis: wdrozono 2026-06-20; build poprawny, logika garazu i synchronizacji pozostala bez zmian.

### UI Premium - odznaki i ranking

- Status: DONE
- Priorytet: MEDIUM
- Wplyw: sredni - motywacja i rywalizacja.
- Opis: wdrozono 2026-06-20; build poprawny, logika XP, ranking RPC i postep wojewodztw pozostaly bez zmian.

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

## Mobile UI Fix Pack
- [x] Safe area i status bar iPhone
- [x] Bottom nav spacing dla scrollowanych ekranow
- [x] Kompaktowa typografia mobile
- [x] Poprawka kart wypraw i badge
- [x] Polish MapHud
- [ ] Manualny smoke test na iPhone i Androidzie
