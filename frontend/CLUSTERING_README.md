# Система кластеризации маркеров на карте

## Обзор

Система автоматически группирует близко расположенные маркеры флажков на карте в вертикальные стеки, улучшая читаемость и визуальное отображение информации.

## Функциональные возможности

### 1. Автоматическая группировка по странам

- Объекты группируются по полю `country.title`
- Только объекты с `marker.is_flag = true` участвуют в группировке

### 2. Приоритизация по порядку

- Объекты сортируются по `marker.order` (возрастание)
- Меньшее значение = выше приоритет
- Главным маркером в кластере становится объект с наименьшим order

### 3. Дистанционная кластеризация

- Объекты считаются "близкими", если расстояние между ними < 1 см на карте (37.8 px при 96 DPI)
- Расстояние считается от центра одного маркера до центра другого
- Все объекты одного кластера получают координаты главного маркера

### 4. Вертикальное выстраивание

- Маркеры в кластере выстраиваются вертикально вокруг главного маркера
- Каждому маркеру назначается смещение по оси Y (`offsetY`)
- Маркеры расположены так, чтобы быть видимыми и не перекрываться

## Алгоритм работы

```
Вход: Array<Object> objects, Leaflet MapInstance map

1. ФИЛЬТРАЦИЯ
   ├─ Оставить только объекты где marker.is_flag === true

2. ГРУППИРОВКА ПО СТРАНАМ
   ├─ Сгруппировать по country.title

3. ДЛЯ КАЖДОЙ СТРАНЫ:
   ├─ СОРТИРОВКА
   │  └─ Отсортировать по marker.order (возрастание)
   │
   ├─ ПОКА есть необработанные объекты:
   │  ├─ Взять объект с наивысшим приоритетом (mín order)
   │  ├─ ПОИСК СОСЕДЕЙ
   │  │  └─ Найти все объекты на расстоянии < 1 см
   │  ├─ СОЗДАНИЕ КЛАСТЕРА
   │  │  └─ Объединить в один кластер
   │  ├─ РАСЧЕТ СМЕЩЕНИЙ
   │  │  ├─ Пересчитать координаты (lat, lng всех = lat, lng главного)
   │  │  ├─ Рассчитать offsetY для каждого
   │  │  └─ Выстроить вертикально
   │  └─ Отметить объекты как обработанные

Выход: Array<Object> clusteredObjects с добавленными:
       - lat, lng (координаты главного маркера)
       - offsetY (смещение по вертикали)
       - isInCluster (флаг кластеризации)
       - clusterId (ID главного маркера)
```

## Расчет offsetY (Пример)

Дан кластер из 4 объектов:

- obj1: order=1, height=50 (ГЛАВНЫЙ)
- obj2: order=2, height=50
- obj3: order=2, height=50
- obj4: order=4, height=50

### Шаг 1: Расчет от конца к началу

```
Индекс 3 (obj4): offsetY = 0
Индекс 2 (obj3): offsetY = 0 + 50 = 50
Индекс 1 (obj2): offsetY = 50 + 50 = 100
Индекс 0 (obj1): offsetY = 100 + 50 = 150
```

### Шаг 2: Нормализация (центрирование)

Общая высота всех маркеров = 200px
Смещение для центрирования = -200/2 = -100px

```
obj4: offsetY = 0 - 100 = -100
obj3: offsetY = 50 - 100 = -50
obj2: offsetY = 100 - 100 = 0
obj1: offsetY = 150 - 100 = 50
```

### Визуальный результат

```
         (зум на точку 41.3, 69.2)

           obj1  ▓▓▓▓  (offsetY = 50)
           obj2  ░░░░  (offsetY = 0)
           obj3  ░░░░  (offsetY = -50)
           obj4  ▒▒▒▒  (offsetY = -100)

   ←─ центр кластера ─→
```

## Структура данных

### Входные данные (от API)

```javascript
{
  "id": "uuid",
  "title": "Название объекта",
  "label": "Текст маркера",
  "lat": 41.3,
  "lng": 69.2,
  "country": {
    "title": "Узбекистан",
    "color": "blue"
  },
  "marker": {
    "path": "http://localhost:8000/media/markers/icon.svg",
    "top": 5,           // Смещение текста от верха маркера (%)
    "width": 100,       // Ширина области текста (%)
    "height": 50,       // Высота области текста (%)
    "order": 1,         // Приоритет сортировки
    "scale": "1.0",     // Масштаб маркера
    "is_flag": true     // Участвует в кластеризации
  }
}
```

### Выходные данные (после кластеризации)

```javascript
{
  // Все поля из входных данных, плюс:
  "lat": 41.3,              // Координата главного маркера (может измениться)
  "lng": 69.2,              // Координата главного маркера (может измениться)
  "offsetY": 50,            // Смещение по вертикали (в пикселях)
  "isInCluster": true,      // Объект участвует в кластере
  "clusterId": "uuid"       // ID главного маркера в кластере
}
```

