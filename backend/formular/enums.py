from infolake.enums import BaseEnum
from django.db import models

class Colors(BaseEnum):
    """Доступные цвета маркера"""

    blue = 'синий'
    green = 'зеленый'
    red = 'красный'
    yellow = 'желтый'
    marine = 'морской'

class ActionAnimations(models.TextChoices):
    """Типы анимаций для действий на карте"""

    GRADIENT = 'gradient', 'Градиент'
    RADAR = 'radar', 'Радар'
    WAVE = 'wave', 'Волна'
    PULSE = 'pulse', 'Пульсация'
    RINGS = 'rings', 'Кольца'
    SECTOR = 'sector', 'Сектор'
    ALERT = 'alert', 'Тревога'
    DASHED_ROTATE = 'dashed_rotate', 'Вращающийся пунктир'