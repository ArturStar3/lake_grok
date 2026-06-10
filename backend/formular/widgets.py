# widgets.py
from django.forms.widgets import RadioSelect
from django.utils.html import format_html
from django.utils.safestring import mark_safe


class ColorRadioSelect(RadioSelect):
    """
    RadioSelect, где подпись – готовый HTML‑фрагмент
    (цветной квадратик + русская подпись).  Мы явно помечаем
    label как safe, чтобы Django не экранировал его.
    """

    def __init__(self, enum_cls, *args, **kwargs):
        """
        enum_cls – ваш Enum (Colors).
        Формируем choices вида:
            (value, safe_label)
        где:
            value      – machine code (member.name) – сохраняется в БД.
            safe_label – HTML с цветным квадратом + подпись.
        """
        choices = [
            (
                member.name,                         # сохраняем в БД: 'blue', 'green' …
                mark_safe(                           # гарантируем, что Django не экранирует
                    format_html(
                        '<span style="display:inline-block;width:14px;height:14px;'
                        'background:{};border:1px solid #000;margin-right:4px;"></span> {}',
                        member.name,               # CSS‑цвет (blue, green, …)
                        member.value               # подпись «синий», «зеленый» …
                    )
                ),
            )
            for member in enum_cls
        ]

        super().__init__(choices=choices, *args, **kwargs)

    # -----------------------------------------------------------------
    # На старых версиях Django (≤3.0) нужно переопределить create_option,
    # чтобы label, уже помеченный safe, не был повторно экранирован.
    # -----------------------------------------------------------------
    def create_option(self, name, value, label, selected, index, subindex=None, attrs=None):
        option = super().create_option(
            name, value, label, selected, index, subindex=subindex, attrs=attrs
        )
        # label уже SafeString (помечен mark_safe), но на всякий случай:
        option['label'] = mark_safe(option['label'])
        return option