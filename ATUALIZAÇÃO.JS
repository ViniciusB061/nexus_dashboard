// --- 1. CONFIGURAÇÃO DE TEMA (DARK/LIGHT) ---
const body = document.querySelector('body');
const iconTema = document.getElementById('icon-tema');
const textTema = document.getElementById('text-tema');

// Verifica se o usuário já tinha escolhido um tema antes
if (localStorage.getItem('tema') === 'escuro') {
    ativarModoEscuro();
}

function alternarTema() {
    if (body.classList.contains('modo-escuro')) {
        desativarModoEscuro();
    } else {
        ativarModoEscuro();
    }
}

function ativarModoEscuro() {
    body.classList.add('modo-escuro');
    localStorage.setItem('tema', 'escuro');
    iconTema.classList.remove('fa-moon');
    iconTema.classList.add('fa-sun');
    textTema.innerText = "Modo Claro";
}

function desativarModoEscuro() {
    body.classList.remove('modo-escuro');
    localStorage.setItem('tema', 'claro');
    iconTema.classList.remove('fa-sun');
    iconTema.classList.add('fa-moon');
    textTema.innerText = "Modo Escuro";
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

const colorMap = {
    "Digitação": "var(--verde-sucesso)",
    "Formalização": "var(--roxo-formalizacao)",
    "Andamento": "var(--azul-info)",
    "Pago Cliente": "var(--petroleo-pago)",
    "Pendência": "var(--amarelo-principal)",
    "Cancelado": "var(--vermelho-erro)"
};

// --- Formatação e Renderização ---

function formatMoney(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderDashboard() {
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

    updateCard("digitacao", stats["Digitação"]);
    updateCard("formalizacao", stats["Formalização"]);
    updateCard("andamento", stats["Andamento"]);
    updateCard("pago", stats["Pago Cliente"]);
    updateCard("pendencia", stats["Pendência"]);
    updateCard("cancelado", stats["Cancelado"]);

    document.getElementById('kpi-producao-hoje').innerText = formatMoney(totalHojeVal);
    document.getElementById('kpi-contratos-hoje').innerText = `${totalHojeQtd} Contratos`;
    document.getElementById('kpi-producao-total').innerText = formatMoney(totalGeralVal);
    document.getElementById('kpi-contratos-total').innerText = `${contratos.length} Contratos`;

    let ticketMedio = contratos.length > 0 ? totalGeralVal / contratos.length : 0;
    document.getElementById('kpi-ticket-medio').innerText = formatMoney(ticketMedio);

    let qtdPagos = stats["Pago Cliente"].qtd;
    let efetivacao = contratos.length > 0 ? (qtdPagos / contratos.length) * 100 : 0;
    document.getElementById('kpi-efetivacao').innerText = `${efetivacao.toFixed(1)}%`;

    renderTable();
}

function updateCard(idSufix, data) {
    const elValor = document.getElementById(`card-${idSufix}-valor`);
    const elQtd = document.getElementById(`card-${idSufix}-qtd`);
    if (elValor && elQtd) {
        elValor.innerText = formatMoney(data.val);
        elQtd.innerText = `${data.qtd} contratos`;
    }
}

function renderTable() {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    contratos.forEach(c => {
        // Correção para cor do texto no badge de pendência
        let color = colorMap[c.status] || '#999';
        let textColor = c.status === "Pendência" ? "var(--texto-no-amarelo)" : "#fff";

        let tr = `
            <tr>
                <td>#${c.id}</td>
                <td>${c.cliente}</td>
                <td>${formatMoney(c.valor)}</td>
                <td>${c.data}</td>
                <td><span class="badge" style="background-color: ${color}; color: ${textColor}">${c.status}</span></td>
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

// --- Interatividade ---

const modalOverlay = document.getElementById('editModal');

function openEditModal(id) {
    const contrato = contratos.find(c => c.id === id);
    if(contrato) {
        document.getElementById('modal-id').value = contrato.id;
        document.getElementById('modal-cliente').value = contrato.cliente;
        document.getElementById('modal-status').value = contrato.status;
        modalOverlay.style.display = 'flex';
    }
}

function closeModal() {
    modalOverlay.style.display = 'none';
}

function saveManualChange() {
    const id = parseInt(document.getElementById('modal-id').value);
    const newStatus = document.getElementById('modal-status').value;
    const index = contratos.findIndex(c => c.id === id);
    if(index !== -1) {
        contratos[index].status = newStatus;
    }
    closeModal();
    renderDashboard();
}

function simularImportacao() {
    const novoContrato = { 
        id: Math.floor(Math.random() * 1000) + 1000, 
        cliente: "Cliente " + Math.floor(Math.random() * 100), 
        valor: Math.random() * 10000, 
        data: "2023-12-16", 
        status: "Formalização" 
    };
    contratos.push(novoContrato);
    renderDashboard();
}

renderDashboard();