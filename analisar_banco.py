#!/usr/bin/env python3
import sqlite3
import json

# Conectar ao banco de dados
db_path = '/root/INOVAPRO/isa-1.0-de9193c7/whatsapp.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("📊 ANÁLISE DO BANCO DE DADOS WHATSAPP")
print("=" * 50)

# Listar todas as tabelas
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tabelas = cursor.fetchall()

print(f"📋 Tabelas encontradas ({len(tabelas)}):")
for tabela in tabelas:
    print(f"  • {tabela[0]}")

print("\n" + "=" * 50)

# Analisar cada tabela
for tabela in tabelas:
    nome_tabela = tabela[0]
    print(f"\n🔍 TABELA: {nome_tabela}")
    print("-" * 30)
    
    # Obter estrutura da tabela
    cursor.execute(f"PRAGMA table_info({nome_tabela});")
    colunas = cursor.fetchall()
    
    print("Colunas:")
    for coluna in colunas:
        print(f"  • {coluna[1]} ({coluna[2]})")
    
    # Contar registros
    cursor.execute(f"SELECT COUNT(*) FROM {nome_tabela};")
    total_registros = cursor.fetchone()[0]
    print(f"Total de registros: {total_registros}")
    
    # Mostrar amostra de dados (primeiros 5 registros)
    if total_registros > 0:
        print("\nAmostra de dados (5 primeiros):")
        cursor.execute(f"SELECT * FROM {nome_tabela} LIMIT 5;")
        registros = cursor.fetchall()
        
        for i, registro in enumerate(registros, 1):
            print(f"  {i}. {registro}")
    
    print("\n" + "-" * 30)

# Procurar por tabelas que possam conter produtos
tabelas_produtos = []
for tabela in tabelas:
    nome_tabela = tabela[0].lower()
    if any(palavra in nome_tabela for palavra in ['produto', 'product', 'item', 'catalogo', 'catalog']):
        tabelas_produtos.append(tabela[0])

if tabelas_produtos:
    print(f"\n🛍️ TABELAS DE PRODUTOS ENCONTRADAS:")
    for tabela in tabelas_produtos:
        print(f"  • {tabela}")
        
        # Mostrar todos os produtos
        cursor.execute(f"SELECT * FROM {tabela};")
        produtos = cursor.fetchall()
        
        cursor.execute(f"PRAGMA table_info({tabela});")
        colunas = [col[1] for col in cursor.fetchall()]
        
        print(f"  Total de produtos: {len(produtos)}")
        print("  Produtos:")
        for produto in produtos:
            print(f"    - {dict(zip(colunas, produto))}")
else:
    print("\n🛍️ Nenhuma tabela de produtos encontrada")

conn.close()