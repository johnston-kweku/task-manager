from django.db import models

# Create your models here.

class Task(models.Model):
    name = models.CharField(max_length=100, blank=False)
    description = models.TextField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    duration = models.DurationField()
    completed = models.BooleanField(default=False)

    
