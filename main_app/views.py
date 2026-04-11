from django.shortcuts import render
from django.db.models import Count
from .models import Task


# Create your views here.

def home(request):
    tasks = Task.objects.filter(completed=False)

    completed_tasks = Task.objects.filter(completed=True).count()
    total_tasks = Task.objects.all().count()

    sync_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    sync_rate = round(sync_rate, 1)

    active_task = Task.objects.filter(is_active=True).first()
    context = {
        'tasks':tasks,
        'sync_rate':sync_rate,
        'active_task':active_task
    }
    return render(request, 'main_app/index.html', context) 



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
