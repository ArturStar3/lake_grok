/**
 * Утилиты для фильтрации маркеров по типу (flag/non-flag)
 */

/**
 * Проверяет, является ли объект флаговым маркером
 * @param {Object} obj - Объект для проверки
 * @returns {boolean} true, если объект имеет флаговый маркер или без маркера
 */
export const isFlagMarker = (obj) => {
  return obj.marker?.is_flag === true || 
         obj.marker?.is_flag === undefined || 
         !obj.marker;
};

/**
 * Проверяет, является ли объект нефлаговым маркером
 * @param {Object} obj - Объект для проверки
 * @returns {boolean} true, если объект имеет нефлаговый маркер
 */
export const isNonFlagMarker = (obj) => {
  return obj.marker?.is_flag === false;
};

/**
 * Фильтрует флаговые маркеры из массива объектов по выбранным ID
 * @param {Array} objects - Массив объектов
 * @param {Array} selectedIds - Массив выбранных ID
 * @returns {Array} Отфильтрованный массив флаговых маркеров
 */
export const filterFlagMarkers = (objects, selectedIds) => {
  return objects.filter(obj => 
    selectedIds.includes(obj.id) && isFlagMarker(obj)
  );
};

/**
 * Фильтрует нефлаговые маркеры из массива объектов по выбранным ID
 * @param {Array} objects - Массив объектов
 * @param {Array} selectedIds - Массив выбранных ID
 * @returns {Array} Отфильтрованный массив нефлаговых маркеров
 */
export const filterNonFlagMarkers = (objects, selectedIds) => {
  return objects.filter(obj => 
    selectedIds.includes(obj.id) && isNonFlagMarker(obj)
  );
};
