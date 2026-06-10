import { useCallback } from 'react';

/**
 * Хук для управления массивом actions в формах Target
 * @param {Object} formData - Данные формы
 * @param {Function} setFormData - Функция обновления данных формы
 * @returns {Object} Обработчики для работы с actions
 */
export const useActionsArray = (formData, setFormData) => {
  /**
   * Добавить новый action в массив
   */
  const handleAddAction = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { action_type_id: '', radius: '' }]
    }));
  }, [setFormData]);

  /**
   * Удалить action по индексу
   * @param {number} index - Индекс удаляемого action
   */
  const handleRemoveAction = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  }, [setFormData]);

  /**
   * Изменить значение поля в action
   * @param {number} index - Индекс action
   * @param {string} field - Название поля
   * @param {any} value - Новое значение
   */
  const handleActionChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newActions = [...prev.actions];
      newActions[index] = { ...newActions[index], [field]: value };
      return { ...prev, actions: newActions };
    });
  }, [setFormData]);

  return { handleAddAction, handleRemoveAction, handleActionChange };
};
