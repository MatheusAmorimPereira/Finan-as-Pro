/* ========================================
   FINANÇAS PRO - JavaScript Principal
   ======================================== */

// Global Variables
let investmentChart = null;
let dashboardChart = null;
let currentUser = null;
let savedSimulations = [];

// Initialize on DOM Load
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
  setupEventListeners();
  animateHeroValue();
  initCharts();
  checkUserSession();
});

/* ========================================
   INITIALIZATION
   ======================================== */

function initializeApp() {
  // Navbar scroll effect
  window.addEventListener("scroll", handleNavbarScroll);

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", smoothScroll);
  });

  // Initialize tooltips
  initTooltips();
}

function setupEventListeners() {
  // Money input formatting
  document.querySelectorAll(".money-input").forEach((input) => {
    input.addEventListener("input", function (e) {
      formatMoney(e.target);
    });
  });

  // Scenario inputs
  document.querySelectorAll("[data-scenario]").forEach((input) => {
    input.addEventListener("input", function () {
      calculateScenario(this.dataset.scenario);
    });
  });
}

function handleNavbarScroll() {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
}

function smoothScroll(e) {
  e.preventDefault();
  const target = this.getAttribute("href");
  if (target && target !== "#") {
    const element = document.querySelector(target);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
}

/* ========================================
   NAVIGATION
   ======================================== */

function toggleMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  menu.classList.toggle("active");
}

function scrollToSection(sectionId) {
  // Add # prefix if not present
  const selector = sectionId.startsWith("#") ? sectionId : "#" + sectionId;
  const section = document.querySelector(selector);
  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

/* ========================================
   MODALS
   ======================================== */

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function switchModal(fromModal, toModal) {
  closeModal(fromModal);
  setTimeout(() => {
    openModal(toModal);
  }, 300);
}

// Close modal on overlay click
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("modal-overlay")) {
    const modalId = e.target.id;
    closeModal(modalId);
  }
});

// Close modal on Escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.active").forEach((modal) => {
      closeModal(modal.id);
    });
  }
});

/* ========================================
   CALCULATOR FUNCTIONS
   ======================================== */

function formatMoney(input) {
  let value = input.value.replace(/\D/g, "");
  value = (value / 100).toFixed(2);
  value = value.replace(".", ",");
  value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  input.value = value;
}

function parseMoney(value) {
  if (typeof value === "string") {
    return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
  }
  return value || 0;
}

function calculate() {
  const initialValue = parseMoney(
    document.getElementById("initialValue").value,
  );
  const monthlyContribution = parseMoney(
    document.getElementById("monthlyContribution").value,
  );
  const interestRate =
    parseFloat(document.getElementById("interestRate").value) || 0;
  const rateType = document.getElementById("rateType").value;
  const period = parseInt(document.getElementById("period").value) || 0;
  const periodType = document.getElementById("periodType").value;
  const compounding = document.getElementById("compounding").value;

  // Converter taxa para taxa mensal
  let monthlyRate;
  if (rateType === "yearly") {
    // Taxa anual -> converter para mensal
    monthlyRate = interestRate / 100 / 12;
  } else {
    // Taxa mensal
    monthlyRate = interestRate / 100;
  }

  // Converter período para meses
  let months;
  if (periodType === "years") {
    months = period * 12;
  } else {
    months = period;
  }

  // Calcular juros compostos
  const result = calculateCompoundInterest(
    initialValue,
    monthlyContribution,
    monthlyRate,
    months,
    compounding,
  );

  // Update results
  updateResults(result);

  // Update charts
  updateInvestmentChart(result);

  // Update AI insights
  updateAIInsights(
    initialValue,
    monthlyContribution,
    monthlyRate,
    months,
    result,
  );

  // Update dashboard
  updateDashboard(result);
}

function getCompoundingPeriods(compounding) {
  switch (compounding) {
    case "monthly":
      return 12;
    case "yearly":
      return 1;
    case "daily":
      return 365;
    default:
      return 12;
  }
}

