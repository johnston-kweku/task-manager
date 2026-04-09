from django.shortcuts import render
from .models import Task

# Create your views here.

def home(request):
    tasks = Task.objects.filter(completed=False).count()
    return render(request, 'main_app/index.html', {'tasks':tasks})