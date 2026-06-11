# project_context.md

**Проект:** infolake / lake_grok  
**Тип:** Веб-приложение электронной разведывательной сводки (карта + формуляры объектов + события).  
**Стек:** Django 6.0 + DRF + PostgreSQL (backend) | Vite + React 18 + Leaflet + axios (frontend)  
**Текущая ветка:** develop_tailserver (TileServer GL интеграция)  
**Дата анализа:** 2026 (актуализировано)  
**Дата последнего обновления контекста:** по запросу пользователя (соответствует текущему состоянию файловой структуры, версиям и статусу TileServer)

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

Весь backend-код находится в директории `backend/` (корень репозитория).

- `backend/infolake/` — Django project root
  - `settings.py` — DRF, `CORS_ALLOW_ALL_ORIGINS=True`, PostgreSQL (django-environ), `MEDIA_ROOT`/`MEDIA_URL`, русский язык (`ru-ru`), `DEBUG=True`, `ALLOWED_HOSTS=['*']`.
  - `urls.py` — `/admin/`, `/api/v1/` → `api.urls`.
  - `enums.py` — `BaseEnum` (для choices).
- `backend/formular/` — **основное приложение данных и админки**
  - Модели, admin (очень кастомный), inlines, forms/widgets (ColorRadioSelect), enums, validators (SVG).
- `backend/api/` — **DRF слой**
  - ViewSets + custom APIView, serializers (вложенные + write/create логика).
- `backend/manage.py`, `backend/requirements.txt`, `backend/markers/` (пример SVG).
- `backend/media/` — полностью игнорируется в .gitignore (загруженные файлы, маркеры, вложения).
- `backend/env/` — виртуальное окружение Python (не должно попадать в git).

**Frontend (Vite + React)**

- `src/` — основная логика UI.
  - `config/api.js` — единая `API_URL` (`import.meta.env.VITE_API_URL` или дефолт `http://172.16.80.207:8000`).
  - `components/Formular/Formular.jsx` — **главный оркестратор** (табы Objects/Events, фильтры, таблица, модалы, загрузка данных, состояние selected/hovered/measure/action-radius).
  - `components/MapComponent/` — карта Leaflet + кластеризация + события + инструменты (измерения, зоны действия, рисование событий).
  - Модалы: Add/Edit Target, Formular (view + editor bulk), Events (Add/Edit), Country info.
  - Таблицы: ObjectsTable, EventsTable, IntersectionTable.
  - Утилиты: clustering (markerClusteringUtils), circle intersections, SVG processing, marker filters.
- `public/` — статика (sprite.svg, leaflet icons, geo/custom.geo.json для границ стран).
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

**Другие:**
- Frontend clustering docs (CLUSTERING_*.md, INTEGRATION_GUIDE.md, IMPLEMENTATION_SUMMARY.md) — описывают алгоритм.
- Admin CSS: `formular/static/admin/css/marker*.css`.
- События: рендер shape (point/circle/area) + маркер + popup; buildEventShape в Formular.jsx.

---

## 6. Карта файлов (путь → назначение, компактно)

**Backend root**
- `backend/manage.py` — стандартный.
- `backend/requirements.txt` — Django 6.0.6, djangorestframework, psycopg2-binary, pillow, django-environ, django-cors-headers.
- `backend/infolake/settings.py` — конфиг (PostgreSQL, CORS_ALLOW_ALL_ORIGINS, REST, MEDIA_ROOT, русский язык).
- `backend/infolake/urls.py` — admin + api/v1 include.
- `backend/infolake/enums.py` — BaseEnum.
- `backend/infolake/{asgi,wsgi}.py` — стандарт.

**formular (данные + админ)**
- `backend/formular/models.py` — **все модели** (см. раздел 2).
- `backend/formular/admin.py` — регистрации + кастом (MarkerAdmin svg_thumbnail, get_queryset prefetch, Country color и т.д.).
- `backend/formular/admin_inlines.py` — TargetInline*, TargetActionInline, CountryInfoInline, FormularInline.
- `backend/formular/forms.py` — CountryForm (с ColorRadioSelect).
- `backend/formular/widgets.py` — ColorRadioSelect.
- `backend/formular/enums.py` — Colors (BaseEnum) + ActionAnimations.
- `backend/formular/validators.py` — validate_svg.
- `backend/formular/views.py` — пустой (логика в admin/api).
- `backend/formular/apps.py` — стандарт.
- `backend/formular/migrations/` — ~30 миграций (включая merge-миграции, до 0027+).

