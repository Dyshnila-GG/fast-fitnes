# GymLog

Личное приложение для тренировок (Expo + React Native + TypeScript). Спецификация — [SPEC.md](SPEC.md).

## Запуск в Expo Go

Нужны Node.js 20+ и приложение **Expo Go** (SDK 57) на телефоне.

```bash
npm install
npx expo start            # телефон и компьютер в одной Wi‑Fi сети
npx expo start --tunnel   # если в одной сети не подключается
```

Отсканируйте QR-код: iOS — камерой, Android — из Expo Go.

## Проверки

```bash
npx tsc --noEmit   # типы
npm test           # юнит-тесты (прогрессия, пропуски, завершение)
npx expo-doctor    # зависимости и конфиг
```

## Структура

```
src/app/            экраны (Expo Router): (tabs)/index — тренировки, (tabs)/metrics — метрики, workout — активная тренировка, summary — итог
src/data/program.ts программа A/B/C (21 упражнение, по 1–2 варианта)
src/logic/          расчёты: сессия, прогрессия (SPEC §5), расписание, округление весов, форматирование; тесты — src/logic/__tests__
src/store/          состояние приложения, сохранение в AsyncStorage
src/components/     общие UI-компоненты; workout/ — блоки экрана тренировки, summary/ — блоки итога
src/hooks/          общие хуки (useNow — тик таймеров)
```

Данные хранятся только на телефоне (AsyncStorage).
