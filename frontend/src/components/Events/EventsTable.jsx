export default function EventsTable({ data, selectedEvents, onCheckboxChange, onFlyTo, onEdit, onDelete }) {
    const dataIds = data.map((item) => item.id);
    const selectedSet = new Set(selectedEvents);
    const isAllSelected = data.length > 0 && dataIds.every((id) => selectedSet.has(id));

    const handleSelectAllChange = (e) => {
        const isChecked = e.target.checked;

        if (isChecked) {
            dataIds.forEach((id) => onCheckboxChange(id, true));
        } else {
            dataIds.forEach((id) => onCheckboxChange(id, false));
        }
    };

    return (
        <div className="events__data">
            <table className="events__table">
                <thead>
                    <tr className="events__table-head-row">
                        <th className="events__head-cell events__head-cell--select-all">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={handleSelectAllChange}
                                aria-label="Выбрать все события"
                            />
                        </th>
                        <th className="events__head-cell events__head-cell--action"></th>
                        <th className="events__head-cell">Название</th>
                        <th className="events__head-cell">Дата</th>
                        <th className="events__head-cell">Время</th>
                        <th className="events__head-cell">Страна</th>
                        <th className="events__head-cell">Тип</th>
                        <th className="events__head-cell events__head-cell--action"></th>
                        <th className="events__head-cell events__head-cell--action"></th>
                    </tr>
                </thead>
                <tbody className="events__tbody">
                    {data.map((item) => (
                        <tr key={item.id} className="events__table-row">
                            <td className="events__table-data">
                                <input
                                    type="checkbox"
                                    checked={selectedEvents.includes(item.id)}
                                    onChange={(e) => onCheckboxChange(item.id, e.target.checked)}
                                    aria-label={`Показать событие ${item.title} на карте`}
                                />
                            </td>
                            <td className="events__table-data events__table-data--action">
                                <button
                                    className="events__flyto-btn"
                                    onClick={() => onFlyTo?.(item)}
                                    aria-label={`Перейти к событию ${item.title} на карте`}
                                    title="Перейти к событию на карте"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"></path>
                                    </svg>
                                </button>
                            </td>
                            <td className="events__table-data">{item.title}</td>
                            <td className="events__table-data">
                                {item.date_start || "—"}
                                {item.date_end ? ` — ${item.date_end}` : ""}
                            </td>
                            <td className="events__table-data">
                                {item.time_start || "—"}
                                {item.time_end ? ` — ${item.time_end}` : ""}
                            </td>
                            <td className="events__table-data">{item.country?.title || "—"}</td>
                            <td className="events__table-data">{item.shape?.type || "—"}</td>
                            <td className="events__table-data events__table-data--action">
                                <button
                                    className="events__action-btn"
                                    onClick={() => onEdit?.(item)}
                                    aria-label={`Редактировать событие ${item.title}`}
                                    title="Редактировать событие"
                                >
                                    ✎
                                </button>
                            </td>
                            <td className="events__table-data events__table-data--action">
                                <button
                                    className="events__action-btn events__action-btn--delete"
                                    onClick={() => onDelete?.(item)}
                                    aria-label={`Удалить событие ${item.title}`}
                                    title="Удалить событие"
                                >
                                    ✕
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
