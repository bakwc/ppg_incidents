from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('incidents', '0029_alter_incident_reserve_use'),
    ]

    operations = [
        migrations.AlterField(
            model_name='incident',
            name='factor_accelerator',
            field=models.CharField(blank=True, choices=[('not_used', 'Not used'), ('released', 'Released'), ('partially_engaged', 'Partially engaged'), ('fully_engaged', 'Fully engaged')], max_length=20, null=True, verbose_name='Accelerator position'),
        ),
    ]

