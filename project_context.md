# project_context.md

**Проект:** infolake / lake_grok  
**Тип:** Веб-приложение электронной разведывательной сводки (карта + формуляры объектов + события).  
**Стек:** Django 5.2 + DRF + PostgreSQL (backend) | Vite + React 18 + Leaflet + axios (frontend)  
**Дата анализа:** 2026 (текущий код)

---

## Инструкция для агентов (ОБЯЗАТЕЛЬНО К ИСПОЛНЕНИЮ)

**Правило работы с этим файлом (высший приоритет):**

- **Теперь используй ТОЛЬКО `project_context.md`** для всей дальнейшей работы по проекту.
- Если информации недостаточно — **сначала обнови этот файл** (добавь недостающие разделы, детали, связи, эндпоинты, модели, бизнес-логику и т.д.), **а не читай весь проект** заново.
- Запрещено использовать инструменты для чтения/поиска исходного кода (list_dir, read_file, grep и т.п. по файлам проекта), пока не будет обновлён данный контекст.
- После обновления контекста продолжай работу исключительно на его основе.

---

## 1. Архитектура проекта

### Основные модули / приложения

**Backend (Django project: `infolake`)**

- `infolake/` — корень проекта
  - `settings.py` — DRF, CORS_ALLOW_ALL, PostgreSQL (через django-environ), MEDIA/STATIC, русский язык.
  - `urls.py` — `/admin/`, `/api/v1/` → `api.urls`.
  - `enums.py` — `BaseEnum` (для choices).
- `formular/` — **основное приложение данных и админки**
  - Модели, admin (очень кастомный), inlines, forms/widgets (ColorRadioSelect), enums, validators (SVG).
- `api/` — **DRF слой**
  - ViewSets + custom APIView, serializers (вложенные + write/create логика).
- `manage.py`, `markers/` (примеры). Директория `media/` полностью игнорируется в .gitignore (загруженные файлы и ассеты не попадают в репозиторий).

**Frontend (Vite + React)**

- `src/` — основная логика UI.
  - `config/api.js` — единая `API_URL` (env или дефолт `http://172.16.80.207:8000`).
  - `components/Formular/Formular.jsx` — **главный оркестратор** (табы Objects/Events, фильтры, таблица, модалы, загрузка данных, состояние selected/hovered/measure/action-radius).
  - `components/MapComponent/` — карта Leaflet + кластеризация + события + инструменты (измерения, зоны действия, рисование событий).
  - **Загрузка тайлов базовой карты** (обновлено для TileServer GL + MBTiles):
    - Используется стандартный компонент `<TileLayer>` из `react-leaflet`.
    - **Конфигурация** (в MapComponent.jsx):
      ```jsx
      <TileLayer
          url="/tiles/{z}/{x}/{y}.png"
          minZoom={1}
          maxZoom={14}
      />
      ```
    - URL остаётся `/tiles/{z}/{x}/{y}.png` (для совместимости).
    - **Новая архитектура (offline)**:
      - Тайлы теперь предоставляются **TileServer GL** из файла `main.mbtiles`.
      - TileServer GL запускается через `docker-compose.yml` (сервис `tileserver` на порту 8080).
      - Во время разработки (`npm run dev`) Vite проксирует `/tiles/*` → `http://localhost:8080/styles/basic/rendered/*` (см. `frontend/vite.config.js`).
      - Для продакшн-сборки требуется либо reverse-proxy (nginx/traefik), либо изменение URL на полный (`http://localhost:8080/styles/basic/rendered/{z}/{x}/{y}.png`).
    - Используемый стиль рендеринга: `basic` (минимальный стиль в `tileserver/styles/basic.json`).
    - Данные: `tiles/main.mbtiles` (монтируется в контейнер).
    - Зумы: 1–14 полностью поддерживаются:
      - `MapContainer`: minZoom={1} maxZoom={14}
      - `TileLayer`: minZoom={1} maxZoom={14}
      - В `tileserver/config.json` tilejson: minzoom:1, maxzoom:14
    - Поддержка зума от 1 до 14.
    - `attribution` отсутствует (можно добавить позже).
    - Полностью работает без интернета при наличии локального `main.mbtiles` и запущенного tileserver.

