# 1.4 - Android map performance fix - 2026-06-23

- Zoptymalizowano ekran mapy pod slabsze telefony Android, w tym Huawei P20 Lite.
- Usunieto niewidoczne warstwy MapLibre tworzone dla kazdego odkrytego kafelka.
- Ograniczono przeliczanie Fog of Discovery do widocznego obszaru mapy i zmniejszono koszt canvas fog na low-end Android.

# 1.4 - TASK-013 Android background GPS prep - 2026-06-23

- Przygotowano plan fizycznego testu Android background GPS dla APK/Capacitor.
- Udokumentowano ograniczenie iPhone PWA background tracking: po zablokowaniu ekranu iOS moze wstrzymac aplikacje.
- Dodano zalecenie UX, aby na iPhone PWA odkrywac z aktywnym ekranem.
# 1.4 - TASK-012 iPhone GPS/map pretest - 2026-06-23

- Fizyczny test iPhone PWA potwierdzil stabilna mape, gesty, centrowanie, marker i HUD.
- Spowolniono dryf Fog of Discovery po tescie jazdy.
- Udokumentowano ograniczenie iOS PWA: aplikacja nie odkrywa przejazdu przy zablokowanym ekranie, bo system wstrzymuje web/PWA w tle.

# 1.4 - Smoke test iPhone PWA - 2026-06-23

- Mobile UI Fix Pack smoke test na iPhone zakonczony pozytywnie. Przygotowano kolejny etap testow mapy, mgly i GPS.
# Changelog MotoQuest

# 1.4 - UI Premium Achievements & Ranking - 2026-06-20

- Przebudowano wizualnie osiagniecia, specjalne odznaki, mape Polski i ranking graczy.
- Dodano bardziej czytelne karty progresu, prestizowe badge cards, premium leaderboard oraz odswiezony panel wojewodztw z herbami.
- Zachowano dotychczasowa logike XP, filtrow osiagniec, rankingu RPC i postepu wojewodztw.

# 1.4 - UI Premium Garage - 2026-06-20

- Przebudowano wizualnie garaz motocykli i panel aktywnego motocykla w stylu premium.
- Dodano wyrazniejsze karty maszyn, nowy pusty stan oraz bardziej czytelny formularz dodawania motocykla ze zdjeciem.
- Zachowano dotychczasowa logike dodawania, wyboru aktywnego motocykla, uploadu zdjec i synchronizacji.

# 1.4 - UI Premium Profile - 2026-06-20

- Przebudowano wizualnie profil gracza, pasek XP, odznaki specjalne, status chmury i ustawienia.
- Profil pokazuje teraz premium dashboard z aktywnym motocyklem, ostatnia aktywnoscia i skrotami do kluczowych zakladek.
- Zachowano dotychczasowa logike synchronizacji, avatara, nicku, danych XP i ustawien konta.

## 1.4 - UI Premium Auth - 2026-06-20

- Przebudowano wizualnie logowanie, rejestracje i reset hasla.
- Dodano glassmorphism, mocniejszy branding MQ i motocyklowy klimat adventure.
- Poprawiono safe area, zachowanie z klawiatura mobilna oraz stany loading, disabled i error.
- Poprawiono przewijanie rejestracji i widocznosc przycisku Apple na niskich ekranach.
- Zachowano dotychczasowa logike Supabase Auth, OAuth, resetu hasla i sesji.

## 1.4 - 2026-06-20

- Ranking prawdziwych graczy wedlug odkrytego obszaru.
- Osobna zakladka Wyprawy i dzialajace filtry.
- 80 miast, po 5 na wojewodztwo, oraz nowe misje i ikony.
- Zwijane panele osiagniec i mapa Polski z herbami.
- Funkcjonalny panel warstw mapy.
- Plynniejszy znacznik GPS, obrot mapy i adaptacyjna mgla.

## 1.3 - 2026-06-20

- Zapamietanie konta, ustawienia w profilu i zmiana nicku.
- Synchronizacja garazu i aktywnego motocykla.
- Dzialajace filtry osiagniec i ostatnia miejscowosc.

## 1.2 - 2026-06-19

- Nowe logowanie, rejestracja, profil i reset hasla.
- Weryfikacja misji przez GPS bez OpenAI.

## 1.1 - 2026-06-18

- Android background GPS, Picture in Picture i misje miejskie V5.

## 1.0 - 2026-06-18

- Pierwsze instalowalne APK MotoQuest.

## 1.4 - Mobile UI Fix Pack
- Naprawiono safe area i status bar na iPhone.
- Poprawiono spacing nad headerem i pod dolna nawigacja.
- Zmniejszono typografie i wysokosci kart na mobile.
- Poprawiono odznaki specjalne, ikony i karty osiagniec.
- Poprawiono badge wypraw oraz responsywnosc kart.
- Dopracowano MapHud bez zmiany MapView, GPS i Fog of Discovery.
