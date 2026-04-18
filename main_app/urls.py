from django.urls import path
from . import views

urlpatterns = [
    path('', views.command_center_view, name='home'),
    path('tasks/activate/<int:task_id>/', views.activate_task, name='activate_task'),
    path('tasks/complete/<int:task_id>/', views.complete_task, name='complete_task'),
    path('tasks/delete/<int:task_id>/', views.delete_task, name='delete_task'),
    path('tasks/create/', views.create_task, name='create_task'),
    path('tasks/update/<int:pk>/', views.update_task, name='update_task'),
    path('tasks/deactivate/<int:task_id>/', views.deactivate_task, name='deactivate_task'),
    path('fetch/page/<str:page_name>/', views.fetch_page, name='fetch_page'),
    path('commandCenter/', views.command_center_view, name='command_center'),
    path('taskNebula/', views.task_nebula_view, name='task_nebula'),
    path('focusChamber/', views.focus_chamber_view, name='focus_chamber'),
    path('timelineMatrix/', views.timeline_matrix_view, name='timeline_matrix'),

    path('fetch/page/<str:page_name>/', views.fetch_page, name='fetch_page'),
]