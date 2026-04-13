from django.shortcuts import render, get_object_or_404, redirect
from django.db.models import Count
from .models import Task
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.template.loader import render_to_string
from django.http import HttpResponse, Http404
from datetime import timedelta
import json

# Create your views here.

def command_center_view(request):
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

@require_POST
def update_task(request, pk):
    data = json.loads(request.body)
    task = Task.objects.get(pk=pk)
    
    task.name = data.get('name', task.name)
    task.description = data.get('description', task.description)

    
    task.save()
    return JsonResponse({'status': 'success'})

@require_POST
def deactivate_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    task.is_active = False

    task.save()
    return JsonResponse({
        'status':'success',
        'message':'Neural Link Severed'
    })


def fetch_page(request, page_name):
    templates = {
        'commandCenter': 'partials/command_center.html',
        'taskNebula': 'partials/task_nebula.html'
    }

    template_path = templates.get(page_name)
    if not template_path:
        return HttpResponse("Sector Invalid", status=404)


    context = get_dashboard_context()


    html = render_to_string(template_path, context, request=request)
    return HttpResponse(html)



def get_dashboard_context():
    tasks = Task.objects.filter(completed=False).order_by('-priority_level')
    total = Task.objects.count()
    completed = Task.objects.filter(completed=True).count()
    sync_rate = round((completed / total * 100), 1) if total > 0 else 0
    
    return {
        'tasks': tasks,
        'sync_rate': sync_rate,
        'active_task': Task.objects.filter(is_active=True).first()
    }

# This handles initial page loads/refreshes
def command_center_view(request):
    context = get_dashboard_context()
    context['initial_page'] = 'partials/command_center.html'
    return render(request, 'main_app/index.html', context)

def task_nebula_view(request):
    context = get_dashboard_context()
    context['initial_page'] = 'main_app/partials/task_nebula.html'
    return render(request, 'main_app/index.html', context)