function calculateCompoundInterest(
  initial,
  monthly,
  rate,
  months,
  compounding,
) {
  // Taxa mensal efetiva baseada na capitalização
  let monthlyRate = rate;

  if (compounding === "yearly") {
    // Taxa anual -> taxa mensal equivalente
    monthlyRate = Math.pow(1 + rate, 1 / 12) - 1;
  } else if (compounding === "daily") {
    // Taxa diária -> taxa mensal equivalente
    monthlyRate = Math.pow(1 + rate, 30) - 1;
  }

  // Fórmula de juros compostos com aportes mensais:
  // VF = VP * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]

  const r = monthlyRate; // taxa mensal
  const n = months; // número de meses

  // Valor futuro do principal inicial
  const principalFV = initial * Math.pow(1 + r, n);

  // Valor futuro dos aportes mensais (série uniforme)
  const contributionsFV = monthly * ((Math.pow(1 + r, n) - 1) / r);

  // Valor final total
  const finalValue = principalFV + contributionsFV;

  // Total investido = principal + soma de todos os aportes
  const totalInvested = initial + monthly * n;

  // Juros acumulados = valor final - total investido
  const interestEarned = finalValue - totalInvested;

  // Rentabilidade = (juros / total investido) * 100
  const profitability =
    totalInvested > 0 ? (interestEarned / totalInvested) * 100 : 0;

  return {
    finalValue: finalValue,
    totalInvested: totalInvested,
    interestEarned: interestEarned,
    profitability: profitability,
    months: months,
  };
}

function updateResults(result) {
  document.getElementById("finalValue").textContent = formatCurrency(
    result.finalValue,
  );
  document.getElementById("totalInvested").textContent = formatCurrency(
    result.totalInvested,
  );
  document.getElementById("interestEarned").textContent = formatCurrency(
    result.interestEarned,
  );
  document.getElementById("profitability").textContent =
    result.profitability.toFixed(2) + "%";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatCurrencyInput(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/* ========================================
   CHARTS
   ======================================== */

function initCharts() {
  initInvestmentChart();
  initDashboardChart();
}

function initInvestmentChart() {
  const ctx = document.getElementById("investmentChart");
  if (!ctx) return;

  const initialValue =
    parseMoney(document.getElementById("initialValue").value) || 10000;
  const monthlyContribution =
    parseMoney(document.getElementById("monthlyContribution").value) || 500;
  const interestRate =
    parseFloat(document.getElementById("interestRate").value) || 1;
  const period = parseInt(document.getElementById("period").value) || 12;

  const labels = [];
  const investedData = [];
  const totalData = [];

  for (let i = 0; i <= period; i++) {
    labels.push(`Mês ${i}`);

    const monthlyRate = interestRate / 100;
    let invested = initialValue + monthlyContribution * i;
    let total = initialValue;

    for (let j = 0; j < i; j++) {
      total = total * (1 + monthlyRate) + monthlyContribution;
    }

    investedData.push(invested);
    totalData.push(total);
  }

  investmentChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Patrimônio Total",
          data: totalData,
          borderColor: "#00ff88",
          backgroundColor: "rgba(0, 255, 136, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: "#00ff88",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 2,
        },
        {
          label: "Total Investido",
          data: investedData,
          borderColor: "#3b82f6",
          backgroundColor: "transparent",
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "#3b82f6",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: "#a0a0a0",
            usePointStyle: true,
            padding: 20,
            font: {
              family: "Inter",
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor: "#1a1a1a",
          titleColor: "#fff",
          bodyColor: "#a0a0a0",
          borderColor: "#2a2a2a",
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function (context) {
              return context.dataset.label + ": " + formatCurrency(context.raw);
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.05)",
            drawBorder: false,
          },
          ticks: {
            color: "#666",
            font: {
              family: "Inter",
              size: 11,
            },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
          },
        },
        y: {
          grid: {
            color: "rgba(255, 255, 255, 0.05)",
            drawBorder: false,
          },
          ticks: {
            color: "#666",
            font: {
              family: "Inter",
              size: 11,
            },
            callback: function (value) {
              return formatCurrencyInput(value);
            },
          },
        },
      },
    },
  });
}

