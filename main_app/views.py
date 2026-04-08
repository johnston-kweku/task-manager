from django.shortcuts import render
from .models import Task

# Create your views here.

def home(request):
    return render(request, 'main_app/index.html')