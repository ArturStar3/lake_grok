import React from "react";
import "./ActionRadiusLegendButton.css";

const LEGEND_ITEMS = [
  { type: "gradient", label: "Градиентная заливка", desc: "Радиция, химическое заражение" },
  { type: "radar", label: "Радиальные лучи", desc: "Радар, зона обнаружения" },
  { type: "wave", label: "Волновой эффект", desc: "Взрывная / сейсмическая волна" },
  { type: "pulse", label: "Пульсация", desc: "Зона влияния" },
  { type: "rings", label: "Кольца", desc: "Связь, многоуровневая защита" },
  { type: "sector", label: "Сектор", desc: "Секторное сканирование / видимость" },
  { type: "alert", label: "Тревога", desc: "Опасная зона" },
  { type: "dashed_rotate", label: "Пунктир", desc: "Патрулирование, периметр" },
];

export default function ActionRadiusLegendButton() {
  return (
    <div className="action-radius-legend">
      <button
        type="button"
        className="action-radius-legend__toggle"
        aria-label="Показать легенду зон действия"
      >
        <span className="action-radius-legend__icon">i</span>
      </button>
      <div className="action-radius-legend__panel">
        <div className="action-radius-legend__title">Типы зон действия</div>
        <ul className="action-radius-legend__list">
          {LEGEND_ITEMS.map((item) => (
            <li key={item.type} className="action-radius-legend__item">
              <span className={`action-radius-legend__sample action-radius-legend__sample--${item.type}`} />
              <span className="action-radius-legend__text">
                <strong>{item.label}</strong>
                <span className="action-radius-legend__desc">{item.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

