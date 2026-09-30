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
npm test           # юнит-тесты (рекорды и вес по самочувствию, разминка, пропуски, завершение, перенос, метрики, экспорт/импорт)
npx expo-doctor    # зависимости и конфиг
```

## Структура

```
src/app/            экраны (Expo Router): (tabs)/index — тренировки, (tabs)/metrics — метрики, workout — активная тренировка, summary — итог;
                    weight, measurements, history/, progress, profile, data — разделы «Метрик»
src/data/program.ts программа Вт/Чт/Сб (20 упражнений, по 1–2 варианта); legacy.ts — старая A/B/C (только для истории)
src/logic/          расчёты: сессия и секундомеры разминки, рекорды и вес «сегодня» (SPEC §5), тоннаж, метрики и экспорт/импорт, расписание, округление весов, форматирование; тесты — src/logic/__tests__
src/store/          состояние приложения, сохранение в AsyncStorage, перенос данных v1 → v2 (migrate.ts)
src/components/     общие UI-компоненты; workout/ — блоки экрана тренировки, summary/ — блоки итога,
                    charts/ — линейный график (react-native-svg), form — поля и списки метрик
src/hooks/          общие хуки (useNow — тик таймеров)
```

Данные хранятся только на телефоне (AsyncStorage). Резервная копия: «Метрики» → «Экспорт / импорт» (JSON через «Поделиться», восстановление — вставить JSON).
