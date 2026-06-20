# Architektura MotoQuest

## Warstwy

```mermaid
flowchart TD
  UI["Next.js / React UI"] --> DOMAIN["Logika domenowa lib/"]
  UI --> MAP["MapLibre + Canvas Fog"]
  DOMAIN --> LOCAL["localStorage"]
  DOMAIN --> SUPA["Supabase Auth / DB / Storage"]
  DOMAIN --> GPS["Web Geolocation"]
  DOMAIN --> NATIVE["Capacitor Android Bridge"]
  NATIVE --> BG["Android Background Location"]
  SUPA --> EDGE["Edge Function - GPS mission verification"]
```

## Przeplyw GPS

```mermaid
sequenceDiagram
  participant GPS as GPS telefonu
  participant Track as useMotoQuestTracking
  participant Map as MapLibre
  participant Local as localStorage
  participant Cloud as Supabase
  GPS->>Track: pozycja, predkosc, kierunek
  Track->>Map: interpolacja znacznika i obrot
  Track->>Local: dystans, trasa, kafelki i miasta
  Track->>Cloud: synchronizacja postepu
```

## Mapa i Fog of Discovery

`MapView.tsx` utrzymuje MapLibre, a `MapHud.tsx` obsluguje warstwy i przyciski. Mgla jest rysowana na Canvas. Odkryte kafelki sa projektowane na ekran i wycinane operacja `destination-out`. Renderer adaptuje DPR i czestotliwosc animacji do urzadzenia.

## Synchronizacja gracza

```mermaid
flowchart LR
  LOCAL["Dane lokalne"] --> MERGE["mergeProgress"]
  CLOUD["player_progress"] --> MERGE
  MERGE --> SAVELOCAL["Zapis lokalny"]
  MERGE --> SAVECLOUD["Upsert Supabase"]
```

Tablice sa laczone po identyfikatorze, dystans wybiera maksimum, a XP jest ponownie przeliczane. Garaz laczy motocykle po `bike.id`.

## Misje miejskie

1. Aplikacja pobiera miasto i przypisane misje.
2. Telefon pobiera dokladna pozycje GPS.
3. Zdjecie wymaganej misji trafia do prywatnego Storage.
4. Edge Function sprawdza uzytkownika, odleglosc i sciezke pliku.
5. Supabase zapisuje zaliczenie, a aplikacja przyznaje XP.

## Ranking

`mq_real_player_leaderboard` laczy `auth.users`, `profiles` i `player_progress`, odrzuca konta anonimowe i sortuje po liczbie kafelkow. UI przelicza kafelki na km2.

## PWA i Android

- Next PWA generuje Service Worker.
- Safe area obsluguje ekrany iPhone i Android.
- Capacitor opakowuje PWA jako Android APK.
- Android dodaje tracker w tle i Picture in Picture.

## Zasady zmian

- Nie zmieniac kluczy `mq_*` bez migracji lokalnych danych.
- Zmiany `player_progress` musza zachowac merge wielu urzadzen.
- Zmiany MapLibre sprawdzac razem z mgla i sledzeniem.
- Zmiany misji musza uwzgledniac RLS, Storage i Edge Function.
- Po wiekszej zmianie aktualizowac wszystkie dokumenty w `docs/`.

