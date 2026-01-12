#!/usr/bin/env python3
import sqlite3
import os

# Lista de bancos de dados encontrados
bancos_dados = [
    '/root/INOVAPRO/isa-1.0-de9193c7/contas/758322/memoria_ia.db',
    '/root/INOVAPRO/isa-1.0-de9193c7/contas/666058/memoria_ia.db',
    '/root/INOVAPRO/isa-1.0-de9193c7/.wwebjs_auth/session-11978197645/Default/databases/Databases.db',
    '/root/INOVAPRO/isa-1.0-de9193c7/whatsapp.db',
    '/root/INOVAPRO/isa-1.0-de9193c7/data/wa_memory.db'
]

def analisar_banco(db_path):
    print(f"\n{'='*60}")
    print(f"📊 ANALISANDO: {db_path}")
    print('='*60)
    
    if not os.path.exists(db_path):
        print(f"❌ Arquivo não encontrado: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Listar todas as tabelas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tabelas = cursor.fetchall()
        
        print(f"📋 Tabelas encontradas ({len(tabelas)}):")
        for tabela in tabelas:
            print(f"  • {tabela[0]}")
        
        # Procurar tabelas que possam conter produtos
        tabelas_produtos = []
        for tabela in tabelas:
            nome_tabela = tabela[0].lower()
            if any(palavra in nome_tabela for palavra in ['produto', 'product', 'item', 'catalogo', 'catalog', 'mercadoria', 'servico', 'service']):
                tabelas_produtos.append(tabela[0])
        
        if tabelas_produtos:
            print(f"\n🛍️ TABELAS DE PRODUTOS/SERVIÇOS ENCONTRADAS:")
            for nome_tabela in tabelas_produtos:
                print(f"\n  📦 {nome_tabela}")
                
                # Estrutura da tabela
                cursor.execute(f"PRAGMA table_info({nome_tabela});")
                colunas = cursor.fetchall()
                print("  Colunas:")
                for coluna in colunas:
                    print(f"    • {coluna[1]} ({coluna[2]})")
                
                # Dados da tabela
                cursor.execute(f"SELECT * FROM {nome_tabela};")
                produtos = cursor.fetchall()
                
                print(f"  Total de registros: {len(produtos)}")
                if produtos:
                    print("  Dados:")
                    for i, produto in enumerate(produtos[:10], 1):  # Mostrar até 10 produtos
                        print(f"    {i}. {dict(zip([col[1] for col in colunas], produto))}")
                    if len(produtos) > 10:
                        print(f"    ... e mais {len(produtos) - 10} produtos")
        else:
            # Mostrar algumas tabelas para ver o tipo de dados
            if tabelas:
                print(f"\n📄 AMOSTRA DE OUTRAS TABELAS:")
                for tabela in tabelas[:3]:  # Mostrar até 3 tabelas
                    nome_tabela = tabela[0]
                    print(f"\n  📋 {nome_tabela}")
                    
                    # Estrutura
                    cursor.execute(f"PRAGMA table_info({nome_tabela});")
                    colunas = cursor.fetchall()
                    print(f"  Colunas: {', '.join([col[1] for col in colunas])}")
                    
                    # Amostra de dados
                    cursor.execute(f"SELECT * FROM {nome_tabela} LIMIT 3;")
                    dados = cursor.fetchall()
                    if dados:
                        print(f"  Amostra: {dados[0] if dados else 'Sem dados'}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro ao analisar banco: {e}")

# Analisar todos os bancos
print("🔍 PROCURANDO POR PRODUTOS EM TODOS OS BANCOS DE DADOS")
print("="*70)

for db_path in bancos_dados:
    analisar_banco(db_path)

print("\n" + "="*70)
print("✅ Análise concluída!")