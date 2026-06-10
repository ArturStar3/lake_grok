/**
 * Получает размеры (width, height) из viewBox SVG-строки
 * @param {string} svgString - SVG код
 * @returns {{width: number, height: number} | null}
 */
export function getViewBoxSize(svgString) {
  if (!svgString) return null;
  const match = svgString.match(/viewBox\s*=\s*['\"]([\d.\s]+)['\"]/i);
  if (!match) return null;
  const parts = match[1].trim().split(/\s+/);
  if (parts.length !== 4) return null;
  const width = parseFloat(parts[2]);
  const height = parseFloat(parts[3]);
  if (isNaN(width) || isNaN(height)) return null;
  return { width, height };
}
/**
 * Утилиты для работы с SVG
 */

/**
 * Обогащает SVG: добавляет уникальные ID для gradients, цветовые классы, размеры
 * @param {string} rawSvg - Исходный SVG код
 * @param {number|string} w - Ширина иконки
 * @param {number|string} h - Высота иконки
 * @param {number|string} markerId - ID маркера для уникализации
 * @param {string} color - Цвет для добавления класса
 * @returns {string} Обработанный SVG
 */
export const enrichSvg = (rawSvg, w, h, markerId, color) => {
  if (!rawSvg) {
    return "";
  }

  const width = typeof w === "string" ? w.replace(/px$/i, "") : w;
  const height = typeof h === "string" ? h.replace(/px$/i, "") : h;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, "image/svg+xml");
    
    // Проверяем на ошибки парсирования
    if (doc.documentElement.nodeName === "parsererror") {
      console.warn(`enrichSvg: DOMParser error for markerId=${markerId}`);
      return "";
    }

    // Уникализация ID для gradients
    const idMap = {};
    const grads = doc.querySelectorAll("linearGradient[id]");
    grads.forEach(g => {
      const oldId = g.getAttribute("id");
      const newId = `${oldId}-${markerId}`;
      idMap[oldId] = newId;
      g.setAttribute("id", newId);
    });

    // Добавление цветового класса
    doc.querySelector("svg")?.classList.add(`icon__${color || "blue"}`);

    let svgString = new XMLSerializer().serializeToString(doc);

    // Обновление ссылок на ID
    Object.entries(idMap).forEach(([oldId, newId]) => {
      const urlReg = new RegExp(`(?<=url\\(#)${oldId}(?=\\))`, "g");
      const hrefReg = new RegExp(`(?<=href\\s*=\\s*"#)${oldId}(?=")`, "g");
      const xlReg = new RegExp(`(?<=xlink:href\\s*=\\s*"#)${oldId}(?=)`, "g");
      svgString = svgString
        .replace(urlReg, newId)
        .replace(hrefReg, newId)
        .replace(xlReg, newId);
    });

    // Добавляем xmlns, если его нет
    svgString = svgString.replace(/<svg\s/, '<svg xmlns="http://www.w3.org/2000/svg" ');

    // Обновляем width/height
    const match = svgString.match(/<svg([\s\S]*?)>/i);
    if (!match) {
      console.warn(`enrichSvg: No SVG tag found for markerId=${markerId}`);
      return svgString;
    }

    const originalAttrs = match[1];
    const cleanedAttrs = originalAttrs
      .replace(/\swidth\s*=\s*["'][^"']*["']/i, "")
      .replace(/\sheight\s*=\s*["'][^"']*["']/i, "")
      .trim();

    const newAttrs = `${cleanedAttrs} width="${width}" height="${height}"`.trim();
    return svgString.replace(/<svg([\s\S]*?)>/i, `<svg ${newAttrs}>`);
  } catch (e) {
    console.warn(`enrichSvg: Error processing SVG for markerId=${markerId}:`, e);
    return "";
  }
};

/**
 * Добавляет или заменяет цветовой класс в SVG
 * @param {string} svgString - SVG код
 * @param {string} color - Цвет для класса (по умолчанию 'blue')
 * @returns {string} SVG с обновленным классом цвета
 */
export const addColorClassToSvg = (svgString, color = 'blue') => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');
  
  if (svgElement) {
    // Удаляем все существующие классы icon__*
    svgElement.classList.forEach(className => {
      if (className.startsWith('icon__')) {
        svgElement.classList.remove(className);
      }
    });
    // Добавляем новый класс
    svgElement.classList.add(`icon__${color}`);
  }
  
  return new XMLSerializer().serializeToString(doc);
};
