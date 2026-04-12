from django.db import models
from django.db import transaction
# Create your models here.

class Task(models.Model):
    class PriorityLevel(models.TextChoices):
        LEVEL_1 = 'THREAT_LEVEL_RED', 'THREAT_LEVEL_RED'
        LEVEL_2 = 'NODE_VALIDATION','NODE_VALIDATION'
        LEVEL_3 = 'GHOST_PROTOCOL', 'GHOST_PROTOCOL'

    name = models.CharField(max_length=100, blank=False)
    description = models.TextField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    duration = models.DurationField()
    completed = models.BooleanField(default=False)

    priority_level = models.CharField(
        max_length=100,
        choices=PriorityLevel.choices,
        default=PriorityLevel.LEVEL_3
    )

    is_active = models.BooleanField(default=False) 



    def save(self, *args, **kwargs):
        if self.is_active:
            with transaction.atomic():
                Task.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)

        super().save(*args, **kwargs)



