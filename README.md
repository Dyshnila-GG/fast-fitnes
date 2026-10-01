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
npm test           # юнит-тесты (рекорды и вес по самочувствию, разминка, пропуски, завершение, перенос, метрики, еда, главная: сон, неделя, пробежки, экспорт/импорт)
npx expo-doctor    # зависимости и конфиг
```

## Структура

```
src/app/            экраны (Expo Router): вкладки (tabs)/index — главная (плитки), workouts — тренировки, food — еда, profile — профиль;
                    workout — активная тренировка, summary — итог; meal — блюдо, food-swap — замена блюда, food-settings — время приёмов;
                    модалки с «Главной»: weight-add, sleep-edit, run-edit, workout-preview; sleep, runs — списки;
                    personal, weight, measurements, history/, progress, data — разделы «Профиля»
src/data/program.ts программа Вт/Чт/Сб (20 упражнений, по 1–2 варианта); legacy.ts — старая A/B/C (только для истории)
src/data/food.ts    блюда (граммы, ккал, белок, шаги), расписание «День зала» / «Обычный день» / Вс, нормы заготовки;
                    foodImages.ts — ссылки на фото блюд
src/logic/          расчёты: сессия и секундомеры разминки, рекорды и вес «сегодня» (SPEC §5), тоннаж, метрики и экспорт/импорт, еда (food.ts),
                    «Главная» (home.ts), сон и пробежки (sleep.ts), даты и время, расписание, округление весов, форматирование; тесты — src/logic/__tests__
src/store/          состояние приложения, сохранение в AsyncStorage, перенос данных v1 → v2 (migrate.ts)
src/components/     общие UI-компоненты (Icon — иконки MaterialCommunityIcons, TimeField — выбор времени); home/ — плитка, кольцо, точечный календарь;
                    workout/ — блоки экрана тренировки и предпросмотр, summary/ — блоки итога, food/ — карточка приёма и картинка блюда,
                    charts/ — линейный график (react-native-svg), form — поля и списки метрик
src/hooks/          общие хуки (useNow — тик таймеров)
```

Данные хранятся только на телефоне (AsyncStorage). Резервная копия: «Профиль» → «Экспорт / импорт» (JSON через «Поделиться», восстановление — вставить JSON).

## Фото блюд

Фото загружаются по ссылке и кэшируются на телефоне (как GIF упражнений). Ссылки — в `src/data/foodImages.ts`.
Если ссылка не загрузилась (2 повтора) — тёмная заглушка с серой иконкой.
Своё фото важнее ссылки: экран блюда → тап по картинке → «Сфотографировать» / «Из галереи».

Фото — Flickr, лицензии Creative Commons ([CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/)):

| id | Блюдо | Автор | Лицензия | Источник |
|---|---|---|---|---|
| `granola` | Мюсли с молоком и бананом | joyosity | CC BY 2.0 | https://www.flickr.com/photos/33993074@N00/3566981596 |
| `shake` | Шоколадный коктейль | EasyHealthySmoothie | CC BY 2.0 | https://www.flickr.com/photos/150788323@N04/33941875343 |
| `yogurt` | Йогурт | grongar | CC BY 2.0 | https://www.flickr.com/photos/70757891@N00/5537372504 |
| `eggs` | Яичница | avlxyz | CC BY-SA 2.0 | https://www.flickr.com/photos/10559879@N00/2409085893 |
| `bacon_sandwich` | Бутерброды с беконом | fancycwabs | CC BY-SA 2.0 | https://www.flickr.com/photos/36818084@N00/3389649469 |
| `meat_sandwich` | Сэндвич с мясом | uwenna | CC BY-SA 2.0 | https://www.flickr.com/photos/40647380@N06/3866395618 |
| `pasta` | Паста с фаршем | Lachlan Hardy | CC BY 2.0 | https://www.flickr.com/photos/98983159@N00/2516258656 |
| `chicken_rice` | Курица с рисом и салатом | kawanet | CC BY 2.0 | https://www.flickr.com/photos/50902562@N00/2597505789 |
| `salmon_rice` | Лосось с рисом и салатом | Vrysxy | CC BY 2.0 | https://www.flickr.com/photos/9013832@N03/3299328084 |