function updateInvestmentChart(result) {
  if (!investmentChart) {
    initInvestmentChart();
    return;
  }

  const period = result.months;
  const labels = [];
  const investedData = [];
  const totalData = [];

  const initialValue =
    parseMoney(document.getElementById("initialValue").value) || 0;
  const monthlyContribution =
    parseMoney(document.getElementById("monthlyContribution").value) || 0;
  const interestRate =
    parseFloat(document.getElementById("interestRate").value) || 0;
  const rateType = document.getElementById("rateType").value;

  // Converter taxa para mensal
  let monthlyRate;
  if (rateType === "yearly") {
    monthlyRate = interestRate / 100 / 12;
  } else {
    monthlyRate = interestRate / 100;
  }

  for (let i = 0; i <= period; i++) {
    labels.push(i === 0 ? "Início" : `Mês ${i}`);

    // Usar a mesma fórmula de juros compostos para consistência
    const monthResult = calculateCompoundInterest(
      initialValue,
      monthlyContribution,
      monthlyRate,
      i,
      "monthly",
    );

    investedData.push(monthResult.totalInvested);
    totalData.push(monthResult.finalValue);
  }

  investmentChart.data.labels = labels;
  investmentChart.data.datasets[0].data = totalData;
  investmentChart.data.datasets[1].data = investedData;
  investmentChart.update();
}

function initDashboardChart() {
  const ctx = document.getElementById("dashboardChart");
  if (!ctx) return;

  const labels = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const patrimonioData = [
    100000, 108000, 117000, 127000, 138000, 150000, 163000, 177000, 192000,
    208000, 225000, 244000,
  ];
  const investimentoData = [
    100000, 106000, 112000, 118000, 124000, 130000, 136000, 142000, 148000,
    154000, 160000, 166000,
  ];

  dashboardChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Patrimônio",
          data: patrimonioData,
          borderColor: "#00ff88",
          backgroundColor: "rgba(0, 255, 136, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: "#00ff88",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 2,
        },
        {
          label: "Investimento",
          data: investimentoData,
          borderColor: "#3b82f6",
          backgroundColor: "transparent",
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: "#3b82f6",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#1a1a1a",
          titleColor: "#fff",
          bodyColor: "#a0a0a0",
          borderColor: "#2a2a2a",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function (context) {
              return context.dataset.label + ": " + formatCurrency(context.raw);
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(255, 255, 255, 0.05)",
            drawBorder: false,
          },
          ticks: {
            color: "#666",
            font: {
              family: "Inter",
              size: 11,
            },
          },
        },
        y: {
          grid: {
            color: "rgba(255, 255, 255, 0.05)",
            drawBorder: false,
          },
          ticks: {
            color: "#666",
            font: {
              family: "Inter",
              size: 11,
            },
            callback: function (value) {
              return formatCurrencyInput(value);
            },
          },
        },
      },
    },
  });
}

/* ========================================
   AI INSIGHTS
   ======================================== */

function updateAIInsights(initial, monthly, rate, months, result) {
  const insights = document.getElementById("insightsContent");

  if (initial === 0 && monthly === 0) {
    insights.innerHTML =
      "<p>Preencha os dados acima para receber sugestões personalizadas.</p>";
    return;
  }

  // Calculate scenarios
  const extra100 = calculateCompoundInterest(
    initial,
    monthly + 100,
    rate,
    months,
    "monthly",
  );
  const extra250 = calculateCompoundInterest(
    initial,
    monthly + 250,
    rate,
    months,
    "monthly",
  );
  const extra500 = calculateCompoundInterest(
    initial,
    monthly + 500,
    rate,
    months,
    "monthly",
  );

  const diff100 = extra100.finalValue - result.finalValue;
  const diff250 = extra250.finalValue - result.finalValue;
  const diff500 = extra500.finalValue - result.finalValue;

  let html = "<p>💡 <strong>Insights do Assistente:</strong></p>";

  if (monthly > 0) {
    html += `<p>• Se você aumentar R$ 100/mês, terá <strong>+${formatCurrency(diff100)}</strong> no final do período.</p>`;
  }

  if (months >= 24) {
    const years = months / 12;
    const projectedValue = result.finalValue * Math.pow(1 + rate, years);
    html += `<p>• Em ${years.toFixed(1)} anos, seu patrimônio pode atingir <strong>${formatCurrency(projectedValue)}</strong>.</p>`;
  }

  if (result.profitability > 50) {
    html += `<p>🎉 Seus juros estão superando o investimento! Continue assim!</p>`;
  }

  if (rate < 0.005) {
    html += `<p>⚠️ Taxa de juros baixa. Considere diversificar seus investimentos.</p>`;
  }

  insights.innerHTML = html;
}

