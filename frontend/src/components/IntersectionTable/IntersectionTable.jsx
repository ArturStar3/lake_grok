import "./IntersectionTable.css";

export default function IntersectionTable({ intersections, selectedIntersections = [], onIntersectionToggle, onSelectAllIntersections }) {
    if (!intersections || intersections.length === 0) {
        return (
            <div className="intersection-table__empty">
                <p>Точки пересечения не обнаружены</p>
            </div>
        );
    }

    const allSelected = intersections.length > 0 && selectedIntersections.length === intersections.length;
    const someSelected = selectedIntersections.length > 0 && selectedIntersections.length < intersections.length;

    return (
        <div className="intersection-table">
            <h3 className="intersection-table__title">Точки пересечения зон действия</h3>
            <div className="intersection-table__wrapper">
                <table className="intersection-table__content">
                    <thead>
                        <tr>
                            <th>
                                <input 
                                    type="checkbox" 
                                    checked={allSelected}
                                    ref={input => {
                                        if (input) {
                                            input.indeterminate = someSelected;
                                        }
                                    }}
                                    onChange={(e) => onSelectAllIntersections?.(e.target.checked)}
                                    aria-label="Выбрать все точки"
                                />
                            </th>
                            <th>Название</th>
                            <th>Широта</th>
                            <th>Долгота</th>
                            <th>Пересечение объектов</th>
                        </tr>
                    </thead>
                    <tbody>
                        {intersections.map((intersection) => (
                            <tr key={intersection.id}>
                                <td>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIntersections.includes(intersection.id)}
                                        onChange={() => onIntersectionToggle?.(intersection.id)}
                                        aria-label={`Показать ${intersection.label} на карте`}
                                    />
                                </td>
                                <td>{intersection.label}</td>
                                <td>{intersection.lat.toFixed(6)}</td>
                                <td>{intersection.lng.toFixed(6)}</td>
                                <td>
                                    <div className="intersection-table__objects">
                                        {intersection.objects.map((objName, idx) => (
                                            <span key={idx} className="intersection-table__object-name">
                                                {objName}
                                                {idx < intersection.objects.length - 1 && ', '}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