**Как запустить (и устранение типичных ошибок):**
1. Положи файл `main.mbtiles` в папку `tiles/main.mbtiles`.
2. Убедись, что существуют директории:
   - `tileserver/fonts/` (с .gitkeep)
   - `tileserver/styles/` (с basic.json)
3. `docker-compose down` (чтобы убить старый контейнер)
4. `docker-compose up -d tileserver`
5. В другом терминале: `cd frontend && npm run dev`
6. Карта должна работать полностью локально.

**Исправленные ошибки:**
- "The specified path for "fonts" does not exist (/config/fonts)" → убрана относительная ссылка, добавлен явный mount `./tileserver/fonts:/fonts` и `"fonts": "/fonts"` в config.
- Добавлен `TILESERVER_GL_ALLOWED_HOSTS=*` чтобы убрать security warning (для локальной разработки).
- Пути в config сделаны абсолютными где нужно (`/styles`, `/data`, `/fonts`).

Если mbtiles отсутствует — сервер запустится, но тайлы не будут отдаваться (проверь логи на "main.mbtiles").
  - Модалы: Add/Edit Target, Formular (view + editor bulk), Events (Add/Edit), Country info.
  - Таблицы: ObjectsTable, EventsTable, IntersectionTable.
  - Утилиты: clustering (markerClusteringUtils), circle intersections, SVG processing, marker filters.
- `public/` — статика (sprite.svg, leaflet icons, geo/custom.geo.json для границ стран).
- `tiles/` — данные для тайлов (main.mbtiles). Игнорируется в git (кроме .gitkeep). Монтируется в TileServer GL.
- `index.html` (корень frontend).

**Связи между слоями**

- Admin (`/admin/`) — основной ввод/редактирование справочников, объектов, формуляров (inlines), маркеров (рендер SVG превью).
- DRF API (`/api/v1/`) — читает/пишет для фронта (все `permission_classes = [AllowAny]`).
- Frontend не использует Django templates/views (кроме статики/media). Полностью SPA + API. Formular.jsx — центральное состояние + fetch.
- Данные: Targets + вложенные actions → карта + таблица. Events (с JSON shape) → оверлеи на карте. Formular/CountryInfo + attachments → модальные редакторы/просмотр.
- Кластеризация и расчёты (пересечения зон, измерения) — клиент-side.
- GeoJSON стран — статический файл во фронте (клик по стране → CountryModal).

Нет отдельного `services/` или `managers/`. Бизнес-логика распределена:
- Backend: admin (prefetch, custom display, inlines), DRF (custom create/update для actions, bulk formular, фильтры событий).
- Frontend: Formular (fetch + state + handlers), Map + clustering utils, circleIntersection, модалы (CRUD + bulk + attachments).

---

## 2. Модели данных (`formular/models.py`)

Все модели в `formular`. UUID PK на ключевых сущностях (Target, Event, Attachments).

### Справочники / иерархии

- **Country**
  - `title` (unique), `title_short`, `iso_code`, `color` (Choices из Colors: blue/green/red/yellow/marine)
  - Индексы: title, title_short.

- **CountrySections** (иерархические разделы инфо по стране)
  - `title`, `order`, `parent` (self FK, related='children'), `is_hidden`
  - clean: не может быть родителем себя.

- **FormularSections** (иерархические разделы формуляра объекта)
  - Аналогично CountrySections + `is_hidden` (для формуляра).

- **ActionType**
  - `title`, `animation` (ActionAnimations: GRADIENT/RADAR/WAVE/PULSE/RINGS/SECTOR/ALERT/DASHED_ROTATE).

- **TargetType** — `title` (тип объекта разведки).

- **EventType** — `title`.

- **Marker** (флаги/маркеры объектов)
  - `title`, `path` (FileField → media/markers, validate_svg), `top/width/height` (%), `scale` (0.1-1), `order`, `is_flag` (bool, default True).
  - ordering: order, title.

- **EventMarker** — `title`, `path` (validate_svg, media/event_markers).

### Основные сущности

- **Target** (объект разведки, UUID PK)
  - `country` (FK Country, related='contries' — опечатка в коде), `title`, `label`, `marker` (FK Marker, SET_NULL), `type` (FK TargetType, SET_NULL)
  - `action_radius` (float, >=0), `lat`, `lng`
  - Индексы: title, label.
  - Связи: `actions` (reverse TargetAction).