/* ========================================
   SIMULATOR PRO
   ======================================== */

function calculateScenario(scenario) {
  const card = document.querySelector(`[data-scenario="${scenario}"]`);
  if (!card) return;

  const initial =
    parseMoney(card.querySelector('[data-field="initial"]').value) || 0;
  const monthly =
    parseMoney(card.querySelector('[data-field="monthly"]').value) || 0;
  const rate = parseFloat(card.querySelector('[data-field="rate"]').value) || 0;
  const months =
    parseInt(card.querySelector('[data-field="months"]').value) || 12;

  const result = calculateCompoundInterest(
    initial,
    monthly,
    rate / 100,
    months,
    "monthly",
  );

  document.getElementById(`result${scenario}`).textContent = formatCurrency(
    result.finalValue,
  );

  return result;
}

function compareScenarios() {
  const scenarios = ["A", "B", "C"];
  const results = [];

  scenarios.forEach((scenario) => {
    const result = calculateScenario(scenario);
    if (result) {
      results.push({
        scenario: scenario,
        value: result.finalValue,
      });
    }
  });

  // Sort by value descending
  results.sort((a, b) => b.value - a.value);

  // Display ranking
  const rankingList = document.getElementById("rankingList");
  const comparisonResult = document.getElementById("comparisonResult");

  let html = "";
  const positions = ["gold", "silver", "bronze"];

  results.forEach((result, index) => {
    if (result.value > 0) {
      const diff =
        index < results.length - 1
          ? result.value - results[results.length - 1].value
          : 0;

      html += `
                <div class="ranking-item ${index === 0 ? "winner" : ""}">
                    <span class="ranking-position ${positions[index]}">${index + 1}</span>
                    <div class="ranking-info">
                        <span class="ranking-name">Cenário ${result.scenario}</span>
                        <span class="ranking-value">${formatCurrency(result.value)}</span>
                    </div>
                    ${index > 0 ? `<span class="ranking-difference">+${formatCurrency(diff)}</span>` : ""}
                </div>
            `;
    }
  });

  rankingList.innerHTML = html;
  comparisonResult.classList.add("active");
}

function resetScenarios() {
  document.querySelectorAll(".scenario-card").forEach((card) => {
    const inputs = card.querySelectorAll("input");
    inputs.forEach((input) => {
      input.value = "";
    });
    const resultEl = card.querySelector(".result-value");
    if (resultEl) {
      resultEl.textContent = "R$ 0,00";
    }
  });

  document.getElementById("comparisonResult").classList.remove("active");
}

/* ========================================
   DASHBOARD
   ======================================== */

function updateDashboard(result) {
  if (result.finalValue > 0) {
    document.getElementById("dashboardPatrimony").textContent = formatCurrency(
      result.finalValue,
    );
    document.getElementById("dashboardMonthly").textContent = formatCurrency(
      result.totalInvested,
    );
    document.getElementById("dashboardRate").textContent =
      (parseFloat(document.getElementById("interestRate").value) || 1).toFixed(
        1,
      ) + "%";

    // Update progress
    const goal = 1000000;
    const percentage = Math.min((result.finalValue / goal) * 100, 100);
    document.getElementById("goalProgress").style.width = percentage + "%";
    document.getElementById("goalPercentage").textContent =
      percentage.toFixed(1) + "%";
  }
}

function saveSimulation() {
  if (!currentUser) {
    showToast("Faça login para salvar simulações");
    openModal("loginModal");
    return;
  }

  const simulation = {
    id: Date.now(),
    date: new Date().toISOString(),
    initialValue: document.getElementById("initialValue").value,
    monthlyContribution: document.getElementById("monthlyContribution").value,
    interestRate: document.getElementById("interestRate").value,
    period: document.getElementById("period").value,
    periodType: document.getElementById("periodType").value,
    finalValue: document.getElementById("finalValue").textContent,
  };

  savedSimulations.push(simulation);
  localStorage.setItem(
    "financasPro_simulations",
    JSON.stringify(savedSimulations),
  );
  showToast("Simulação salva com sucesso!");
}

