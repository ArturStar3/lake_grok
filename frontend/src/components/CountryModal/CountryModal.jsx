import { useEffect, useState } from "react";
import axios from "axios";
import EditCountryModal from "../EditCountryModal/EditCountryModal";
import "./CountryModal.css";
import { API_URL } from "../../config/api";

const API_ROOT = API_URL;

export default function CountryModal({ countryIso, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [countryId, setCountryId] = useState(null);
    const [country, setCountry] = useState(null);
    const [countryExists, setCountryExists] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [attachmentsBySection, setAttachmentsBySection] = useState({});
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        if (!countryIso) return;

        const fetchAttachments = async (id) => {
            try {
                const response = await axios.get(`${API_ROOT}/api/v1/country-attachments/`, {
                    params: { country: id }
                });
                const grouped = {};
                (response.data || []).forEach((item) => {
                    if (!grouped[item.section]) {
                        grouped[item.section] = [];
                    }
                    grouped[item.section].push(item);
                });
                setAttachmentsBySection(grouped);
            } catch (err) {
                console.warn('Ошибка загрузки изображений страны:', err);
            }
        };

        const fetchCountryData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Проверяем существование страны в БД
                const countriesResponse = await axios.get(`${API_ROOT}/api/v1/countries/`);
                const country = countriesResponse.data.find(c => c.iso_code === countryIso);
                
                if (country) {
                    setCountryId(country.id);
                    setCountry(country);
                    setCountryExists(true);
                    await fetchAttachments(country.id);
                    
                    // Загружаем информацию о стране
                    try {
                        const response = await axios.get(`${API_ROOT}/api/v1/country/${countryIso}/`);
                        setData(response.data);
                    } catch (err) {
                        // Если CountryInfo не найдено, это нормально
                        if (err.response?.status === 404) {
                            setData([]);
                        } else {
                            throw err;
                        }
                    }
                } else {
                    setCountryExists(false);
                    setData(null);
                    setAttachmentsBySection({});
                }
            } catch (err) {
                setError("Не удалось загрузить информацию о стране");
                console.error("Error fetching country data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCountryData();
    }, [countryIso]);

    // Группировка секций
    const organizeData = () => {
        if (!data || !Array.isArray(data)) return { standalone: [], groups: [] };

        const isChildSection = (child, parent) => {
            if (!child?.parent) return false;
            const parentId = parent.id;
            const parentTitle = parent.title;

            if (typeof child.parent === 'object') {
                return child.parent.id === parentId;
            }
            if (typeof child.parent === 'number') {
                return child.parent === parentId;
            }
            return child.parent === parentTitle;
        };

        const getParentTitle = (parentValue) => {
            if (!parentValue) return null;
            if (typeof parentValue === 'object') return parentValue.title;
            const parentSection = sorted.find(s => s.section.id === parentValue);
            return parentSection?.section?.title || parentValue;
        };

        // Сортируем по order
        const getOrderValue = (value) => {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : 9999;
        };
        const sorted = [...data].sort(
            (a, b) => getOrderValue(a.section.order) - getOrderValue(b.section.order)
        );

        const standalone = [];
        const groupsMap = new Map();

        sorted.forEach(item => {
            const { section, content } = item;

            // Пропускаем скрытые секции без дочерних элементов
            if (section.is_hidden && !section.parent) {
                // Проверяем есть ли дочерние элементы
                const hasChildren = sorted.some(s => isChildSection(s.section, section));
                if (!hasChildren) {
                    return; // Не отображаем
                }
            }

            if (section.parent) {
                // Это подсекция
                const parentKey = typeof section.parent === 'object' ? section.parent.id : section.parent;
                const parentTitle = getParentTitle(section.parent);
                const groupKey = parentKey || parentTitle;

                if (!groupsMap.has(groupKey)) {
                    groupsMap.set(groupKey, {
                        title: parentTitle,
                        items: []
                    });
                }
                groupsMap.get(groupKey).items.push({
                    title: section.title,
                    content: content,
                    sectionId: section.id
                });
            } else if (!section.is_hidden) {
                // Обычная секция
                standalone.push({
                    title: section.title,
                    content: content,
                    sectionId: section.id
                });
            }
        });

        return {
            standalone,
            groups: Array.from(groupsMap.values())
        };
    };

    // Получаем название страны (первая секция с is_hidden=true и title="Название")
    const getCountryName = () => {
        if (!data || !Array.isArray(data)) return "Информация о стране";
        const nameSection = data.find(item => 
            item.section.title === "Название" && item.section.is_hidden
        );
        return nameSection ? nameSection.content : "Информация о стране";
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    
    const handleCountryUpdated = async (updatedCountry) => {
        // Обновляем информацию после сохранения
        setCountryId(updatedCountry.id);
        setCountry(updatedCountry);
        setCountryExists(true);
        
        // Перезагружаем данные CountryInfo
        try {
            const response = await axios.get(`${API_ROOT}/api/v1/country/${countryIso}/`);
            setData(response.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setData([]);
            }
        }

        try {
            const attachmentsResponse = await axios.get(`${API_ROOT}/api/v1/country-attachments/`, {
                params: { country: updatedCountry.id }
            });
            const grouped = {};
            (attachmentsResponse.data || []).forEach((item) => {
                if (!grouped[item.section]) {
                    grouped[item.section] = [];
                }
                grouped[item.section].push(item);
            });
            setAttachmentsBySection(grouped);
        } catch (err) {
            console.warn('Ошибка загрузки изображений страны:', err);
        }
    };

    const renderAttachments = (sectionId) => {
        const attachments = attachmentsBySection[sectionId] || [];
        if (attachments.length === 0) return null;

        return (
            <div className="country-modal__attachments">
                {attachments.map((item) => (
                    <div key={item.id} className="country-modal__attachment-card">
                        <button
                            type="button"
                            className="country-modal__attachment-thumb"
                            onClick={() => setPreviewImage(item)}
                        >
                            <img src={item.image} alt={item.title} />
                        </button>
                        <div className="country-modal__attachment-info">
                            <strong>{item.title}</strong>
                            {item.description && <p>{item.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const { standalone, groups } = organizeData();
    const countryName = country?.title || "Информация о стране";

    return (
        <>
            <div className="country-modal-overlay" onClick={handleOverlayClick}>
                <div className="country-modal">
                    <div className="country-modal__header">
                        <h2 className="country-modal__title">{countryName}</h2>
                        <div className="country-modal__header-actions">
                            {!loading && !error && (
                                <button
                                    className="country-modal__edit-btn"
                                    onClick={() => setIsEditModalOpen(true)}
                                    aria-label={countryExists ? "Редактировать страну" : "Добавить страну"}
                                    title={countryExists ? "Редактировать страну" : "Добавить страну"}
                                >
                                    {countryExists ? '✏️' : '➕'}
                                </button>
                            )}
                            <button 
                                className="country-modal__close" 
                                onClick={onClose}
                                aria-label="Закрыть"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                    <div className="country-modal__body">
                        {loading && (
                            <div className="country-modal__loading">Загрузка...</div>
                        )}
                        
                        {error && (
                            <div className="country-modal__error">{error}</div>
                        )}
                        
                        {!loading && !error && !countryExists && (
                            <div className="country-modal__no-data">
                                <p>Страна не найдена в базе данных.</p>
                                <p>Нажмите кнопку "➕" чтобы добавить страну.</p>
                            </div>
                        )}
                        
                        {!loading && !error && countryExists && (
                            <>
                                {standalone.length === 0 && groups.length === 0 && (
                                    <div className="country-modal__no-data">
                                        <p>Информация о стране отсутствует.</p>
                                    </div>
                                )}
                                
                                {/* Отдельные секции */}
                                {standalone.map((section, index) => (
                                    <div key={`section-${index}`} className="country-modal__section">
                                        <h3 className="country-modal__section-title">
                                            {section.title}
                                        </h3>
                                        <div className="country-modal__section-content">
                                            {section.content}
                                        </div>
                                        {renderAttachments(section.sectionId)}
                                    </div>
                                ))}

                                {/* Группы с подсекциями */}
                                {groups.map((group, index) => (
                                    <div key={`group-${index}`} className="country-modal__group">
                                        <h3 className="country-modal__group-title">
                                            {group.title}
                                        </h3>
                                        {group.items.map((item, idx) => (
                                            <div key={`subsection-${idx}`} className="country-modal__subsection">
                                                <div className="country-modal__subsection-title">
                                                    {item.title}
                                                </div>
                                                <div className="country-modal__subsection-content">
                                                    {item.content}
                                                </div>
                                                {renderAttachments(item.sectionId)}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {previewImage && (
                <div className="country-modal__image-preview" onClick={() => setPreviewImage(null)}>
                    <div className="country-modal__image-preview-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="country-modal__image-preview-close"
                            onClick={() => setPreviewImage(null)}
                            aria-label="Закрыть"
                        >
                            ×
                        </button>
                        <img src={previewImage.image} alt={previewImage.title} />
                        <div className="country-modal__image-preview-caption">
                            <strong>{previewImage.title}</strong>
                            {previewImage.description && <p>{previewImage.description}</p>}
                        </div>
                    </div>
                </div>
            )}
            
            {isEditModalOpen && (
                <EditCountryModal
                    countryId={countryId}
                    countryIso={countryIso}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onCountryUpdated={handleCountryUpdated}
                    isNewCountry={!countryExists}
                />
            )}
        </>
    );
}
