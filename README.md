# TOCHKA Fitness

Личное приложение для тренировок (Expo + React Native + TypeScript). Спецификация — [SPEC.md](SPEC.md).

## Запуск в Expo Go

Нужны Node.js 20+ и приложение **Expo Go** (SDK 57) на телефоне.

```bash
npm install
npx expo start            # телефон и компьютер в одной Wi‑Fi сети
npx expo start --tunnel   # если в одной сети не подключается
```

Отсканируйте QR-код: iOS — камерой, Android — из Expo Go.

Название «TOCHKA Fitness», иконка и заставка видны в собранном приложении (`npx eas-cli@latest build -p android`); в Expo Go показывается его собственная иконка.

## Установка на Android (APK)

APK собирается автоматически при каждом пуше в `main` (или вручную: **Actions → Android APK → Run workflow**).

1. На телефоне откройте репозиторий на github.com (нужно войти в аккаунт) → **Actions** → **Android APK**.
2. Выберите последний запуск с зелёной галочкой → внизу, в **Artifacts**, скачайте `TOCHKA-Fitness-<версия>-<номер>.apk`.
3. Откройте файл, разрешите браузеру «установку из неизвестных источников», установите.

Обновление — так же: новый APK ставится поверх, данные сохраняются (пакет `com.dyshnila.gymlog` и подпись проверяются при сборке). Файлы хранятся 30 дней.
Данные из Expo Go в APK не переносятся: перед переходом сделайте «Профиль» → «Экспорт / импорт» в Expo Go и импортируйте JSON в установленном приложении.

## Проверки

```bash
npx tsc --noEmit   # типы
npm test           # юнит-тесты (рекорды и вес по самочувствию, разминка, пропуски, завершение, корзина и откат рекорда, отчёт, бэкап, напоминания, перенос, метрики,
                   # еда: меню, расписание по дням, продукты на неделю, рецепты, фото; главная: календарь, сон, неделя; активная пробежка, экспорт/импорт;
                   # словари ru/en/uk, единицы lb/kg, ft/cm, mi/km, °F/°C)
npx expo-doctor    # зависимости и конфиг
```

## Структура

```
src/app/            экраны (Expo Router): вкладки (tabs)/index — главная (плитки), workouts — две плитки, food — еда, profile — профиль;
                    strength — силовые, run-start — пробежка; workout — активная тренировка, summary — итог, run — активная пробежка;
                    meal — приём, dish — блюдо, dish-edit — форма блюда, menu — меню, slot-dishes — блюда приёма, food-swap — замена блюда,
                    food-settings — расписание по дням, products — продукты на неделю, recipe — рецепт блюда;
                    модалки с «Главной»: weight-add, sleep-edit, run-edit, workout-preview; sleep, runs — списки;
                    personal, weight, measurements, history/, progress, data, trash, backup, reminders, app-settings — разделы «Профиля»
src/data/program.ts программа Вт/Чт/Сб (20 упражнений, по 1–2 варианта); legacy.ts — старая A/B/C (только для истории)
src/data/food.ts    стартовое меню (граммы, ккал, белок, шаги, продукты), справочник продуктов по разделам, стартовое расписание по дням
                    (своё меню и расписание хранятся в данных пользователя);
                    foodImages.ts — ссылки на фото блюд
src/logic/          расчёты: сессия и секундомеры разминки, рекорды и вес «сегодня» (SPEC §5), тоннаж, метрики и экспорт/импорт, еда (food.ts),
                    «Главная» и календарь (home.ts), сон и пробежки (sleep.ts), активная пробежка (run.ts), корзина (trash.ts), отчёт (report.ts),
                    бэкап (backup.ts), напоминания (reminders.ts), единицы (units.ts), даты и время, округление весов, форматирование; тесты — src/logic/__tests__
src/i18n/           словари ru.ts / en.ts / uk.ts, t('key'), числа и даты по языку; content.ts — перевод стандартного контента
src/services/       работа с системой: «Поделиться» отчётом, папка бэкапа (SAF) и автобэкап, локальные уведомления
scripts/            make-icons.mjs — рисует иконку, адаптивную иконку, заставку и favicon в assets/images
src/store/          состояние приложения, сохранение в AsyncStorage, перенос данных v1 → v2 (migrate.ts)
src/components/     общие UI-компоненты (Text — Manrope по весу, Icon — иконки MaterialCommunityIcons, TimeField — выбор времени, nav/BackButton); home/ — плитка, кольцо, календарь месяца;
                    workout/ — блоки экрана тренировки и предпросмотр, summary/ — блоки итога, history/ — удаление тренировки, food/ — карточка приёма и картинка блюда,
                    charts/ — линейный график (react-native-svg), form — поля и списки метрик
src/hooks/          общие хуки (useNow — тик таймеров)
```

Данные хранятся только на телефоне (AsyncStorage). Резервная копия: «Профиль» → «Бэкап» (Android: папка на телефоне, раз в неделю при открытии, хранятся последние 8; восстановление — из файла)
или «Профиль» → «Экспорт / импорт» (JSON через «Поделиться», восстановление — вставить JSON). Удалённые тренировки 30 дней лежат в «Корзине».

Язык (русский, English, українська) и единицы (имперские / метрические) — «Профиль» → «Настройки приложения». Данные всегда хранятся в lb, дюймах и милях.
Напоминания (сон, тренировка) — локальные уведомления (expo-notifications); иконку перерисовать: `node scripts/make-icons.mjs`.

## Фото блюд

Фото загружаются по ссылке и кэшируются на телефоне (как GIF упражнений). Ссылки — в `src/data/foodImages.ts`.
Если ссылка не загрузилась (2 повтора) — тёмная заглушка с серой иконкой.
Своё фото важнее ссылки: экран блюда → тап по картинке → «Сфотографировать» / «Из галереи».

Фото — Flickr, лицензии Creative Commons ([CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/)):

| id | Блюдо | Автор | Лицензия | Источник |
|---|---|---|---|---|
| `granola` | Мюсли с молоком и бананом | joyosity | CC BY 2.0 | https://www.flickr.com/photos/33993074@N00/3566981596 |
| `shake` | Шоколадный коктейль | BrittReneePhotography | CC BY-SA 2.0 | https://www.flickr.com/photos/36158105@N07/8420414521 |
| `yogurt` | Йогурт | grongar | CC BY 2.0 | https://www.flickr.com/photos/70757891@N00/5537372504 |
| `eggs` | Яичница | avlxyz | CC BY-SA 2.0 | https://www.flickr.com/photos/10559879@N00/2409085893 |
| `bacon_sandwich` | Бутерброды с беконом | fancycwabs | CC BY-SA 2.0 | https://www.flickr.com/photos/36818084@N00/3389649469 |
| `meat_sandwich` | Сэндвич с мясом | uwenna | CC BY-SA 2.0 | https://www.flickr.com/photos/40647380@N06/3866395618 |
| `pasta` | Паста с фаршем | Lachlan Hardy | CC BY 2.0 | https://www.flickr.com/photos/98983159@N00/2516258656 |
| `chicken_rice` | Курица с рисом и салатом | kawanet | CC BY 2.0 | https://www.flickr.com/photos/50902562@N00/2597505789 |
| `salmon_rice` | Лосось с рисом и салатом | Vrysxy | CC BY 2.0 | https://www.flickr.com/photos/9013832@N03/3299328084 |