- **TargetAction**
  - `target` (FK Target, related='actions', CASCADE), `action_type` (FK ActionType, SET_NULL), `radius` (>=0).

- **Event** (UUID PK)
  - `title`, `object_name`, `description`, `event_type` (FK EventType, SET_NULL), `country` (FK, SET_NULL, related='events')
  - `marker` (FK EventMarker, SET_NULL, related='events')
  - `date_start/end`, `time_start/end`, `color` (#hex), `shape` (JSONField: point/circle/area с geometry)
  - `created_at`, `updated_at`
  - Индексы: date_*, country.

- **Formular** (пункты формуляра объекта, UUID PK)
  - `target` (FK Target, CASCADE), `section` (FK FormularSections), `content` (Text)
  - Уникальность по (target, section) через update_or_create в API.

- **CountryInfo**
  - `country` (FK, related='country_infos'), `section` (FK CountrySections), `content` (Text, null/blank).

- **Attachments** (UUID PK)
  - **CountryAttachment**: `country`, `section` (CountrySections), `title`, `description`, `image` (ImageField, media/country_attachments), `created_at`
  - **FormularAttachment**: `target`, `section` (FormularSections), `title`, `description`, `image` (media/formular_attachments), `created_at`

**Отношения (ключевые)**

- Country 1--* Target, 1--* CountryInfo, 1--* CountryAttachment, 1--* Event
- Target 1--* TargetAction, 1--* Formular, 1--* FormularAttachment
- CountrySections 1--* CountryInfo / CountryAttachment (и self parent/children)
- FormularSections 1--* Formular / FormularAttachment (self parent)
- Target -- Marker (многие объекты могут ссылаться на один маркер)
- Event -- EventMarker / EventType / Country

---

## 3. Бизнес-логика

**Где находится:**

- **Backend (formular/):**
  - `admin.py` + `admin_inlines.py` — кастомная админка (raw_id, list_editable, prefetch/select_related, SVG превью с уникализацией id/gradients в MarkerAdmin, color_display, inlines для Target/Country).
  - `validators.py` — только validate_svg (расширение + mime).
  - `forms.py` + `widgets.py` — CountryForm + ColorRadioSelect (безопасный HTML label).
  - `enums.py` — Colors (BaseEnum) + ActionAnimations (TextChoices).

- **Backend (api/):**
  - `views.py` — ViewSets (ReadOnly для справочников, full CRUD для Target/CountryInfo/CountryAttachment/FormularAttachment/Event + custom логика).
  - Специальные: Target create/update с вложенными actions (удаление старых + создание), FormularBulkUpdateView (update_or_create), Event фильтрация по датам/времени/странам/типам/title (сложный Q), CountryInfoView (по iso_code), FormularView (по target_id).
  - `serializers.py` — вложенные read (Country+Marker+Actions), отдельные write (TargetCreateSerializer с actions, EventWrite, FormularBulkUpdateSerializer, CountryInfoWrite).

- **Frontend:**
  - `Formular.jsx` — главный контейнер: fetch всех списков + events с фильтрами, мемоизация filteredObjects, обработчики CRUD (add/edit/delete target/event, bulk formular), состояние инструментов (measure, action radius, intersections, fullscreen, tabs).
  - `MapComponent.jsx` + `MapUtils.jsx` + `markerClusteringUtils.js` + `NonFlagMarkerUtils.jsx` — рендер карты, кластеризация (по country + order → вертикальные оффсеты в кластерах близких флагов), non-flag группировка в круги при hover, рисование событий (point/circle/polygon), GeoJSON стран, measure (Ctrl+click), action radius (анимации + intersections), event shapes (хранятся как JSON).
  - **Загрузка тайлов**: детали не задокументированы в project_context.md (см. раздел Архитектура → MapComponent).
  - Модалы + Editor: AddTargetModal/EditTargetModal (с хуками useTargetFormData/useActionsArray/useDropdownWithSearch), FormularEditor (bulk по sections + attachments upload/delete), FormularModal (просмотр), CountryModal/EditCountryModal (info + attachments), AddEventModal.
  - `utils/`: circleIntersection.js (геометрия пересечений зон действия), svgUtils.js (enrichSvg с уникализацией id/gradients + цветовой класс, getViewBoxSize, addColorClassToSvg), markerFilters.js (isFlag/isNonFlag + фильтры по selected).
  - `hooks/`: useTargetFormData, useActionsArray, useDropdownWithSearch.
  - `constants/mapConstants.js`: ICON_WIDTH/HEIGHT, MAX_DISTANCE_PX.
  - `circleIntersection.js` используется в Formular для selected объектов при showActionRadius.

**Что делает (ключевые процессы):**

- Добавление/редактирование Target: страна + маркер (флаг) + тип + coords + actions (несколько радиусов) + сразу bulk-формуляр.
- Кластеризация маркеров: только is_flag=true → группировка по стране → сортировка по order → близкие (<~1см/38px на карте) собираются в кластер → вертикальные оффсеты (overlap 80%) с base = самый приоритетный.
- Non-flag маркеры: группируются аналогично, при полном выборе группы — одна иконка + круг при hover/pin.
- Зоны действия: TargetAction → Circle + ActionRadiusAnimation (по типу), пересечения только одинаковых actionTitle → точки пересечения (выделяемые).
- События: draw на карте (context menu alt+click для старта) → shape JSON сохранён в Event, рендер как Circle/Polygon/Marker + popup + фильтры дат/времени/стран/типов.
- Формуляр: иерархические sections → bulk POST /bulk/ (section_id + content), attachments per section/target.
- Аналогично для CountryInfo.

Нет фоновых задач, Celery и т.п. Всё синхронно.

---

## 4. API слой (DRF)

**Базовый путь:** `/api/v1/`

**Роутер (DefaultRouter) + дополнительные пути** (api/urls.py):

**ViewSets (router):**
- `targets/` — TargetViewSet (ModelViewSet, custom serializer для create/update с actions)
- `countries/` — CountryViewSet (полный CRUD, ListSerializer)
- `markers/`, `event-markers/` — ReadOnly
- `action-types/`, `target-types/` — ReadOnly
- `event-types/` — полный ModelViewSet
- `events/` — EventViewSet (фильтры query params: date_from/to, time_*, countries=1,2, event_types=..., title)
- `country-sections/`, `formular-sections/` — ReadOnly (ListSerializer с parent)
- `country-infos/`, `country-attachments/`, `formular-attachments/` — ModelViewSet + фильтр по ?country= / ?target= / ?section=

**Отдельные endpoints:**
- `GET country/<iso_code>/` — CountryInfoView (список CountryInfo + sections для страны)
- `GET formular/<uuid:target_id>/` — FormularView (список Formular + sections)
- `POST formular/<uuid:target_id>/bulk/` — FormularBulkUpdateView (массив {section_id, content})

**Serializers (api/serializers.py):**
- Read: вложенные (Target включает Country/Marker/Actions/ActionType/Type; Event включает Country/EventMarker/EventType и т.д.)
- Write: отдельные (TargetCreateSerializer создаёт Target + TargetActions; EventWrite без read-only nested; CountryInfoWrite; bulk Formular).
- Простые List для справочников.

**Permissions:** Везде `AllowAny`. Нет аутентификации/авторизации.

**Особенности:**
- При update Target — delete всех старых actions + recreate.
- Bulk formular — update_or_create.
- Сложная фильтрация событий (диапазоны дат с учётом null end и т.д.).
- Attachments фильтруются query params.

---

## 5. Важные утилиты и вспомогательные модули

**Backend:**
- `formular/validators.py`: validate_svg (только .svg + mime image/svg+xml).
- `formular/widgets.py`: ColorRadioSelect (HTML-безопасные цветные радиокнопки).
- `infolake/enums.py`: BaseEnum.choices() для CharField choices.
- Кастомные queryset в Admin (select_related/prefetch_related для производительности).

**Frontend:**
- `config/api.js`: единая точка API_URL.
- `utils/svgUtils.js`: enrichSvg (уникализация gradient id, цветовой класс icon__*, viewBox размеры, очистка width/height), getViewBoxSize, addColorClassToSvg.
- `utils/markerFilters.js`: isFlagMarker / isNonFlagMarker / filter* (учитывает undefined как flag).
- `utils/circleIntersection.js`: calculateCircleIntersections (гавасинус + упрощённая геометрия), findAllIntersections (только одинаковые actionTitle, возвращает точки + метки объектов).
- `constants/mapConstants.js`: размеры иконок.
- `hooks/useTargetFormData.js`: Promise.all справочников + загрузка SVG маркеров.
- `hooks/useActionsArray.js`, `useDropdownWithSearch.js`.
- `components/MapComponent/markerClusteringUtils.js`: groupByCountryAndFilter, sortByOrder, latLngToPixel, findNearbyObjects, createClusters, calculate/applyClusterOffsets, processMarkerClustering (основная), processNonFlagClustering, getGroupCirclePositions.
- `MapUtils.jsx` / `NonFlagMarkerUtils.jsx`: генерация L.DivIcon с обогащённым SVG + label, расчёт позиций с offsetY, кэш SVG.
- `circleIntersection.js` (исп. в Formular для intersections).
- `data/objects.js`: устаревший статический массив (fallback, сейчас не основной).
- Geo: `/geo/custom.geo.json` (границы стран, обработка onEachCountry + клик с alt/ctrl guards).
- **Tile loading**: Информация о загрузке растровых тайлов базовой карты (TileLayer) в project_context.md отсутствует. Известно использование Leaflet/react-leaflet, но провайдер тайлов, URL и настройки не описаны.

**Другие:**
- Frontend clustering docs (CLUSTERING_*.md, INTEGRATION_GUIDE.md, IMPLEMENTATION_SUMMARY.md) — описывают алгоритм.
- Admin CSS: `formular/static/admin/css/marker*.css`.
- События: рендер shape (point/circle/area) + маркер + popup; buildEventShape в Formular.jsx.

---

## 6. Карта файлов (путь → назначение, компактно)

**Backend root**
- `backend/manage.py` — стандартный.
- `backend/requirements.txt` — Django/DRF/psycopg2/pillow/django-environ/corsheaders.
- `backend/infolake/settings.py` — конфиг (DB, CORS all, REST, media).
- `backend/infolake/urls.py` — admin + api/v1 include.
- `backend/infolake/enums.py` — BaseEnum.
- `backend/infolake/{asgi,wsgi}.py` — стандарт.

**formular (данные + админ)**
- `formular/models.py` — **все модели** (см. раздел 2).
- `formular/admin.py` — регистрации + кастом (MarkerAdmin svg_thumbnail, get_queryset prefetch, Country color и т.д.).
- `formular/admin_inlines.py` — TargetInline*, TargetActionInline, CountryInfoInline, FormularInline.
- `formular/forms.py` — CountryForm (с ColorRadioSelect).
- `formular/widgets.py` — ColorRadioSelect.
- `formular/enums.py` — Colors (BaseEnum) + ActionAnimations.
- `formular/validators.py` — validate_svg.
- `formular/views.py` — пустой (логика в admin/api).
- `formular/apps.py` — стандарт.
- `migrations/` — 27 миграций (эволюция моделей + merge).

**api (DRF)**
- `api/urls.py` — router + 3 custom path (country/<iso>, formular/<id>, /bulk).
- `api/views.py` — все ViewSet + CountryInfoView, FormularView, FormularBulkUpdateView, Event фильтрация.
- `api/serializers.py` — ~20 сериализаторов (read nested / write custom + bulk).
- `api/apps.py`, `tests.py` — стандарт.

**Frontend root**
- `frontend/package.json` — react, axios, leaflet, react-leaflet, react-leaflet-cluster, react-router-dom.
- `frontend/vite.config.js` — простой react plugin.
- `frontend/index.html` — entry.
- `frontend/INTEGRATION_GUIDE.md`, `IMPLEMENTATION_SUMMARY.md`, `CLUSTERING_*.md` — доки по интеграции/кластеризации.

**Frontend src/**
- `src/main.jsx`, `App.jsx` (минимальный; реальный UI в Formular), `App.css`, `index.css`.
- `src/config/api.js` — API_URL.
- `src/constants/mapConstants.js`.
- `src/data/objects.js` — статический fallback.
- `src/hooks/` — useTargetFormData, useActionsArray, useDropdownWithSearch (+ summary md).
- `src/utils/` — svgUtils.js, markerFilters.js, circleIntersection.js.
- `src/components/`:
  - `Formular/Formular.jsx` + .css — **главный компонент** (state, fetch, tabs, filters, modals orchestration).
  - `MapComponent/MapComponent.jsx` (большой) + MapUtils.jsx + markerClusteringUtils.js + NonFlagMarkerUtils.jsx + ActionRadius* + clusteringExamples.js.
  - `ObjectsTable/ObjectsTable.jsx`.
  - `Events/` — EventsTable, EventsFilterPanel, AddEventModal.
  - `FormularModal/`, `FormularEditor/` (bulk редактор + attachments).
  - `AddTargetModal/`, `EditTargetModal/`.
  - `CountryModal/`, `EditCountryModal/`, `EditCountryInfoModal/` (частично).
  - `FilterPanel/`, `FilterForm/`, `Features/` (measure + intersections sidebar), `IntersectionTable/`.
  - `Header/`, `Footer/`, `Sidebar.jsx` (legacy/не основной).
- `public/` (фронт) — sprite.svg, leaflet/, geo/custom.geo.json, images.

**tileserver/ (TileServer GL конфигурация — попадает в git)**
- `tileserver/config.json` — основная конфигурация (пути, стили, данные).
- `tileserver/styles/basic.json` — минимальный стиль рендеринга растровых тайлов.
- `tileserver/fonts/` — директория для шрифтов (с .gitkeep; реальные шрифты можно добавить позже).
- В корне tileserver/ и во всех подпапках есть файлы, которые попадут в git.
- Не попадают в git: `tiles/*.mbtiles` (большие данные тайлов).
- В .gitignore добавлены правила:
  ```
  !tileserver/
  !tileserver/**
  ```

**Media (runtime)**
- `backend/media/` — полностью игнорируется в .gitignore (не попадает в репозиторий). Содержит загруженные маркеры, иконки событий и пользовательские вложения.

**Другое**
- `backend/markers/` (пример 1DM.svg).
- `Значки/`, `Значки событий/` — исходные SVG иконок (вне кода, для импорта в media).
- `Данные.xlsx` — возможно источник данных.
- `tileserver/` — конфигурация TileServer GL (config.json, стили basic.json, fonts). Папка **должна попадать в git** (кроме данных mbtiles).
- `.gitignore` — подготовлен так, чтобы в репозиторий попадали файлы из `backend/` (кроме `.env*`) и `frontend/`. Полностью игнорируется `media/` (маркеры, иконки событий и все вложения не попадают в git). Явно разрешена папка `tileserver/` (конфиги и стили версионируются). Игнорируются только `tiles/*.mbtiles`.

---

**Примечания для следующего агента:**
- **Важно:** Информация о том, как организована загрузка тайлов базовой карты (какой TileLayer используется, URL тайлов, attribution и т.д.), в project_context.md **отсутствует**. Если требуется анализ или изменение загрузки тайлов — сначала обнови этот файл, добавив соответствующий раздел.
- Всё API открыто (AllowAny). Добавление auth потребует изменений в permissions + возможно JWT.
- Кластеризация жёстко завязана на `marker.is_flag`, `order`, `scale`, `country.title` и пиксельные расчёты через map.latLngToLayerPoint.
- Формуляр и CountryInfo — контент + attachments отдельно (bulk + файловые аплоады).
- События используют JSON shape (не GeoDjango).
- При изменениях моделей — миграции + обновление сериализаторов/модалов/хуков.
- Frontend state в Formular.jsx (не Redux/Context глобально). Много useMemo/useEffect для фильтров, intersections, кластеров.
- SVG обработка критична (уникализация id gradients при множестве одинаковых маркеров).
- `.gitignore` создан с фокусом на backend (без .env) + frontend. Полностью игнорируется директория `media/`. 
  - `tileserver/` (конфигурация TileServer GL + стили) — **явно разрешена** в git с помощью `!tileserver/` и `!tileserver/**/*`.
  - Игнорируются только `tiles/*.mbtiles` (данные).
  При добавлении новых директорий обновляй `.gitignore` и этот раздел контекста.

Файл создан как единый компактный справочник. Дубли кода и длинные фрагменты исключены.
