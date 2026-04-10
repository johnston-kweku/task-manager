from django.shortcuts import render
from .models import Task

# Create your views here.

def home(request):
    tasks = Task.objects.filter(completed=False)
    return render(request, 'main_app/index.html', {'tasks':tasks})



def command_center(request):
    # Context data for your charts (we'll make this real later)
    context = {
        'tasks_completed': 12,
        'uptime': "10:04:22",
    }
    
    # Check if the request header says it's from our AJAX call
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return render(request, 'main_app/partials/command_center.html', context)
    
    # Otherwise, return the full page wrapper
    return render(request, 'main_app/index.html', context)
