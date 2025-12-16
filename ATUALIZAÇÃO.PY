import pandas as pd
from sqlalchemy import create_engine, text

# Conexão com o Banco (Ajuste sua string de conexão)
engine = create_engine('postgresql://user:senha@localhost/nexus_db')

# Mapeamento: Status que vem do Excel -> Status do seu Dashboard
DE_PARA_STATUS = {
    "AGUARD. DIGIT.": "Digitação",
    "PENDENTE ASSIN.": "Formalização",
    "EM ANALISE": "Andamento",
    "PAGO": "Pago Cliente",
    "PENDENCIA": "Pendência",
    "CANCELADO": "Cancelado"
}

def processar_relatorio(arquivo_path):
    # 1. Lê o arquivo
    df = pd.read_excel(arquivo_path) # ou pd.read_csv
    
    # 2. Renomeia colunas do Excel para bater com seu banco
    # Exemplo: A coluna do excel chama 'Contrato', no banco é 'proposta'
    df = df.rename(columns={
        'Contrato': 'proposta',
        'CPF': 'cpf',
        'Nome': 'nome',
        'Valor': 'valor_parcela_simulacao',
        'StatusAtual': 'status_raw' # Status cru do banco
    })
    
    # 3. Aplica o De/Para de Status
    df['status'] = df['status_raw'].map(DE_PARA_STATUS).fillna('Outros')

    # 4. Inserção Inteligente (Iterando ou usando fast_executemany)
    # Aqui vou mostrar a lógica SQL pura que deve ser executada para cada linha
    
    with engine.connect() as conn:
        for index, row in df.iterrows():
            query = text("""
                INSERT INTO nexus_portabilidade 
                (proposta, cpf, nome, status, valor_parcela_simulacao, origem_atualizacao, updated_at)
                VALUES 
                (:proposta, :cpf, :nome, :status, :valor, 'IMPORTACAO', NOW())
                ON CONFLICT (proposta) 
                DO UPDATE SET
                    status = EXCLUDED.status,
                    updated_at = NOW(),
                    origem_atualizacao = 'IMPORTACAO'
                WHERE 
                    nexus_portabilidade.travar_automacao = FALSE -- O SEGREDO ESTÁ AQUI
                    AND nexus_portabilidade.status IS DISTINCT FROM EXCLUDED.status;
            """)
            
            conn.execute(query, {
                "proposta": row['proposta'],
                "cpf": row['cpf'],
                "nome": row['nome'],
                "status": row['status'],
                "valor": row['valor_parcela_simulacao']
            })
            
        conn.commit()
    print("Importação concluída com sucesso.")