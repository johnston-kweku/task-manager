from django.db import models

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



