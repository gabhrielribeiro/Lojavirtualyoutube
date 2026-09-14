from django.shortcuts import render
from . models import Produto, Categoria



# Create your views here.

def home(request):

    categoria = request.GET.get('cat')
    busca = request.GET.get('q')

    lista_produto = Produto.objects.all()

    if categoria and categoria != 'Todos':
        lista_produto = lista_produto.filter(
            categoria__titulo=categoria
        )

    if busca:
        lista_produto = lista_produto.filter(
            titulo__icontains=busca
        )

    

    return render(request, 'index.html', {
        'lista_produto': lista_produto
    })

def produto(request, slug):
    produto = Produto.objects.get(slug=slug)
    return render(request, 'produto.html', {'produto':produto})



def carinho(request):
    return render(request, 'carinho.html')