import { useEffect, useState, useMemo } from "react";
import L from "leaflet";
import axios from "axios";

const ICON_WIDTH = 50;
const ICON_HEIGHT = 50;
const MAX_DISTANCE_PX = 100;

const enrichSvg = (rawSvg, w, h, markerId, color) => {
  if (!rawSvg) return "";

  const width = typeof w === "string" ? w.replace(/px$/i, "") : w;
  const height = typeof h === "string" ? h.replace(/px$/i, "") : h;

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvg, "image/svg+xml");

  const idMap = {};
  const grads = doc.querySelectorAll("linearGradient[id]");
  grads.forEach(g => {
    const oldId = g.getAttribute("id");
    const newId = `${oldId}-${markerId}`;
    idMap[oldId] = newId;
    g.setAttribute("id", newId);
  });

  doc.querySelector("svg")?.classList.add(`icon__${color || "blue"}`);

  let svgString = new XMLSerializer().serializeToString(doc);

  // Обновление ссылок на id
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
  if (!match) return svgString;

  const originalAttrs = match[1];
  const cleanedAttrs = originalAttrs
    .replace(/\swidth\s*=\s*["'][^"']*["']/i, "")
    .replace(/\sheight\s*=\s*["'][^"']*["']/i, "")
    .trim();

  const newAttrs = `${cleanedAttrs} width="${width}" height="${height}"`.trim();
  return svgString.replace(/<svg([\s\S]*?)>/i, `<svg ${newAttrs}>`);
};

function calcFontSize(text, maxWidth, maxFont = 14, minFont = 6) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let fontSize = maxFont;
  const measure = size => {
    ctx.font = `${size}px Arial, Helvetica, sans-serif`;
    return ctx.measureText(text).width;
  };
  while (fontSize > minFont && measure(fontSize) > maxWidth) {
    fontSize -= 1;
  }
  return Math.max(fontSize, minFont);
}

// const latLngToPixel = (map, lat, lng) => {
//     const point = map.latLngToLayerPoint({lat, lng});
//     return { x: point.x, y: point.y };
// }

// // Утилита вычисления расстояния между точками
// const calcDistance = (p1, p2) => {
//     return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
// };

export default function LabelGeneration(objects) {
  const [svgCache, setSvgCache] = useState(new Map());

  useEffect(() => {
    if (!objects || !Array.isArray(objects) || objects.length === 0) return;

    const loadSvgs = async () => {
        const cache = new Map();

        const uniquePaths = new Set(objects.map(o => o.marker?.path).filter(Boolean));

        await Promise.all(
            Array.from(uniquePaths).map(async (path) => {
                try {
                    const res = await axios.get(path, { responseType: "text" });
                    cache.set(path, res.data);
                } catch (err) {
                    console.warn("Не удалось загрузить SVG:", path, err);
                    cache.set(path, "");
                }
            })
        );
        setSvgCache(cache);
    };

    loadSvgs();
  }, [objects]);

  const iconsById = useMemo(() => {
    if (!L || !L.DivIcon) {
      console.warn("L.DivIcon недоступен — иконки не созданы");
      return {};
    }

    const map = {};

    objects.forEach((o) => {
        const path = o.marker?.path;
        const svg = path ? svgCache.get(path) ?? "" : "";
        const markerScale = o.marker?.scale || 1;
        const iconWidth = ICON_WIDTH * markerScale;
        const iconHeight = ICON_HEIGHT * markerScale;
        const labelTop = o.marker?.top || 0;
        const labelHeight = o.marker?.height || 100;
        const labelWidth = o.marker?.width || 100;
        const markerColor = o.country?.color || "blue";
        const label = o.label || "";

        const top = `${iconHeight * (labelTop / 100)}px`;
        const height = `${iconHeight * (labelHeight / 100)}px`;
        const width = `${iconWidth * (labelWidth / 100)}px`;
        const fontSize = calcFontSize(label, iconWidth * 0.8, 14, 9);

      const html = `
        <div class="custom-marker-label"
          style="position:relative; width:${iconWidth}px; height:${iconHeight}px;"
        >
          <span class="svg-marker" data-id="${o.id}">
            ${enrichSvg(svg, iconWidth, iconHeight, o.id, markerColor) || `
              <svg viewBox="0 0 ${ICON_WIDTH} ${ICON_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
                <rect width="${ICON_WIDTH}" height="${ICON_HEIGHT}" fill="#ccc"/>
              </svg>
            `}
          </span>
          <span class="marker-label"
            style="
              top:${top};
              width:${width};
              height:${height};
              line-height:${height};
              font-size:${fontSize - 1}px;
              text-align:center;
              display:flex;
              align-items:center;
              justify-content:flex-end;
            "
          >
            ${label}
          </span>
        </div>
      `;

      const offsetMap = {
        right: [iconWidth, iconHeight],
        left: [0, 0],
        top: [0, 0],
        bottom: [0, 0]
      };

      map[o.id] = new L.DivIcon({
        html,
        className: "custom-div-icon",
        iconSize: [iconWidth, iconHeight],
        iconAnchor: offsetMap["right"],
        popupAnchor: [0, -iconHeight / 2]
      });
    });

    return map;
  }, [objects, svgCache]);

  return iconsById;
}