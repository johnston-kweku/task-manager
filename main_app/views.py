from django.shortcuts import render, get_object_or_404, redirect
from django.db.models import Count
from .models import Task
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from datetime import timedelta


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


def activate_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    task.is_active = True

    task.save()
    return JsonResponse({
        'status':'success',
        'message':'Neural Sync Initiated Successfully'
    })


@require_POST
def complete_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    task.completed = True
    task.is_active = False
    task.save()
    return JsonResponse({"status": "success", "message": "Node Validated and Archived"})

@require_POST
def delete_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    task.delete()
    return JsonResponse({"status": "success", "message": "Node Terminated"})


@require_POST
def toggle_pause_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)

    return JsonResponse({
        'status':'success',
        'message':'Signal Interrupted/Resumed'
    })


def create_task(request):
    if request.method == "POST":
        name = request.POST.get('name')
        minutes = int(request.POST.get('minutes', 0))
        priority = request.POST.get('priority_level')
        description = request.POST.get('description', '')

        Task.objects.create(
            name=name,
            duration=timedelta(minutes=minutes),
            priority_level=priority,
            description=description
        )
        return redirect('home') # or wherever your main view