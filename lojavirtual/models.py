from django.db import models




# Create your models here.
from django.db import models
from django.utils import timezone



class Categoria(models.Model):
    titulo = models.CharField(max_length=100)

    def __str__(self):
        return self.titulo
    

    
# Create your models here.

class Produto(models.Model):
    titulo = models.CharField(max_length=100)
    desc = models.TextField(blank=True, null=True)
    foto = models.ImageField(upload_to='produto/')
    slug = models.SlugField(unique=True)
    preco = models.DecimalField(max_digits=8, decimal_places=2)
    detalhes = models.TextField(blank=True, null=True)
    quantidade = models.IntegerField(default=20)
    disponivel = models.BooleanField(default=True)
    data = models.DateTimeField(default=timezone.now)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, related_name='produto', blank=True, null=True )

