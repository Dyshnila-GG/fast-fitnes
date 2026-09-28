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
npx expo-doctor    # зависимости и конфиг
```

## Структура

```
src/app/            экраны (Expo Router): (tabs)/index — тренировки, (tabs)/metrics — метрики, workout — активная тренировка
src/data/program.ts программа A/B/C (21 упражнение, по 1–2 варианта)
src/logic/          расчёты: сессия, расписание, округление весов, форматирование
src/store/          состояние приложения, сохранение в AsyncStorage
src/components/     общие UI-компоненты
```

Данные хранятся только на телефоне (AsyncStorage).
