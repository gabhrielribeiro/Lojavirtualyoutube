from django.contrib import admin
from . models import Produto, Categoria

class ProdutoCustomizado(admin.ModelAdmin):
    list_display = ['titulo', 'preco', 'quantidade']
    search_fields = ['titulo']
    list_filter = ['disponivel']
    

admin.site.register(Produto, ProdutoCustomizado)
admin.site.register(Categoria)