**api (DRF)**
- `backend/api/urls.py` — router + 3 custom path (country/<iso>, formular/<id>, /bulk).
- `backend/api/views.py` — все ViewSet + CountryInfoView, FormularView, FormularBulkUpdateView, Event фильтрация.
- `backend/api/serializers.py` — ~20 сериализаторов (read nested / write custom + bulk).
- `backend/api/apps.py`, `tests.py` — стандарт.

**Frontend root**
- `frontend/package.json` — React ^18.2, axios 1.4, leaflet 1.9.4, react-leaflet 4.2.1, react-leaflet-cluster 3.0.0, react-router-dom 6.14. Vite ^7.
- `frontend/vite.config.js` — React plugin.
- `frontend/index.html` — entry.
- `frontend/eslint.config.js`, `extract_iso_codes.cjs`, `iso_codes_*.json/txt` — вспомогательные скрипты.
- `frontend/INTEGRATION_GUIDE.md`, `IMPLEMENTATION_SUMMARY.md`, `CLUSTERING_DOCUMENTATION.md`, `CLUSTERING_README.md` — доки по интеграции и кластеризации.
- `frontend/README.md` — локальный README фронтенда.

**Frontend src/**
- `src/main.jsx`, `App.jsx` (минимальный; реальный UI в Formular.jsx), `App.css`, `index.css`.
- `src/config/api.js` — API_URL.
- `src/constants/mapConstants.js`.
- `src/data/objects.js` — статический fallback (не основной источник).
- `src/hooks/` — useTargetFormData, useActionsArray, useDropdownWithSearch (+ hooks_usage_summary.md).
- `src/utils/` — svgUtils.js, markerFilters.js, circleIntersection.js.
- `src/assets/` — глобальные CSS (reboot, fonts, блоки), шрифты Roboto, изображения и SVG-спрайты.
- `src/components/`:
  - `Formular/Formular.jsx` + .css — **главный оркестратор** (загрузка данных, состояние, вкладки Objects/Events, фильтры, модалы, measure, action-radius, intersections).
  - `MapComponent/MapComponent.jsx` (основной) + MapUtils.jsx + markerClusteringUtils.js + NonFlagMarkerUtils.jsx + ActionRadiusAnimations.jsx + ActionRadiusLegendButton.
  - Есть архивная копия: `MapComponent — archive/`.
  - `ObjectsTable/ObjectsTable.jsx`.
  - `Events/` — EventsTable, EventsFilterPanel, AddEventModal.
  - `FormularModal/`, `FormularEditor/` (bulk-редактор + загрузка/удаление attachments).
  - `AddTargetModal/`, `EditTargetModal/`.
  - `CountryModal/`, `EditCountryModal/`.
  - `FilterPanel/`, `FilterForm/`, `Features/` (measure + intersections), `IntersectionTable/`.
  - `Header/`, `Footer/`, `Sidebar.jsx` (частично legacy).
- `public/` — geo/custom.geo.json (границы стран), leaflet-иконки, SVG-спрайты и изображения.

**Media (runtime)**
- `backend/media/` — полностью игнорируется в .gitignore (не попадает в репозиторий). Содержит загруженные маркеры (76+ SVG), иконки событий, attachments стран и формуляров.

**Другое**
- `backend/markers/` (пример SVG).
- `frontend/` содержит дополнительные файлы документации и скриптов (см. выше).
- `Значки/`, `Значки событий/` — исходные SVG-иконки (вне кода, для импорта в `backend/media/`).
- `Данные.xlsx` — возможный источник исходных данных.
- Корневой `docker-compose.yml` — только сервис tileserver (порт 8080).
- `.gitignore` — подготовлен так, чтобы в репозиторий попадали файлы из `backend/` (кроме `.env*` и `env/`) и `frontend/`. Полностью игнорируются `media/`, `**/*.mbtiles`, `tileserver/docker-compose.yml`.

---

**Примечания для следующего агента:**
- Всё API открыто (`AllowAny`). Добавление auth потребует изменений в permissions + возможно JWT.
- Кластеризация жёстко завязана на `marker.is_flag`, `order`, `scale`, `country.title` и пиксельные расчёты через `map.latLngToLayerPoint`.
- Формуляр и CountryInfo — контент + attachments отдельно (bulk + файловые аплоады).
- События используют JSON shape (не GeoDjango).
- При изменениях моделей — миграции + обновление сериализаторов/модалов/хуков.
- Frontend state сосредоточен в `Formular.jsx` (не Redux/Context глобально). Много `useMemo`/`useEffect` для фильтров, intersections, кластеров.
- SVG обработка критична (уникализация `id`/`gradient` при множестве одинаковых маркеров).
- **Интеграция с TileServer выполнена** (ветка develop_tailserver):
  - Основной `MapComponent.jsx` и архивная версия теперь используют растровые тайлы из TileServer GL.
  - URL тайлов: `http://localhost:8080/styles/borders-labels/{z}/{x}/{y}.png` (конфигурируется через `VITE_TILESERVER_URL`).
  - Конфиг: `frontend/src/config/tiles.js` (экспортирует `TILE_RASTER_URL`, `TILESERVER_BASE_URL` и др.).
  - Добавлена attribution (OpenMapTiles + OSM).
  - maxZoom поднят до 14.
  - Старая заглушка `/tiles/{z}/{x}/{y}.png` удалена.
  - GeoJSON стран оставлен поверх (нужен для кликабельности и CountryModal).
