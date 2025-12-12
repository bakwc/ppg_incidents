from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('incidents', '0028_add_factor_ground_object_collision'),
    ]

    operations = [
        migrations.AlterField(
            model_name='incident',
            name='reserve_use',
            field=models.CharField(blank=True, choices=[('not_installed', 'Not installed'), ('not_deployed', 'Not deployed'), ('no_time', 'Did not have time to open'), ('tangled', 'Became tangled'), ('partially_opened', 'Partially opened'), ('fully_opened', 'Fully opened')], max_length=30, null=True),
        ),
    ]

