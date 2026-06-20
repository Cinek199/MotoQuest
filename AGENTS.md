# MotoQuest — stałe instrukcje dla Codexa

## Zasada nadrzędna

Ten plik jest stałą instrukcją projektu MotoQuest.

Użytkownik nie musi za każdym razem pisać promptu startowego. Codex ma automatycznie stosować te zasady przy każdym zadaniu wykonywanym w tym repozytorium.

Przed rozpoczęciem jakiejkolwiek pracy Codex ma:
1. przeczytać i zastosować ten plik,
2. sklasyfikować zadanie jako LIGHT / MEDIUM / HEAVY,
3. zdecydować, czy może działać od razu, czy powinien zatrzymać się i zaproponować mocniejszy model.

## Klasyfikacja zadań

### LIGHT

Zadanie LIGHT wykonuj od razu na aktualnym modelu.

Przykłady:
- CSS,
- kolory,
- spacing,
- teksty,
- ikony,
- drobne poprawki UI,
- małe błędy wizualne,
- responsywność jednego widoku,
- drobne zmiany w komponentach.

Dla LIGHT:
- nie czytaj całego repo,
- znajdź tylko potrzebne pliki,
- wykonaj minimalną skuteczną zmianę,
- po zmianie podaj zmienione pliki i krótki opis.

### MEDIUM

Przed rozpoczęciem zadania MEDIUM zatrzymaj się i napisz:

„To zadanie jest MEDIUM. Zalecany model: GPT-5.4. Powód: ... Czy mam kontynuować na obecnym modelu, czy przełączyć model?”

Przykłady:
- zmiany w kilku plikach,
- błędy TypeScript,
- błędy builda,
- refactor jednego modułu,
- poprawki profilu,
- poprawki garażu,
- poprawki rankingu,
- poprawki systemu osiągnięć,
- synchronizacja jednej funkcji.

### HEAVY

Przed rozpoczęciem zadania HEAVY zatrzymaj się i napisz:

„To zadanie jest HEAVY. Zalecany model: GPT-5.5. Bez mocniejszego modelu mogę zużyć więcej limitu przez błędne poprawki albo niepełne zrozumienie zależności. Powód: ...”

Przykłady:
- Supabase Auth,
- logowanie i rejestracja,
- Apple login,
- Google login,
- migracje SQL,
- RLS,
- synchronizacja konta między urządzeniami,
- pełna synchronizacja postępu,
- bezpieczeństwo danych,
- duży refactor,
- zmiana architektury,
- ranking globalny z Supabase,
- trudny błąd produkcyjny,
- geolokalizacja + mapa + zapis postępu jednocześnie.

## Oszczędzanie limitów

Zawsze:
- nie czytaj całego repo bez potrzeby,
- najpierw znajdź konkretne pliki,
- nie generuj długich opisów,
- nie twórz wielu wariantów bez prośby,
- nie przebudowuj działających funkcji,
- nie ruszaj Supabase bez wyraźnego zadania,
- nie zmieniaj architektury bez zgody,
- nie rób masowego formatowania,
- po maksymalnie 2 nieudanych próbach zatrzymaj się i zaproponuj mocniejszy model,
- wykonuj minimalną skuteczną zmianę.

## Bezpieczeństwo projektu

Nie wolno:
- usuwać istniejących funkcji,
- usuwać danych,
- usuwać tabel lub kolumn Supabase,
- zmieniać polityk RLS bez opisania skutków,
- zmieniać działania logowania/rejestracji bez wyraźnego zadania,
- psuć synchronizacji postępu,
- zmieniać stylu aplikacji na niezgodny z MotoQuest.

## Styl MotoQuest

Zachowuj obecny styl:
- ciemny motocyklowy klimat,
- czarne teksturowane tła,
- pomarańczowe CTA,
- klimat adventure / road / map exploration,
- spójność z logo MQ,
- mapa jako główny element,
- premium rugged motorcycle vibe,
- statystyki,
- osiągnięcia,
- profil motocyklisty,
- bez niebieskiego cyberpunkowego stylu,
- bez sterylnego korporacyjnego wyglądu.

## Najważniejsze funkcje

Nie psuj:
- odkrywania mapy,
- kafelków mapy,
- miast i miejscowości,
- XP,
- leveli,
- osiągnięć,
- profilu użytkownika,
- unikalnych nicków,
- logowania/rejestracji,
- synchronizacji postępu,
- rankingu,
- garażu motocykli,
- tras/wypraw,
- zdjęć z podróży.

## Format odpowiedzi Codexa

Po każdym zadaniu odpowiedz krótko:

1. Klasyfikacja: LIGHT / MEDIUM / HEAVY
2. Zmienione pliki
3. Co zostało zrobione
4. Czy uruchomiono build/lint/test
5. Ryzyka
6. Następny krok

Nie pisz długich esejów. Konkret, pliki, efekt.
