export default function Sidebar({objects, selected, onSelect}) {
    return (
        <aside className="sidebar">
            <h2>Объекты</h2>
            <ul>
                { objects.map (obj => (
                    <li
                        key={obj.id}
                        className={selected?.id === obj.id ? "active" : ""}
                        onClick={() => onSelect(obj)}>
                            {obj.name}
                        </li>
                )) }
            </ul>
        </aside>
    )
}