import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Хук для управления dropdown с поиском
 * @param {Array} items - Массив элементов для отображения (должны иметь поле title)
 * @param {Function} onSelect - Callback при выборе элемента
 * @returns {Object} Состояние и методы управления dropdown
 */
export const useDropdownWithSearch = (items, onSelect) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  /**
   * Фильтрованный список элементов по поисковому запросу
   */
  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  /**
   * Переключить состояние открытия/закрытия dropdown
   */
  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  /**
   * Выбрать элемент и закрыть dropdown
   * @param {number|string} id - ID выбранного элемента
   */
  const handleSelect = useCallback((id) => {
    onSelect(id);
    setIsOpen(false);
    setSearch('');
  }, [onSelect]);

  /**
   * Закрыть dropdown и очистить поиск
   */
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearch('');
  }, []);

  /**
   * Обработка клика вне dropdown для его закрытия
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClose]);

  /**
   * Автофокус на поле поиска при открытии dropdown
   */
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  return {
    isOpen,
    search,
    setSearch,
    filtered,
    dropdownRef,
    searchInputRef,
    handleToggle,
    handleSelect,
    handleClose
  };
};
