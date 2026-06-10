
export default function ObjectsTable({ data, selectedObj, onCheckboxChange, onObjectClick, onTitleClick, hoveredTargetId, onRowHover, onEditClick, onDeleteClick }) {
    const dataIds = data.map((item) => item.id);
    const selectedSet = new Set(selectedObj);
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
        <div className="formular__data">
            <table className="formular__table">
                <thead>
                    <tr className="formular__table-head-row">
                        <th className="formular__head-cell formular__head-cell--select-all">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={handleSelectAllChange}
                                aria-label="Выбрать все объекты"
                            />
                        </th>
                        <th className="formular__head-cell formular__head-cell--action"></th>
                        <th className="formular__head-cell">Наименование</th>
                        <th className="formular__head-cell">Страна</th>
                        <th className="formular__head-cell formular__head-cell--action"></th>
                    </tr>
                </thead>
                <tbody className="formular__tbody">
                    {data.map((item) => (
                        <tr 
                            key={item.id} 
                            className={`formular__table-row${hoveredTargetId === item.id ? ' formular__table-row--hovered' : ''}`}
                        >
                            <td className="formular__table-data">
                                <input 
                                    type="checkbox"
                                    name="object"
                                    value={item.id}
                                    checked={selectedObj.includes(item.id)}
                                    onChange={(e) => onCheckboxChange(item.id, e.target.checked)}
                                />
                            </td>
                            <td className="formular__table-data formular__table-data--action">
                                <button
                                    className="formular__flyto-btn"
                                    onClick={() => {
                                        if (onObjectClick) {
                                            onObjectClick(item);
                                        }
                                    }}
                                    onMouseEnter={() => {
                                        if (onRowHover) {
                                            onRowHover(item.id);
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        if (onRowHover) {
                                            onRowHover(null);
                                        }
                                    }}
                                    aria-label={`Перейти к объекту ${item.title} на карте`}
                                    title="Перейти к объекту на карте"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
                                    </svg>
                                </button>
                            </td>
                            <td 
                                className="formular__table-data formular__table-data--clickable"
                                onClick={() => {
                                    // Только открываем формуляр
                                    if (onTitleClick) {
                                        onTitleClick(item.id);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Открыть формуляр объекта ${item.title}`}
                            >
                                {item.title}
                            </td>
                            <td className="formular__table-data">{item.country.title}</td>
                            <td className="formular__table-data formular__table-data--action">
                                <div className="formular__actions-group">
                                    <button
                                        className="formular__action-btn formular__action-btn--edit"
                                        onClick={() => {
                                            if (onEditClick) {
                                                onEditClick(item.id);
                                            }
                                        }}
                                        aria-label={`Редактировать объект ${item.title}`}
                                        title="Редактировать объект"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                                        </svg>
                                    </button>
                                    <button
                                        className="formular__action-btn formular__action-btn--delete"
                                        onClick={() => {
                                            if (onDeleteClick) {
                                                onDeleteClick(item.id, item.title);
                                            }
                                        }}
                                        aria-label={`Удалить объект ${item.title}`}
                                        title="Удалить объект"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