## Использование в коде

### React компоненты

**MapComponent.jsx**

```jsx
const { iconsById, clusteredObjects } = LabelGeneration(
  objects,
  mapInstance.current,
);
const displayedObjectsForMarkers = clusteredObjects.filter((obj) =>
  selectedObj.includes(obj.id),
);

{
  displayedObjectsForMarkers.map((obj, idx) => (
    <Marker position={[obj.lat, obj.lng]} icon={iconsById[obj.id]} />
  ));
}
```

**MapUtils.jsx**

```jsx
const iconsById = useMemo(() => {
    const map = {};
    clusteredObjects.forEach((o) => {
        const markerPosition = calculateMarkerPosition(o);
        const html = `
            <div style="transform: translateY(${markerPosition.top}px);">
                ${enrichSvg(...)}
            </div>
        `;
        map[o.id] = new L.DivIcon({ html, ... });
    });
    return map;
}, [clusteredObjects, svgCache]);

return { iconsById, clusteredObjects };
```

## API маркеров

### markerClusteringUtils.js

Экспортируемые функции:

- **`groupByCountryAndFilter(objects)`** → `Object`
  - Группирует объекты по странам и фильтрует по is_flag

- **`sortByOrder(objects)`** → `Array`
  - Сортирует по marker.order (возрастание)

- **`latLngToPixel(map, lat, lng)`** → `{x, y} | null`
  - Преобразует координаты в пиксели на карте

- **`calcDistancePx(p1, p2)`** → `number`
  - Вычисляет расстояние между точками в пикселях

- **`findNearbyObjects(baseObj, candidates, map)`** → `Array`
  - Находит объекты на расстоянии < 37.8px

- **`createClusters(objects, map)`** → `Array<Array>`
  - Создает кластеры близких объектов

- **`calculateClusterOffsets(cluster)`** → `Object`
  - Рассчитывает offsetY для каждого объекта

- **`applyClusterOffsets(cluster, offsets)`** → `Array`
  - Применяет офсеты к объектам в кластере

- **`processMarkerClustering(objects, map)`** → `Array`
  - Главная функция обработки кластеризации

- **`calculateMarkerPosition(obj, scale)`** → `{top, left}`
  - Рассчитывает CSS позицию маркера

## Настройка параметров

### Радиус группировки

В файле `markerClusteringUtils.js`:

```javascript
const CLUSTER_DISTANCE_CM = 1; // Изменить на нужное значение
const CLUSTER_DISTANCE_PX = 37.8; // Автоматический расчет
```

### DPI системы

```javascript
const CM_TO_PIXELS = 37.8; // 1 см при 96 DPI
// Для других DPI: (DPI / 96) * 37.8
```

## Отладка и логирование

### Проверка в браузере

1. React DevTools → Components → MapComponent → Props
2. Найдите `clusteredObjects`
3. Проверьте наличие `offsetY`, `isInCluster`, `clusterId`

### Добавление логирования

В `processMarkerClustering`:

```javascript
console.log("Grouped:", groupedByCountry);
console.log("Clusters:", clusters);
clusteredObjects.forEach((obj) => {
  console.log(`${obj.id}: offsetY=${obj.offsetY}, clusterId=${obj.clusterId}`);
});
```

### Проверка API данных

```javascript
// В консоли браузера
fetch("http://localhost:8000/api/v1/targets")
  .then((r) => r.json())
  .then((data) => {
    console.log(data);
    // Проверьте поля: is_flag, order, country.title, marker.scale
  });
```

## Примеры

### Пример 1: Простая кластеризация

```javascript
const objects = [
  {
    id: 1,
    lat: 41.3,
    lng: 69.2,
    marker: { order: 1, is_flag: true },
    country: { title: "Узбекистан" },
  },
  {
    id: 2,
    lat: 41.3,
    lng: 69.2,
    marker: { order: 2, is_flag: true },
    country: { title: "Узбекистан" },
  },
];

const result = processMarkerClustering(objects, mapInstance);
// result[0].offsetY = 50, result[1].offsetY = -50
```

### Пример 2: Разные страны

```javascript
const objects = [
  {
    id: 1,
    country: { title: "Узбекистан" },
    marker: { is_flag: true, order: 1 },
  },
  {
    id: 2,
    country: { title: "Казахстан" },
    marker: { is_flag: true, order: 1 },
  },
];

const result = processMarkerClustering(objects, mapInstance);
// Разные кластеры для разных стран
```

## Производительность

- Кластеризация выполняется один раз при загрузке данных
- Сложность: O(n²) для поиска близких объектов (n = количество объектов)
- Для оптимизации больших наборов данных можно использовать пространственные индексы (QuadTree, R-tree)

## Совместимость

- React 16.8+ (требуется Hooks)
- Leaflet 1.5+
- Современные браузеры (Chrome, Firefox, Safari, Edge)

## Лицензия

MIT
