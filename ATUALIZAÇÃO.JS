document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. CONFIGURAÇÃO DE TEMA (DARK/LIGHT) ---
    const body = document.querySelector('body');
    const iconTema = document.getElementById('icon-tema');
    const textTema = document.getElementById('text-tema');

    // Recupera o tema salvo no navegador
    const temaSalvo = localStorage.getItem('theme');

    // Aplica o tema salvo ao iniciar
    if (temaSalvo === 'dark') {
        body.classList.add('dark');
        updateThemeIcons(true);
    }

    // Função acessível pelo botão HTML (window. para ser global)
    window.alternarTema = function() {
        const isDark = body.classList.toggle('dark');
        
        // Salva a preferência
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Atualiza ícones e textos
        updateThemeIcons(isDark);
        
        // Força atualização do gráfico para corrigir cores das legendas
        renderDashboard(); 
    };

    function updateThemeIcons(isDark) {
        if (!iconTema || !textTema) return;
        
        if (isDark) {
            iconTema.classList.remove('fa-moon');
            iconTema.classList.add('fa-sun');
            textTema.innerText = "Light Mode";
        } else {
            iconTema.classList.remove('fa-sun');
            iconTema.classList.add('fa-moon');
            textTema.innerText = "Dark Mode";
        }
    }

    // --- 2. DADOS E LÓGICA DO DASHBOARD ---
    let contratos = [
        { id: 101, cliente: "Maria Silva", valor: 5000.00, data: "2023-12-16", status: "Digitação" },
        { id: 102, cliente: "João Souza", valor: 12500.50, data: "2023-12-16", status: "Formalização" },
        { id: 103, cliente: "Pedro Santos", valor: 3200.00, data: "2023-12-15", status: "Andamento" },
        { id: 104, cliente: "Ana Costa", valor: 15000.00, data: "2023-12-15", status: "Pago Cliente" },
        { id: 105, cliente: "Carlos Lima", valor: 800.00, data: "2023-12-14", status: "Pendência" },
        { id: 106, cliente: "Fernanda Dias", valor: 4500.00, data: "2023-12-14", status: "Cancelado" },
    ];

    // Mapeamento de Cores para a Tabela (CSS Variables)
    const colorMap = {
        "Digitação": "var(--success-color)",
        "Formalização": "var(--formalizacao-color)", 
        "Andamento": "var(--info-color)",
        "Pago Cliente": "var(--pago-color)",
        "Pendência": "var(--warning-color)",
        "Cancelado": "var(--danger-color)"
    };

    let myChart = null; // Variável para controlar o gráfico

    // Formatação de Dinheiro
    function formatMoney(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Função Principal de Renderização (Global)
    window.renderDashboard = function() {
        let stats = {
            "Digitação": { qtd: 0, val: 0 },
            "Formalização": { qtd: 0, val: 0 },
            "Andamento": { qtd: 0, val: 0 },
            "Pago Cliente": { qtd: 0, val: 0 },
            "Pendência": { qtd: 0, val: 0 },
            "Cancelado": { qtd: 0, val: 0 }
        };

        let totalHojeVal = 0;
        let totalHojeQtd = 0;
        let totalGeralVal = 0;
        const hoje = "2023-12-16"; 

        // Processamento dos Dados
        contratos.forEach(c => {
            if (stats[c.status]) {
                stats[c.status].qtd++;
                stats[c.status].val += c.valor;
            }
            
            totalGeralVal += c.valor;
            if (c.data === hoje) {
                totalHojeVal += c.valor;
                totalHojeQtd++;
            }
        });

        // Atualização Segura dos Elementos HTML
        safeSetText('kpi-producao-hoje', formatMoney(totalHojeVal));
        safeSetText('kpi-contratos-hoje', `${totalHojeQtd} Contratos`);
        safeSetText('kpi-producao-total', formatMoney(totalGeralVal));
        safeSetText('kpi-contratos-total', `${contratos.length} Contratos`);

        let ticketMedio = contratos.length > 0 ? totalGeralVal / contratos.length : 0;
        safeSetText('kpi-ticket-medio', formatMoney(ticketMedio));

        let qtdPagos = stats["Pago Cliente"] ? stats["Pago Cliente"].qtd : 0;
        let efetivacao = contratos.length > 0 ? (qtdPagos / contratos.length) * 100 : 0;
        safeSetText('kpi-efetivacao', `${efetivacao.toFixed(1)}%`);

        // Atualiza os Cards Pequenos Coloridos
        updateCard("digitacao", stats["Digitação"]);
        updateCard("formalizacao", stats["Formalização"]);
        updateCard("andamento", stats["Andamento"]);
        updateCard("pago", stats["Pago Cliente"]);
        updateCard("pendencia", stats["Pendência"]);
        updateCard("cancelado", stats["Cancelado"]);

        // Renderiza Tabela e Gráfico
        renderTable();
        renderChart(stats);
    };

    // Helper para evitar erro se o ID não existir
    function safeSetText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }

    function updateCard(idSufix, data) {
        safeSetText(`card-${idSufix}-valor`, formatMoney(data ? data.val : 0));
        safeSetText(`card-${idSufix}-qtd`, `${data ? data.qtd : 0} contratos`);
    }

    function renderTable() {
        const tbody = document.getElementById('table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        contratos.forEach(c => {
            let color = colorMap[c.status] || '#999';
            let textColor = "#fff"; // Texto branco no badge para contraste
            
            let tr = `
                <tr>
                    <td>#${c.id}</td>
                    <td>${c.cliente}</td>
                    <td>${formatMoney(c.valor)}</td>
                    <td>${c.data}</td>
                    <td>
                        <span class="badge" style="background-color: ${color}; color: ${textColor}">
                            ${c.status}
                        </span>
                    </td>
                    <td>
                        <button class="btn-action" onclick="openEditModal(${c.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += tr;
        });
    }
// --- ATUALIZAÇÃO: FUNÇÃO DO GRÁFICO COM PORCENTAGEM ---
function renderChart(stats) {
    // Verifica se a biblioteca foi carregada
    if (typeof Chart === 'undefined') return;

    const ctx = document.getElementById('meuGrafico');
    if (!ctx) return;

    // Cores (Mantendo seu padrão)
    const backgroundColors = [
        '#10B981', // Digitação (Verde)
        '#88858d', // Formalização (Cinza)
        '#3B82F6', // Andamento (Azul)
        '#009688', // Pago (Petróleo)
        '#F59E0B', // Pendência (Amarelo)
        '#EF4444'  // Cancelado (Vermelho)
    ];

    const labels = Object.keys(stats);
    const dataValues = labels.map(key => stats[key].val);

    // Configuração de Tema (Cores do texto/borda)
    const isDark = body.classList.contains('dark');
    const textColor = isDark ? '#F5F5F5' : '#525252';
    const borderColor = isDark ? '#1A1A1A' : '#FFFFFF';

    if (myChart) myChart.destroy();

    // REGISTRA O PLUGIN MANUALMENTE (Para garantir que funcione)
    Chart.register(ChartDataLabels);

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Volume (R$)',
                data: dataValues,
                backgroundColor: backgroundColors,
                borderColor: borderColor,
                borderWidth: 2,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                // --- CONFIGURAÇÃO DA LEGENDA ---
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                // --- CONFIGURAÇÃO DO TOOLTIP ---
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) label += ': ';
                            label += context.raw.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            return label;
                        }
                    }
                },
                // --- NOVA CONFIGURAÇÃO: PORCENTAGEM (DATALABELS) ---
                datalabels: {
                    color: '#fff', // Cor do texto da porcentagem (Branco destaca bem)
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    formatter: (value, ctx) => {
                        let sum = 0;
                        let dataArr = ctx.chart.data.datasets[0].data;
                        
                        // Soma todos os valores para saber o 100%
                        dataArr.map(data => {
                            sum += data;
                        });

                        // Se a soma for 0 ou o valor for 0, não mostra nada
                        if (sum === 0 || value === 0) return "";

                        // Calcula a porcentagem
                        let percentage = (value * 100 / sum).toFixed(1) + "%";
                        return percentage;
                    },
                    anchor: 'center',
                    align: 'center',
                    offset: 0
                }
            },
            cutout: '60%' // Espessura da rosca
        }
    });
}

    // --- INTERATIVIDADE (MODAIS E BOTÕES) ---
    // Precisam ser window.funcao para funcionar no HTML onclick=""

    const modalOverlay = document.getElementById('editModal');

    window.openEditModal = function(id) {
        const contrato = contratos.find(c => c.id === id);
        if(contrato && modalOverlay) {
            document.getElementById('modal-id').value = contrato.id;
            document.getElementById('modal-cliente').value = contrato.cliente;
            document.getElementById('modal-status').value = contrato.status;
            modalOverlay.style.display = 'flex';
        }
    };

    window.closeModal = function() {
        if (modalOverlay) modalOverlay.style.display = 'none';
    };

    window.saveManualChange = function() {
        const id = parseInt(document.getElementById('modal-id').value);
        const newStatus = document.getElementById('modal-status').value;
        const index = contratos.findIndex(c => c.id === id);
        if(index !== -1) {
            contratos[index].status = newStatus;
        }
        closeModal();
        renderDashboard();
    };

    window.simularImportacao = function() {
        const statuses = ["Digitação", "Formalização", "Andamento", "Pago Cliente", "Pendência", "Cancelado"];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        const novoContrato = { 
            id: Math.floor(Math.random() * 1000) + 1000, 
            cliente: "Cliente " + Math.floor(Math.random() * 100), 
            valor: Math.random() * 10000, 
            data: "2023-12-16", 
            status: randomStatus 
        };
        contratos.push(novoContrato);
        renderDashboard();
    };

    // Inicializa o dashboard assim que o JS carregar
    renderDashboard();
});