- `.gitignore` создан с фокусом на `backend/` (без `.env*` и `env/`) + `frontend/`. Полностью игнорируется `media/`, все `*.mbtiles`, `tileserver/docker-compose.yml`. На момент актуализации в `tileserver/` присутствуют артефакты (`$null`, `-L/`, `-o/`, `curl.exe/`, `test_data.zip/`) и дублирующий `docker-compose.yml` — их следует почистить.
- При добавлении новых директорий/зависимостей обновляй `.gitignore` и этот раздел контекста.
- Основной справочник для агентов — **только этот файл**. Перед глубоким чтением кода обновляй `project_context.md`.
- Новая переменная окружения фронтенда: `VITE_TILESERVER_URL` (дефолт `http://localhost:8080`). Пример использования: `VITE_TILESERVER_URL=http://localhost:8080 npm run dev`.

Файл создан как единый компактный справочник. Дубли кода и длинные фрагменты исключены.

**Последнее обновление:** контекст приведён в соответствие с реальной структурой проекта, версией Django (6.0.6), расположением кода в `backend/`, текущим состоянием `tileserver/` (отсутствие mbtiles + наличие артефактов), и статусом интеграции тайлов во фронтенде (пока используется `/tiles/...`).

---

## 7. TileServer GL — оффлайн векторные карты (ветка develop_tailserver)

**Текущий статус (на момент актуализации):**
- Инфраструктура TileServer GL в целом развёрнута.
- Корневой `docker-compose.yml` поднимает сервис `tileserver` (образ `maptiler/tileserver-gl:latest`) на порту 8080, монтируя `./tileserver:/data`.
- В `tileserver/` присутствуют:
  - `config.json`, стили (`styles/borders-labels.json` + `basic.json`), шрифты (`fonts/Open Sans *`).
  - Скрипты (`download-data.ps1`, `apply-name-overrides.ps1`, `pre-render-png.js` и др.).
  - `data/name-overrides.json` (правила подмены имён, например Нур-Султан → Астана).
  - `tileserver_start_guide.md` (дублируется также в корне проекта).
- **Важно:** на текущий момент в `tileserver/data/` отсутствует файл `map.mbtiles` (векторные тайлы). Доступны только шрифты и стили.
- В директории `tileserver/` присутствует значительное количество артефактов (нарушение .gitignore):
  - `docker-compose.yml` (должен быть только в корне проекта)
  - `$null`, `-L/`, `-o/`, `curl.exe/`, `test_data.zip/`
- Контейнер успешно поднимается командой из корня проекта: `docker compose up -d`.

