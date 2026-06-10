from django.db import migrations, models
import uuid


def create_indexes(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('formular', '0009_alter_marker_height'),
    ]

    operations = [
        migrations.CreateModel(
            name='Event',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False, unique=True, verbose_name='Уникальный идентификатор')),
                ('title', models.CharField(max_length=255, verbose_name='Название события')),
                ('object_name', models.CharField(blank=True, max_length=255, verbose_name='Объект')),
                ('description', models.TextField(blank=True, verbose_name='Описание')),
                ('date_start', models.DateField(blank=True, null=True, verbose_name='Дата начала')),
                ('date_end', models.DateField(blank=True, null=True, verbose_name='Дата завершения')),
                ('time_start', models.TimeField(blank=True, null=True, verbose_name='Время начала')),
                ('time_end', models.TimeField(blank=True, null=True, verbose_name='Время завершения')),
                ('shape', models.JSONField(blank=True, default=dict, verbose_name='Геометрия')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создано')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Обновлено')),
                ('country', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='events', to='formular.country', verbose_name='Страна')),
                ('marker', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='events', to='formular.marker', verbose_name='Маркер события')),
            ],
            options={
                'verbose_name': 'Событие',
                'verbose_name_plural': 'События',
            },
        ),
        migrations.AddIndex(
            model_name='event',
            index=models.Index(fields=['date_start'], name='formular_ev_date_st_6b5b3a_idx'),
        ),
        migrations.AddIndex(
            model_name='event',
            index=models.Index(fields=['date_end'], name='formular_ev_date_en_2c0b1d_idx'),
        ),
        migrations.AddIndex(
            model_name='event',
            index=models.Index(fields=['country'], name='formular_ev_country_86ac4b_idx'),
        ),
    ]
