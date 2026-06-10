import os
import mimetypes

from django.core.exceptions import ValidationError

def validate_svg(file_obj):
    """Валидация на соответствие формату *.svg"""

    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext != ".svg":
        raise ValidationError(
            "Разрешена загрузка только svg файлов"
        )
    
    mime_type, _ = mimetypes.guess_type(file_obj.name)
    if mime_type != "image/svg+xml":
        raise ValidationError(
            "Файл не является корректным SVG-изображением(скыдыщ!)"
        )