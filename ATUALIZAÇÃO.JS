document.addEventListener("DOMContentLoaded", function () {
    
  // --- 1. CONFIGURAÇÃO DE TEMA (DARK/LIGHT) ---
  const body = document.querySelector("body");
  const iconTema = document.getElementById("icon-tema");
  const textTema = document.getElementById("text-tema");

  const temaSalvo = localStorage.getItem("theme");

  if (temaSalvo === "dark") {
    body.classList.add("dark");
    updateThemeIcons(true);
  } else {
    updateThemeIcons(false);
  }

  window.alternarTema = function () {
    const isDark = body.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateThemeIcons(isDark);
    
    // Atualiza o dashboard mantendo os filtros
    const inicio = document.getElementById("data-inicio").value;
    const fim = document.getElementById("data-fim").value;
    renderDashboard(inicio, fim);
  };

  function updateThemeIcons(isDark) {
    if (!iconTema || !textTema) return;
    if (isDark) {
      iconTema.classList.replace("fa-moon", "fa-sun");
      textTema.innerText = "Light Mode";
    } else {
      iconTema.classList.replace("fa-sun", "fa-moon");
      textTema.innerText = "Dark Mode";
    }
  }

  // --- 2. DADOS (COM CAMPOS PARA BUSCA) ---
  let contratos = [
    { id: 101, cliente: "Maria Silva", cpf: "123.456.789-00", telefone: "(11) 99999-0001", valor: 5000.0, data: "2023-12-16", status: "Digitação" },
    { id: 102, cliente: "João Souza", cpf: "234.567.890-11", telefone: "(21) 98888-0002", valor: 12500.5, data: "2023-12-16", status: "Formalização" },
    { id: 103, cliente: "Pedro Santos", cpf: "345.678.901-22", telefone: "(31) 97777-0003", valor: 3200.0, data: "2023-12-15", status: "Andamento" },
    { id: 104, cliente: "Ana Costa", cpf: "456.789.012-33", telefone: "(41) 96666-0004", valor: 15000.0, data: "2023-12-15", status: "Pago Cliente" },
    { id: 105, cliente: "Carlos Lima", cpf: "567.890.123-44", telefone: "(51) 95555-0005", valor: 800.0, data: "2023-12-14", status: "Pendência" },
    { id: 106, cliente: "Fernanda Dias", cpf: "678.901.234-55", telefone: "(61) 94444-0006", valor: 4500.0, data: "2023-12-14", status: "Cancelado" },
  ];

  let myChart = null; 
  let myLineChart = null;

  // --- 3. LÓGICA DE FILTRAGEM E BUSCA ---
  
  // Filtro por Data
  window.aplicarFiltro = function () {
    const inicio = document.getElementById("data-inicio").value;
    const fim = document.getElementById("data-fim").value;

    if (!inicio || !fim) {
      alert("Por favor, selecione a data inicial e a data final.");
      return;
    }
    if (new Date(inicio) > new Date(fim)) {
      alert("A data inicial não pode ser maior que a data final.");
      return;
    }
    renderDashboard(inicio, fim);
  };

  // Busca por Texto (Chamada ao digitar)
  window.aplicarBusca = function() {
      // Apenas recarrega o dashboard, a lógica de filtro está dentro do renderDashboard
      const inicio = document.getElementById("data-inicio").value;
      const fim = document.getElementById("data-fim").value;
      renderDashboard(inicio, fim);
  };

  // --- 4. RENDERIZAÇÃO DO DASHBOARD (CORE) ---
  window.renderDashboard = function (filtroInicio = null, filtroFim = null) {
    let listaParaProcessar = contratos;

    // A. Filtro de Data (Se houver)
    if (filtroInicio && filtroFim) {
      listaParaProcessar = contratos.filter((c) => {
        return c.data >= filtroInicio && c.data <= filtroFim;
      });
    }

    // B. Filtro de Pesquisa (Texto + Tipo)
    const termoBusca = document.getElementById("input-busca") ? document.getElementById("input-busca").value.toLowerCase() : "";
    const tipoBusca = document.getElementById("tipo-busca") ? document.getElementById("tipo-busca").value : "nome";

    if (termoBusca) {
        listaParaProcessar = listaParaProcessar.filter((c) => {
            // Normaliza os dados para evitar erros
            const nome = (c.cliente || "").toLowerCase();
            const matricula = (c.id || "").toString();
            const cpf = (c.cpf || "").toLowerCase(); 
            const telefone = (c.telefone || "").toLowerCase();

            // Verifica qual tipo foi escolhido no dropdown
            if (tipoBusca === "nome") return nome.includes(termoBusca);
            if (tipoBusca === "matricula") return matricula.includes(termoBusca);
            if (tipoBusca === "cpf") return cpf.includes(termoBusca);
            if (tipoBusca === "telefone") return telefone.includes(termoBusca);
            
            return false;
        });
    }

    // C. Estatísticas e Totais
    let stats = {
      Digitação: { qtd: 0, val: 0 }, Formalização: { qtd: 0, val: 0 },
      Andamento: { qtd: 0, val: 0 }, "Pago Cliente": { qtd: 0, val: 0 },
      Pendência: { qtd: 0, val: 0 }, Cancelado: { qtd: 0, val: 0 },
    };

    let totalHojeVal = 0;
    let totalHojeQtd = 0;
    let totalGeralVal = 0;
    const hoje = "2023-12-16"; 

    listaParaProcessar.forEach((c) => {
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

    // Atualiza HTML
    safeSetText("kpi-producao-hoje", formatMoney(totalHojeVal));
    safeSetText("kpi-contratos-hoje", `${totalHojeQtd} Contratos`);

    const labelTotal = filtroInicio ? "Produção (Filtro)" : "Produção Total";
    const kpiTitle = document.querySelector("#kpi-producao-total");
    if (kpiTitle && kpiTitle.previousElementSibling)
      kpiTitle.previousElementSibling.innerText = labelTotal;

    safeSetText("kpi-producao-total", formatMoney(totalGeralVal));
    safeSetText("kpi-contratos-total", `${listaParaProcessar.length} Contratos`);

    let ticketMedio = listaParaProcessar.length > 0 ? totalGeralVal / listaParaProcessar.length : 0;
    safeSetText("kpi-ticket-medio", formatMoney(ticketMedio));

    let qtdPagos = stats["Pago Cliente"] ? stats["Pago Cliente"].qtd : 0;
    let efetivacao = listaParaProcessar.length > 0 ? (qtdPagos / listaParaProcessar.length) * 100 : 0;
    safeSetText("kpi-efetivacao", `${efetivacao.toFixed(1)}%`);

    // Atualiza Cards Coloridos
    updateCard("digitacao", stats["Digitação"]);
    updateCard("formalizacao", stats["Formalização"]);
    updateCard("andamento", stats["Andamento"]);
    updateCard("pago", stats["Pago Cliente"]);
    updateCard("pendencia", stats["Pendência"]);
    updateCard("cancelado", stats["Cancelado"]);

    // Renderiza Componentes
    renderTable(listaParaProcessar);
    renderChart(stats); 
    renderLineChart(listaParaProcessar); 
  };

  // --- HELPER FUNCTIONS ---
  function formatMoney(value) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  }

  function updateCard(idSufix, data) {
    safeSetText(`card-${idSufix}-valor`, formatMoney(data ? data.val : 0));
    safeSetText(`card-${idSufix}-qtd`, `${data ? data.qtd : 0} contratos`);
  }

  // --- TABELA ---
  function renderTable(lista) {
    const tbody = document.getElementById("table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (lista.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #666;">Nenhum contrato encontrado.</td></tr>';
      return;
    }

    function getStatusClass(status) {
      switch (status) {
        case "Digitação": case "Pago Cliente": return "status-success";
        case "Formalização": return "status-neutral";
        case "Andamento": return "status-info";
        case "Pendência": return "status-warning";
        case "Cancelado": return "status-danger";
        default: return "status-neutral";
      }
    }

    lista.forEach((c) => {
      let cssClass = getStatusClass(c.status);
      let tr = `
          <tr>
              <td style="color: var(--text-muted, #94a3b8); font-size: 0.85rem;">#${c.id}</td>
              <td style="font-weight: 500; color: var(--text-color, #fff);">${c.cliente}</td>
              <td style="font-family: monospace; font-size: 0.9rem; color: var(--text-color, #fff);">${formatMoney(c.valor)}</td>
              <td style="color: var(--text-muted, #94a3b8);">${c.data.split("-").reverse().join("/")}</td>
              <td><span class="status-badge ${cssClass}">${c.status}</span></td>
              <td>
                  <div style="display: flex; gap: 8px;">
                      <button class="btn-action btn-edit" onclick="openEditModal(${c.id})" title="Editar">
                          <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn-action btn-delete" onclick="excluirContrato(${c.id})" title="Excluir">
                          <i class="fas fa-trash"></i>
                      </button>
                  </div>
              </td>
          </tr>`;
      tbody.innerHTML += tr;
    });
  }

  // --- AÇÕES DE CONTRATO ---
  window.excluirContrato = function(id) {
      if (confirm("Tem certeza que deseja excluir o contrato #" + id + "?")) {
          const index = contratos.findIndex(c => c.id === id);
          if (index > -1) {
              contratos.splice(index, 1);
              const inicio = document.getElementById('data-inicio').value;
              const fim = document.getElementById('data-fim').value;
              renderDashboard(inicio, fim);
          }
      }
  };

  // --- GRÁFICOS ---
  function renderChart(stats) {
    if (typeof Chart === "undefined") return;
    const ctx = document.getElementById("meuGrafico");
    if (!ctx) return;

    const isDark = body.classList.contains("dark");
    const textColor = isDark ? "#F1F5F9" : "#334155";
    const borderColor = isDark ? "#1e293b" : "#ffffff";

    const labels = Object.keys(stats);
    const dataValues = labels.map((key) => stats[key].val);
    const backgroundColors = ["#10B981", "#94a3b8", "#3B82F6", "#059669", "#F59E0B", "#EF4444"];

    if (myChart) myChart.destroy();
    Chart.register(ChartDataLabels);

    myChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
            data: dataValues,
            backgroundColor: backgroundColors,
            borderColor: borderColor,
            borderWidth: 2,
          }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: textColor, usePointStyle: true, padding: 15, font: { size: 11 } } },
          datalabels: {
            color: "#fff",
            font: { weight: "bold", size: 11 },
            formatter: (value, ctx) => {
              let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              return sum === 0 || value === 0 ? "" : ((value * 100) / sum).toFixed(1) + "%";
            },
          },
        },
        cutout: "60%",
      },
    });
  }

  function renderLineChart(dadosFiltrados) {
    if (typeof Chart === "undefined") return;
    const ctx = document.getElementById("graficoLinha");
    if (!ctx) return;

    const fonteDados = dadosFiltrados || contratos;
    const todasDatas = [...new Set(fonteDados.map((c) => c.data))].sort();

    if (todasDatas.length === 0) {
      if (myLineChart) myLineChart.destroy();
      return;
    }

    const statusColors = {
      Digitação: "#10B981", Formalização: "#94a3b8", Andamento: "#3B82F6",
      "Pago Cliente": "#059669", Pendência: "#F59E0B", Cancelado: "#EF4444",
    };

    const datasets = Object.keys(statusColors).map((status) => {
      const dataPoints = todasDatas.map((data) => {
        return fonteDados
          .filter((c) => c.data === data && c.status === status)
          .reduce((sum, c) => sum + c.valor, 0);
      });

      return {
        label: status,
        data: dataPoints,
        borderColor: statusColors[status],
        backgroundColor: statusColors[status],
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        fill: false,
      };
    });

    const labelsFormatadas = todasDatas.map((d) => d.split("-").reverse().slice(0, 2).join("/"));
    const isDark = document.body.classList.contains("dark");
    const textColor = isDark ? "#cbd5e1" : "#64748b";
    const gridColor = isDark ? "#334155" : "#e2e8f0";

    if (myLineChart) myLineChart.destroy();

    myLineChart = new Chart(ctx, {
      type: "line",
      data: { labels: labelsFormatadas, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: "top", labels: { color: textColor, usePointStyle: true, boxWidth: 8, padding: 20, font: { size: 11 } } },
          tooltip: { mode: "index", intersect: false },
          datalabels: { display: false },
        },
        scales: {
          x: { grid: { display: false, color: gridColor }, ticks: { color: textColor } },
          y: { grid: { color: gridColor, borderDash: [5, 5] }, ticks: { color: textColor, callback: (v) => "R$ " + v }, beginAtZero: true },
        },
        interaction: { mode: "nearest", axis: "x", intersect: false },
      },
    });
  }

  // --- LÓGICA DE MODAIS ---
  const modalOverlay = document.getElementById("editModal");
  window.openEditModal = function (id) {
    const contrato = contratos.find((c) => c.id === id);
    if (contrato && modalOverlay) {
      document.getElementById("modal-id").value = contrato.id;
      document.getElementById("modal-cliente").value = contrato.cliente;
      document.getElementById("modal-status").value = contrato.status;
      modalOverlay.style.display = "flex";
    }
  };
  window.closeModal = function () { if (modalOverlay) modalOverlay.style.display = "none"; };

  window.saveManualChange = function () {
    const id = parseInt(document.getElementById("modal-id").value);
    const index = contratos.findIndex((c) => c.id === id);
    if (index !== -1)
      contratos[index].status = document.getElementById("modal-status").value;
    closeModal();
    const inicio = document.getElementById("data-inicio").value;
    const fim = document.getElementById("data-fim").value;
    renderDashboard(inicio, fim);
  };

  const addModalOverlay = document.getElementById('addModal');
  window.openAddModal = function() {
      if(addModalOverlay) {
          document.getElementById('new-cliente').value = '';
          document.getElementById('new-valor').value = '';
          document.getElementById('new-data').value = new Date().toISOString().split('T')[0];
          document.getElementById('new-status').value = 'Digitação';
          addModalOverlay.style.display = 'flex';
      }
  };
  window.closeAddModal = function() { if(addModalOverlay) addModalOverlay.style.display = 'none'; };

  window.saveNewContrato = function() {
      const cliente = document.getElementById('new-cliente').value;
      const valorInput = document.getElementById('new-valor').value;
      const data = document.getElementById('new-data').value;
      const status = document.getElementById('new-status').value;

      if (!cliente || !valorInput || !data) {
          alert("Por favor, preencha o nome, valor e data.");
          return;
      }

      const maiorId = contratos.length > 0 ? Math.max(...contratos.map(c => c.id)) : 100;
      const novoId = maiorId + 1;

      // Adiciona com dados dummy para manter a busca funcionando
      const novoContrato = {
          id: novoId,
          cliente: cliente,
          cpf: "000.000.000-00", // CPF Dummy
          telefone: "(00) 00000-0000", // Tel Dummy
          valor: parseFloat(valorInput),
          data: data,
          status: status
      };

      contratos.push(novoContrato);
      closeAddModal();
      const inicio = document.getElementById('data-inicio').value;
      const fim = document.getElementById('data-fim').value;
      renderDashboard(inicio, fim);
  };

  window.simularImportacao = function () {
    const statuses = ["Digitação", "Formalização", "Andamento", "Pago Cliente"];
    const dias = ["2023-12-14", "2023-12-15", "2023-12-16", "2023-12-17"];
    const dataRand = dias[Math.floor(Math.random() * dias.length)];

    contratos.push({
      id: Math.floor(Math.random() * 1000) + 1000,
      cliente: "Cliente Simulado " + Math.floor(Math.random() * 100),
      cpf: "111.222.333-44",
      telefone: "(11) 91234-5678",
      valor: Math.random() * 10000,
      data: dataRand,
      status: statuses[Math.floor(Math.random() * statuses.length)],
    });

    const inicio = document.getElementById("data-inicio").value;
    const fim = document.getElementById("data-fim").value;
    renderDashboard(inicio, fim);
  };

  // Inicializa o dashboard
  renderDashboard();
});