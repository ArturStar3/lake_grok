from django import forms
from django.utils.html import format_html

from .models import Country, Colors
from .widgets import ColorRadioSelect


class CountryForm(forms.ModelForm):
    class Meta:
        model = Country
        fields = '__all__'
        widgets = {
            'color': ColorRadioSelect(enum_cls=Colors),
        }