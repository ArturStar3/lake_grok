import { useEffect, useMemo, useRef, useState } from "react";
import "./EventsFilterPanel.css";

export default function EventsFilterPanel({ countries, eventTypes = [], filters, onChange }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");
    const [typeSearch, setTypeSearch] = useState("");
    const countryDropdownRef = useRef(null);
    const typeDropdownRef = useRef(null);

    const countryOptions = useMemo(() => {
        return [...countries].sort((a, b) => a.title.localeCompare(b.title));
    }, [countries]);

    const filteredCountries = useMemo(() => {
        if (!countrySearch.trim()) return countryOptions;
        const needle = countrySearch.trim().toLowerCase();
        const matched = countryOptions.filter((country) => country.title.toLowerCase().includes(needle));
        const selected = countryOptions.filter((country) => filters.countries.includes(country.id));
        return [...new Set([...selected, ...matched])];
    }, [countryOptions, countrySearch, filters.countries]);

    const eventTypeOptions = useMemo(() => {
        return [...eventTypes].sort((a, b) => a.title.localeCompare(b.title));
    }, [eventTypes]);

    const filteredEventTypes = useMemo(() => {
        if (!typeSearch.trim()) return eventTypeOptions;
        const needle = typeSearch.trim().toLowerCase();
        const matched = eventTypeOptions.filter((type) => type.title.toLowerCase().includes(needle));
        const selected = eventTypeOptions.filter((type) => filters.eventTypes.includes(type.id));
        return [...new Set([...selected, ...matched])];
    }, [eventTypeOptions, typeSearch, filters.eventTypes]);

    const handleCountryToggle = (id) => {
        const next = filters.countries.includes(id)
            ? filters.countries.filter((cid) => cid !== id)
            : [...filters.countries, id];
        onChange({ ...filters, countries: next });
    };

    const handleSelectAll = () => {
        if (filters.countries.length === countryOptions.length) {
            onChange({ ...filters, countries: [] });
        } else {
            onChange({ ...filters, countries: countryOptions.map((c) => c.id) });
        }
    };

    const handleTypeToggle = (id) => {
        const next = filters.eventTypes.includes(id)
            ? filters.eventTypes.filter((tid) => tid !== id)
            : [...filters.eventTypes, id];
        onChange({ ...filters, eventTypes: next });
    };

    const handleTypeSelectAll = () => {
        if (filters.eventTypes.length === eventTypeOptions.length) {
            onChange({ ...filters, eventTypes: [] });
        } else {
            onChange({ ...filters, eventTypes: eventTypeOptions.map((t) => t.id) });
        }
    };

    const handleReset = () => {
        onChange({
            title: "",
            dateFrom: "",
            dateTo: "",
            timeFrom: "",
            timeTo: "",
            countries: [],
            eventTypes: []
        });
        setCountrySearch("");
        setTypeSearch("");
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            const isCountryClick = countryDropdownRef.current?.contains(event.target);
            const isTypeClick = typeDropdownRef.current?.contains(event.target);
            if (!isCountryClick && !isTypeClick) {
                setIsCountryDropdownOpen(false);
                setIsTypeDropdownOpen(false);
            }
        };
        if (isCountryDropdownOpen || isTypeDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isCountryDropdownOpen, isTypeDropdownOpen]);

    const activeFiltersCount =
        (filters.title?.trim() ? 1 : 0) +
        (filters.dateFrom ? 1 : 0) +
        (filters.dateTo ? 1 : 0) +
        (filters.timeFrom ? 1 : 0) +
        (filters.timeTo ? 1 : 0) +
        filters.countries.length +
        filters.eventTypes.length;

    return (
        <div className="events-filter">
            <div className="events-filter__header">
                <button
                    className="events-filter__toggle"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                >
                    <span className="events-filter__title">Фильтры событий</span>
                    {activeFiltersCount > 0 && (
                        <span className="events-filter__badge">{activeFiltersCount}</span>
                    )}
                    <span className={`events-filter__chevron${isExpanded ? " events-filter__chevron--expanded" : ""}`}>
                        ▼
                    </span>
                </button>
                {activeFiltersCount > 0 && (
                    <button className="events-filter__reset" onClick={handleReset}>
                        Сбросить
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="events-filter__content">
                    <div className="events-filter__section">
                        <label className="events-filter__label">Название</label>
                        <input
                            type="text"
                            className="events-filter__input"
                            value={filters.title}
                            onChange={(e) => onChange({ ...filters, title: e.target.value })}
                            placeholder="Поиск по названию"
                        />
                    </div>

                    <div className="events-filter__section">
                        <label className="events-filter__label">Дата (диапазон)</label>
                        <div className="events-filter__range">
                            <input
                                type="date"
                                className="events-filter__input"
                                value={filters.dateFrom}
                                onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                            />
                            <span className="events-filter__range-sep">—</span>
                            <input
                                type="date"
                                className="events-filter__input"
                                value={filters.dateTo}
                                onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="events-filter__section">
                        <label className="events-filter__label">Время (диапазон)</label>
                        <div className="events-filter__range">
                            <input
                                type="time"
                                className="events-filter__input"
                                value={filters.timeFrom}
                                onChange={(e) => onChange({ ...filters, timeFrom: e.target.value })}
                            />
                            <span className="events-filter__range-sep">—</span>
                            <input
                                type="time"
                                className="events-filter__input"
                                value={filters.timeTo}
                                onChange={(e) => onChange({ ...filters, timeTo: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="events-filter__section" ref={countryDropdownRef}>
                        <label className="events-filter__label">Страна</label>
                        <div className="events-filter__multi-select">
                            <button
                                className="events-filter__multi-select-trigger"
                                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                type="button"
                            >
                                <span>
                                    {filters.countries.length === 0
                                        ? "Все страны"
                                        : filters.countries.length === countryOptions.length
                                        ? "Все страны"
                                        : `Выбрано: ${filters.countries.length}`}
                                </span>
                                <span className={`events-filter__multi-select-arrow${isCountryDropdownOpen ? " events-filter__multi-select-arrow--open" : ""}`}>
                                    ▼
                                </span>
                            </button>
                            {isCountryDropdownOpen && (
                                <div className="events-filter__dropdown">
                                    <div className="events-filter__dropdown-header">
                                        <button className="events-filter__select-all" onClick={handleSelectAll}>
                                            {filters.countries.length === countryOptions.length ? "Снять все" : "Выбрать все"}
                                        </button>
                                    </div>
                                    <div className="events-filter__dropdown-search">
                                        <input
                                            type="text"
                                            className="events-filter__search-input"
                                            value={countrySearch}
                                            onChange={(e) => setCountrySearch(e.target.value)}
                                            placeholder="Поиск страны..."
                                        />
                                    </div>
                                    <div className="events-filter__dropdown-list">
                                        {filteredCountries.length === 0 && (
                                            <div className="events-filter__no-results">Ничего не найдено</div>
                                        )}
                                        {filteredCountries.map((country) => (
                                            <label key={country.id} className="events-filter__checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    className="events-filter__checkbox"
                                                    checked={filters.countries.includes(country.id)}
                                                    onChange={() => handleCountryToggle(country.id)}
                                                />
                                                <span className="events-filter__checkbox-text">{country.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="events-filter__section" ref={typeDropdownRef}>
                        <label className="events-filter__label">Тип события</label>
                        <div className="events-filter__multi-select">
                            <button
                                className="events-filter__multi-select-trigger"
                                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                type="button"
                            >
                                <span>
                                    {filters.eventTypes.length === 0
                                        ? "Все типы"
                                        : filters.eventTypes.length === eventTypeOptions.length
                                        ? "Все типы"
                                        : `Выбрано: ${filters.eventTypes.length}`}
                                </span>
                                <span className={`events-filter__multi-select-arrow${isTypeDropdownOpen ? " events-filter__multi-select-arrow--open" : ""}`}>
                                    ▼
                                </span>
                            </button>
                            {isTypeDropdownOpen && (
                                <div className="events-filter__dropdown">
                                    <div className="events-filter__dropdown-header">
                                        <button className="events-filter__select-all" onClick={handleTypeSelectAll}>
                                            {filters.eventTypes.length === eventTypeOptions.length ? "Снять все" : "Выбрать все"}
                                        </button>
                                    </div>
                                    <div className="events-filter__dropdown-search">
                                        <input
                                            type="text"
                                            className="events-filter__search-input"
                                            value={typeSearch}
                                            onChange={(e) => setTypeSearch(e.target.value)}
                                            placeholder="Поиск типа..."
                                        />
                                    </div>
                                    <div className="events-filter__dropdown-list">
                                        {filteredEventTypes.length === 0 && (
                                            <div className="events-filter__no-results">Ничего не найдено</div>
                                        )}
                                        {filteredEventTypes.map((type) => (
                                            <label key={type.id} className="events-filter__checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    className="events-filter__checkbox"
                                                    checked={filters.eventTypes.includes(type.id)}
                                                    onChange={() => handleTypeToggle(type.id)}
                                                />
                                                <span className="events-filter__checkbox-text">{type.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
