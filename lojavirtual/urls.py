from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('produto/<slug:slug>/', views.produto, name='produto'),
    path('carinho', views.carinho, name="carinho")
    
   
    
    
   
]