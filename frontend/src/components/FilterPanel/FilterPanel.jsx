import { useState, useMemo, useRef, useEffect } from 'react';
import './FilterPanel.css';

export default function FilterPanel({ objects, filterCountry, onFilterCountryChange, filterType, onFilterTypeChange, filterTitle, onFilterTitleChange }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");
    const [typeSearch, setTypeSearch] = useState("");
    const countryDropdownRef = useRef(null);
    const typeDropdownRef = useRef(null);

    // Получаем уникальные страны из объектов
    const countries = useMemo(() => {
        const uniqueCountries = [...new Set(objects.map(obj => obj.country.title))];
        return uniqueCountries.sort();
    }, [objects]);

    const filteredCountries = useMemo(() => {
        if (!countrySearch.trim()) return countries;
        const needle = countrySearch.trim().toLowerCase();
        const matched = countries.filter((country) => country.toLowerCase().includes(needle));
        const selected = countries.filter((country) => filterCountry.includes(country));
        return [...new Set([...selected, ...matched])];
    }, [countries, countrySearch, filterCountry]);

    const types = useMemo(() => {
        const uniqueTypes = objects
            .map(obj => obj.type?.title)
            .filter(Boolean);
        return [...new Set(uniqueTypes)].sort();
    }, [objects]);

    const filteredTypes = useMemo(() => {
        if (!typeSearch.trim()) return types;
        const needle = typeSearch.trim().toLowerCase();
        return types.filter((type) => type.toLowerCase().includes(needle));
    }, [types, typeSearch]);

    const handleCountryToggle = (country) => {
        if (filterCountry.includes(country)) {
            // Удаляем страну из фильтра
            onFilterCountryChange(filterCountry.filter(c => c !== country));
        } else {
            // Добавляем страну в фильтр
            onFilterCountryChange([...filterCountry, country]);
        }
    };

    const handleSelectAll = () => {
        if (filterCountry.length === countries.length) {
            // Снять выбор со всех
            onFilterCountryChange([]);
        } else {
            // Выбрать все
            onFilterCountryChange([...countries]);
        }
    };

    const handleReset = () => {
        onFilterCountryChange([]);
        onFilterTypeChange([]);
        onFilterTitleChange("");
        setCountrySearch("");
        setTypeSearch("");
    };

    const activeFiltersCount = filterCountry.length + filterType.length;
    const titleFilterActive = Boolean(filterTitle?.trim());
    const totalActiveFilters = activeFiltersCount + (titleFilterActive ? 1 : 0);

    // Закрытие dropdown при клике вне
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isCountryDropdownOpen && countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
                setIsCountryDropdownOpen(false);
            }
            if (isTypeDropdownOpen && typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
                setIsTypeDropdownOpen(false);
            }
        };

        if (isCountryDropdownOpen || isTypeDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCountryDropdownOpen, isTypeDropdownOpen]);

    return (
        <div className="filter-panel">
            <div className="filter-panel__header">
                <button 
                    className="filter-panel__toggle"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="filter-panel__title">Фильтры</span>
                    {totalActiveFilters > 0 && (
                        <span className="filter-panel__badge">{totalActiveFilters}</span>
                    )}
                    <svg 
                        className={`filter-panel__chevron${isExpanded ? ' filter-panel__chevron--expanded' : ''}`}
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none"
                    >
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                {totalActiveFilters > 0 && (
                    <button 
                        className="filter-panel__reset"
                        onClick={handleReset}
                        title="Сбросить все фильтры"
                    >
                        Сбросить
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="filter-panel__content">
                    <div className="filter-panel__section" ref={countryDropdownRef}>
                        <label className="filter-panel__label">
                            Страна
                        </label>
                        <div className="filter-panel__multi-select">
                            <button
                                className="filter-panel__multi-select-trigger"
                                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                type="button"
                            >
                                <span className="filter-panel__multi-select-text">
                                    {filterCountry.length === 0 
                                        ? 'Все страны' 
                                        : filterCountry.length === countries.length
                                        ? 'Все страны'
                                        : `Выбрано: ${filterCountry.length}`}
                                </span>
                                <svg 
                                    className={`filter-panel__multi-select-arrow${isCountryDropdownOpen ? ' filter-panel__multi-select-arrow--open' : ''}`}
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24" 
                                    fill="none"
                                >
                                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>

                            {isCountryDropdownOpen && (
                                <div className="filter-panel__dropdown">
                                    <div className="filter-panel__dropdown-header">
                                        <button
                                            className="filter-panel__select-all"
                                            onClick={handleSelectAll}
                                            type="button"
                                        >
                                            {filterCountry.length === countries.length 
                                                ? 'Снять все' 
                                                : 'Выбрать все'}
                                        </button>
                                    </div>
                                    <div className="filter-panel__dropdown-search">
                                        <input
                                            type="text"
                                            className="filter-panel__search-input"
                                            value={countrySearch}
                                            onChange={(e) => setCountrySearch(e.target.value)}
                                            placeholder="Поиск страны..."
                                        />
                                    </div>
                                    <div className="filter-panel__dropdown-list">
                                        {filteredCountries.length === 0 && (
                                            <div className="filter-panel__no-results">Ничего не найдено</div>
                                        )}
                                        {filteredCountries.map(country => (
                                            <label 
                                                key={country} 
                                                className="filter-panel__checkbox-label"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="filter-panel__checkbox"
                                                    checked={filterCountry.includes(country)}
                                                    onChange={() => handleCountryToggle(country)}
                                                />
                                                <span className="filter-panel__checkbox-text">
                                                    {country}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="filter-panel__section" ref={typeDropdownRef}>
                        <label className="filter-panel__label">
                            Тип объекта
                        </label>
                        <div className="filter-panel__multi-select">
                            <button
                                className="filter-panel__multi-select-trigger"
                                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                type="button"
                            >
                                <span className="filter-panel__multi-select-text">
                                    {filterType.length === 0
                                        ? 'Все типы'
                                        : filterType.length === types.length
                                        ? 'Все типы'
                                        : `Выбрано: ${filterType.length}`}
                                </span>
                                <svg 
                                    className={`filter-panel__multi-select-arrow${isTypeDropdownOpen ? ' filter-panel__multi-select-arrow--open' : ''}`}
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 24 24" 
                                    fill="none"
                                >
                                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>

                            {isTypeDropdownOpen && (
                                <div className="filter-panel__dropdown">
                                    <div className="filter-panel__dropdown-header">
                                        <button
                                            className="filter-panel__select-all"
                                            onClick={() => {
                                                if (filterType.length === types.length) {
                                                    onFilterTypeChange([]);
                                                } else {
                                                    onFilterTypeChange([...types]);
                                                }
                                            }}
                                            type="button"
                                        >
                                            {filterType.length === types.length 
                                                ? 'Снять все' 
                                                : 'Выбрать все'}
                                        </button>
                                    </div>
                                    <div className="filter-panel__dropdown-search">
                                        <input
                                            type="text"
                                            className="filter-panel__search-input"
                                            value={typeSearch}
                                            onChange={(e) => setTypeSearch(e.target.value)}
                                            placeholder="Поиск типа..."
                                        />
                                    </div>
                                    <div className="filter-panel__dropdown-list">
                                        {filteredTypes.length === 0 && (
                                            <div className="filter-panel__no-results">Ничего не найдено</div>
                                        )}
                                        {filteredTypes.map(type => (
                                            <label 
                                                key={type} 
                                                className="filter-panel__checkbox-label"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="filter-panel__checkbox"
                                                    checked={filterType.includes(type)}
                                                    onChange={() => {
                                                        if (filterType.includes(type)) {
                                                            onFilterTypeChange(filterType.filter(t => t !== type));
                                                        } else {
                                                            onFilterTypeChange([...filterType, type]);
                                                        }
                                                    }}
                                                />
                                                <span className="filter-panel__checkbox-text">
                                                    {type}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="filter-panel__section">
                        <label className="filter-panel__label" htmlFor="object-title-filter">
                            Наименование
                        </label>
                        <input
                            id="object-title-filter"
                            type="text"
                            className="filter-panel__input"
                            value={filterTitle}
                            onChange={(e) => onFilterTitleChange(e.target.value)}
                            placeholder="Поиск по названию"
                        />
                    </div>

                    {/* Место для будущих фильтров */}
                    {/* <div className="filter-panel__section">
                        <label className="filter-panel__label" htmlFor="marker-filter">
                            Тип маркера
                        </label>
                        <select
                            id="marker-filter"
                            className="filter-panel__select"
                            value={filterMarker}
                            onChange={handleMarkerChange}
                        >
                            <option value="">Все типы</option>
                        </select>
                    </div> */}
                </div>
            )}
        </div>
    );
}
