from django.db import models

# Create your models here.

class Task(models.Model):
    class PriorityLevel(models.TextChoices):
        LEVEL_1 = '1', '1'
        LEVEL_2 = '2','2'
        LEVEL_3 = '3', '3'
        
    name = models.CharField(max_length=100, blank=False)
    description = models.TextField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    duration = models.DurationField()
    completed = models.BooleanField(default=False)
    priority_level = models.CharField(
        max_length=10,
        choices=PriorityLevel.choices,
        default=PriorityLevel.LEVEL_1
    )