**Цель:**
- Локальный сервер векторных тайлов без доступа к интернету (замена/дополнение внешних тайлов).
- Полноценные векторные данные OpenMapTiles: границы, подписи населённых пунктов, гидрография, дороги и т.д.
- Полная поддержка русского языка (`name:ru` + кастомная подмена устаревших названий через `name-overrides.json`).

**Технологии и компоненты:**
- Docker-образ: `maptiler/tileserver-gl:latest`
- Конфигурация: `config.json` (пути к `data/`, `fonts/`, `styles/`, источник `openmaptiles`).
- Стили: `borders-labels.json` (основной, с границами и подписями), `basic.json`.
- Шрифты: Open Sans (Regular/Bold/Italic/Semibold) — хранятся в git.
- Подмена имён: `data/name-overrides.json` (применяется на уровне стиля).
- Глифы в стилях: `"glyphs": "{fontstack}/{range}.pbf"` (без префикса `fonts/`, т.к. путь уже задан в config.json).

**Ключевые особенности рендера:**
- Приоритет имён: `name:ru` → `name` → `name:latin`.
- Цветовая схема (фон `#f2efe9`, вода `#a3c4d9`, границы `#555555` и др.).
- Подмена названий работает на уровне стиля (не затрагивает исходные MBTiles).

**Проверка работоспособности (после `docker compose up -d`):**
- Веб-интерфейс: http://localhost:8080
- Стиль borders-labels: `/styles/borders-labels/style.json`
- Векторные тайлы: `/data/openmaptiles/{z}/{x}/{y}.pbf`
- Растровые тайлы: `/styles/borders-labels/{z}/{x}/{y}.png`
- Шрифты: `/fonts/Open%20Sans%20Regular/0-255.pbf`
- Метаданные: `/data/openmaptiles.json`

**Состояние интеграции с приложением:**
- **На текущий момент не выполнена в активном коде.**
- Активный `frontend/src/components/MapComponent/MapComponent.jsx` использует:
  ```jsx
  <TileLayer url="/tiles/{z}/{x}/{y}.png" minZoom={5} maxZoom={12} />
  ```
- Существует архивная копия (`MapComponent — archive/`) с предыдущими попытками интеграции тайлов.
- После появления `map.mbtiles` и запуска сервера фронтенд сможет переключиться на:
  - TileJSON: `http://localhost:8080/data/openmaptiles.json`
  - Style: `http://localhost:8080/styles/borders-labels/style.json`
- Кластеризация маркеров, рисование событий (JSON shapes), зоны действия и пересечения должны продолжать работать поверх векторного слоя.

**Запуск и управление (из корня проекта):**
```bash
docker compose up -d
docker compose ps
docker compose restart
docker compose down
```
Рекомендуется после старта открыть http://localhost:8080 и выбрать стиль **borders-labels**.

**Источники данных и лицензии:**
- OpenMapTiles (векторные MBTiles): limaps.org, object.data.gouv.fr и др.
- Схема слоёв: https://openmaptiles.org/schema/
- Лицензия данных: © OpenMapTiles © OpenStreetMap contributors (требуется атрибуция).
- Шрифты и тестовые данные: из официального `test_data.zip` TileServer GL.

**Примечания и типичные проблемы:**
- Порт 8080 должен быть свободен.
- Отсутствие `map.mbtiles` — основная причина "пустой карты" на 8080.
- Шрифты критичны: неправильный путь `glyphs` → ошибка "Invalid range".
- После изменений стилей или `name-overrides.json`: `docker compose restart`.
- Артефакты в `tileserver/` (`$null`, `-L/`, `-o/`, `curl.exe/`, `test_data.zip/`, `tileserver/docker-compose.yml`) следует удалить в соответствии с `.gitignore`.
- Основная карта приложения пока остаётся на Leaflet + текущий TileLayer. Переход на TileServer GL — задача ветки `develop_tailserver`.

**Важно:** Все полезные данные (стили, шрифты, скрипты, config, name-overrides) хранятся внутри `tileserver/`. Корневой `docker-compose.yml` вынесен для удобства (возможность в будущем добавить Django и другие сервисы в один compose).