function exportData() {
  const data = {
    patrimonio: document.getElementById("dashboardPatrimony").textContent,
    investido: document.getElementById("dashboardMonthly").textContent,
    juros: document.getElementById("interestEarned").textContent,
    rentabilidade: document.getElementById("profitability").textContent,
    data: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "financas-pro-export.json";
  a.click();
  URL.revokeObjectURL(url);

  showToast("Dados exportados com sucesso!");
}

/* ========================================
   USER AUTHENTICATION
   ======================================== */

function checkUserSession() {
  const user = localStorage.getItem("financasPro_user");
  if (user) {
    currentUser = JSON.parse(user);
    updateUserUI();
  }
}

function handleLogin(e) {
  e.preventDefault();

  const email = e.target.querySelector('input[type="email"]').value;
  const password = e.target.querySelector('input[type="password"]').value;

  // Simulate login
  currentUser = {
    name: email.split("@")[0],
    email: email,
    plan: "free",
  };

  localStorage.setItem("financasPro_user", JSON.stringify(currentUser));
  updateUserUI();
  closeModal("loginModal");
  showToast("Login realizado com sucesso!");
}

function handleRegister(e) {
  e.preventDefault();

  const name = e.target.querySelector('input[type="text"]').value;
  const email = e.target.querySelector('input[type="email"]').value;

  // Simulate registration
  currentUser = {
    name: name,
    email: email,
    plan: "free",
  };

  localStorage.setItem("financasPro_user", JSON.stringify(currentUser));
  updateUserUI();
  closeModal("registerModal");
  showToast("Conta criada com sucesso! Bem-vindo ao Finanças Pro!");
}

function updateUserUI() {
  if (currentUser) {
    const navActions = document.querySelector(".nav-actions");
    navActions.innerHTML = `
            <span style="color: var(--text-secondary); font-size: 0.875rem;">Olá, ${currentUser.name}</span>
            <button class="btn-secondary" onclick="logout()">Sair</button>
        `;
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("financasPro_user");

  const navActions = document.querySelector(".nav-actions");
  navActions.innerHTML = `
        <button class="btn-login" onclick="openModal('loginModal')">Entrar</button>
        <button class="btn-primary" onclick="openModal('registerModal')">Começar Grátis</button>
    `;

  showToast("Logout realizado com sucesso!");
}

/* ========================================
   SUBSCRIPTION
   ======================================== */

function subscribePRO() {
  if (!currentUser) {
    openModal("registerModal");
    return;
  }

  // Show Pix payment information
  const pixKey = "509.166.058-50";

  // Copy Pix key to clipboard
  navigator.clipboard
    .writeText(pixKey)
    .then(() => {
      showToast("Chave Pix copiada! Agora faça o pagamento de R$ 49,00");
    })
    .catch(() => {
      showToast(`Chave Pix: ${pixKey} - Faça o pagamento de R$ 49,00`);
    });

  // Simulate subscription (will be activated after payment confirmation)
  currentUser.plan = "pro";
  localStorage.setItem("financasPro_user", JSON.stringify(currentUser));
  updateUserUI();

  // Show payment instructions
  setTimeout(() => {
    alert(
      `📱 Pagamento via Pix\n\nChave Pix: ${pixKey}\nValor: R$ 49,00/mês\n\nApós o pagamento, envie o comprovante para ativar seu plano PRO!`,
    );
  }, 500);
}

function contactSales() {
  window.open(
    "https://wa.me/5511976172617?text=Olá! Gostaria de saber mais sobre o plano Empresarial do Finanças Pro!",
    "_blank",
  );
}

/* ========================================
   PREMIUM PAYMENT
   ======================================== */

function copyPixKey() {
  const pixKey = "50916605850";
  navigator.clipboard
    .writeText(pixKey)
    .then(() => {
      showToast("Chave Pix copiada! ✅");
    })
    .catch(() => {
      showToast("Chave Pix: " + pixKey);
    });
}

function confirmPayment() {
  // Ask for confirmation that they made the payment
  const confirmed = confirm("⚠️ Confirmação de Pagamento\n\nVocê já realizou o pagamento de R$ 49,00 via Pix?\n\nClique em OK para confirmar ou Cancelar para voltar.");
  
  if (!confirmed) {
    showToast("Pagamento não confirmado. Faça o Pix e tente novamente.");
    return;
  }
  
  // Ask for transaction ID or last 4 digits for verification
  const transactionInfo = prompt("📝 Para confirmar seu pagamento, por favor insira:\n\n• Os 4 últimos dígitos do comprovante OU\n• O código da transação do Pix\n\nIsso nos ajudará a validar seu pagamento mais rápido.");
  
  if (transactionInfo === null) {
    showToast("Confirmação cancelada.");
    return;
  }
  
  showToast("Pagamento confirmado! 🎉");
  showToast("Aguardando validação...");
  
  // Simulate premium activation with pending status
  if (currentUser) {
    currentUser.plan = "premium_pending";
    currentUser.paymentInfo = {
      date: new Date().toISOString(),
      transactionCode: transactionInfo || "pending",
      status: "pending_verification"
    };
    localStorage.setItem("financasPro_user", JSON.stringify(currentUser));
    updateUserUI();
  }
  
  // Show success message
  setTimeout(() => {
    alert(
      "🎊 Obrigado pela confirmação!\n\n📋 Resumo do pedido:\n• Plano: Finanças Pro Premium\n• Valor: R$ 49,00/mês\n• Código: " + (transactionInfo || "Pendente") + "\n\n⏰ Seu pagamento está em análise.\nEm até 24h úteis seu plano será ativado!\n\n📱 Caso precise de ajuda, entre em contato pelo WhatsApp.",
    );
  }, 500);

/* ========================================
   CONTACT FORM
   ======================================== */

function handleContact(e) {
  e.preventDefault();

  const name = e.target.querySelector('input[type="text"]').value;
  const email = e.target.querySelector('input[type="email"]').value;
  const message = e.target.querySelector("textarea").value;

  // Simulate sending
  console.log("Contact form:", { name, email, message });

  closeModal("contactModal");
  showToast("Mensagem enviada! Retornaremos em breve.");

  e.target.reset();
}

/* ========================================
   TOAST NOTIFICATIONS
   ======================================== */

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  toastMessage.textContent = message;
  toast.classList.add("active");

  setTimeout(() => {
    toast.classList.remove("active");
  }, 3000);
}

/* ========================================
   HERO ANIMATION
   ======================================== */

function animateHeroValue() {
  const heroValue = document.getElementById("heroValue");
  if (!heroValue) return;

  let target = 244320;
  let current = 0;
  let increment = target / 50;

  function animate() {
    current += increment;
    if (current < target) {
      heroValue.textContent = formatCurrency(current);
      requestAnimationFrame(animate);
    } else {
      heroValue.textContent = formatCurrency(target);
    }
  }

  // Start animation after a delay
  setTimeout(animate, 1500);
}

/* ========================================
   DEMO
   ======================================== */

function openDemo() {
  // Fill calculator with demo data
  document.getElementById("initialValue").value = "10.000";
  document.getElementById("monthlyContribution").value = "500";
  document.getElementById("interestRate").value = "1";
  document.getElementById("period").value = "24";

  // Calculate
  calculate();

  // Scroll to calculator
  scrollToSection("calculator");
}

/* ========================================
   TOOLTIPS
   ======================================== */

function initTooltips() {
  // Simple tooltip implementation
  document.querySelectorAll("[data-tooltip]").forEach((element) => {
    element.addEventListener("mouseenter", showTooltip);
    element.addEventListener("mouseleave", hideTooltip);
  });
}

function showTooltip(e) {
  const text = e.target.dataset.tooltip;
  // Tooltip implementation would go here
}

function hideTooltip() {
  // Hide tooltip implementation
}

/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Export for global use
window.formatMoney = formatMoney;
window.parseMoney = parseMoney;
window.openModal = openModal;
window.closeModal = closeModal;
window.switchModal = switchModal;
window.scrollToSection = scrollToSection;
window.toggleMobileMenu = toggleMobileMenu;
window.calculate = calculate;
window.compareScenarios = compareScenarios;
window.resetScenarios = resetScenarios;
window.saveSimulation = saveSimulation;
window.exportData = exportData;
window.subscribePRO = subscribePRO;
window.contactSales = contactSales;
window.copyPixKey = copyPixKey;
window.confirmPayment = confirmPayment;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleContact = handleContact;
window.logout = logout;
window.openDemo = openDemo;
