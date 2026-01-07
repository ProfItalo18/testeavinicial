/* =============================
   S.G.R. - Escola Manain
   JS RECONSTRUÍDO (LOCALSTORAGE)
   - Salvamento / Atualização
   - Sidebar com busca + exclusão
   - Modal Checklist com textos automáticos
   - Assinaturas (imagens) corrigidas (.png)
   - Espelhamento para impressão (textarea -> div)
================================ */

/* ============ 1) CHECKLIST DB (exemplo; você pode ampliar) ============ */
const CHECKLIST_DB = {
  pedagogica: {
    "1. Funções Cognitivas": [
      { label: "Atenção instável", texto: "Demonstra dificuldade significativa em manter o foco em atividades dirigidas.", extra: "Atividades de curta duração, com pausas planejadas." },
      { label: "Boa atenção", texto: "Mantém atenção adequada nas atividades propostas, com suporte pontual.", extra: "" },
      { label: "Memória comprometida", texto: "Apresenta dificuldade em reter instruções recentes e sequências simples.", extra: "Jogos de memória e sequenciação com apoio visual." }
    ],
    "2. Leitura e Escrita": [
      { label: "Pré-silábico", texto: "Encontra-se em hipótese de escrita pré-silábica, com registros por garatujas/desenhos.", extra: "Estimulação da consciência fonológica e pareamento imagem-palavra." },
      { label: "Silábico", texto: "Realiza registros silábicos, utilizando uma letra para representar cada sílaba sonora.", extra: "Atividades de completação e segmentação silábica." },
      { label: "Não alfabetizado", texto: "Ainda não domina o princípio alfabético e a correspondência grafema-fonema.", extra: "Práticas de letramento lúdico e rotinas de leitura mediada." }
    ],
    "3. Matemática": [
      { label: "Não identifica numerais", texto: "Não identifica numerais básicos (0 a 10) de forma estável.", extra: "Bingo numérico, músicas e jogos de pareamento." },
      { label: "Contagem mecânica", texto: "Realiza contagem verbal, porém sem associar com precisão à quantidade.", extra: "Contagem com material concreto e correspondência termo a termo." }
    ]
  },

  clinica: {
    "1. Saúde Geral": [
      { label: "Atraso DNPM", texto: "Há indícios/relatos de atraso no Desenvolvimento Neuropsicomotor.", extra: "Encaminhar/Manter acompanhamento com Neuropediatra." },
      { label: "Convulsões", texto: "Há relato de crises convulsivas controladas/em tratamento.", extra: "Acompanhamento com Neurologista e orientações de segurança." }
    ],
    "2. Linguagem": [
      { label: "Ausência de fala", texto: "Não utiliza linguagem oral como principal meio de comunicação.", extra: "Fonoaudiologia e ampliação de comunicação alternativa/aumentativa (CAA)." },
      { label: "Ecolalia", texto: "Apresenta repetição de falas (ecolalia) em alguns contextos.", extra: "" }
    ]
  },

  social: {
    "1. Contexto Familiar": [
      { label: "Vulnerabilidade", texto: "A família encontra-se em situação de vulnerabilidade socioeconômica.", extra: "Acompanhamento junto ao CRAS e orientações sobre direitos socioassistenciais." },
      { label: "Participativa", texto: "A família demonstra interesse e participa das demandas escolares.", extra: "" }
    ],
    "2. Benefícios": [
      { label: "Possui BPC", texto: "A família é beneficiária do BPC/LOAS.", extra: "" },
      { label: "Demanda BPC", texto: "Há perfil para BPC/LOAS, porém o benefício ainda não foi acessado.", extra: "Orientação e apoio para requerimento do benefício." }
    ]
  }
};

/* ============ 2) ASSINATURAS (ARQUIVOS CORRIGIDOS) ============ */
const DB_ASSINATURAS = {
  pedagoga: [
    { nome: "Jhenifer Cavalheiro André", arquivo: "asspedagoda.png", cargo: "Pedagoga" },
    { nome: "Isabella Floripes Sanches", arquivo: "asspedagoda2.png", cargo: "Pedagoga" },
    { nome: "--- Sem Assinatura ---", arquivo: "", cargo: "Pedagoga" }
  ],
  psicologa: [
    { nome: "Jaqueline Gonçalves Malaquim", arquivo: "asspsicologa.png", cargo: "Psicóloga" },
    { nome: "--- Sem Assinatura ---", arquivo: "", cargo: "Psicóloga" }
  ],
  social: [
    { nome: "Andréa Cristina Santos", arquivo: "asssocial.png", cargo: "Assistente Social" },
    { nome: "--- Sem Assinatura ---", arquivo: "", cargo: "Assistente Social" }
  ]
};

/* ============ 3) ESTADO GLOBAL ============ */
const STORAGE_KEY = "db_escola_manain_v3";
let modalAtual = "";
let bancoRelatorios = [];

/** Estrutura de dados por área (texto + extra) */
let dadosRelatorio = {
  pedagogica: { texto: "", extra: "" },
  clinica: { texto: "", extra: "" },
  social: { texto: "", extra: "" }
};

/** Identificação bloqueada após carregar relatório salvo */
let identificacaoTravada = false;

/* ============ 4) INICIALIZAÇÃO ============ */
document.addEventListener("DOMContentLoaded", () => {
  configurarEspelhoTextareas();
  carregarBancoDeDados();
  inicializarAssinaturas();
  prepararDatas();
  vincularEventos();

  // Se não existe ID, inicia como novo relatório
  if (!document.getElementById("reportId").value) {
    novoRelatorio(false);
  }
});

function prepararDatas() {
  atualizarDataExtenso();

  const inputData = document.getElementById("dataAvaliacao");
  if (inputData) {
    inputData.addEventListener("change", atualizarDataExtenso);
    inputData.addEventListener("input", atualizarDataExtenso);
  }
}

function atualizarDataExtenso() {
  const el = document.getElementById("dataAtual");
  if (!el) return;

  const v = (document.getElementById("dataAvaliacao")?.value || "").trim();

  // Se a Data Avaliação estiver vazia, usa a data de hoje apenas para não ficar em branco.
  // (Mas, quando a Data Avaliação for preenchida, o texto fica IDÊNTICO a ela.)
  let data = v ? new Date(v + "T12:00:00") : new Date();

  // Se a data for inválida, fallback seguro
  if (isNaN(data.getTime())) data = new Date();

  el.textContent = data.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

el.textContent = data.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

/* ============ 5) SIDEBAR ============ */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("aberto");
}

function filtrarLista() {
  atualizarListaSidebar();
}

/* ============ 6) BANCO (LOCALSTORAGE) ============ */
function carregarBancoDeDados() {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) {
    bancoRelatorios = [];
    atualizarListaSidebar();
    return;
  }

  try {
    bancoRelatorios = JSON.parse(json) || [];
  } catch (e) {
    console.error("Erro ao ler banco:", e);
    bancoRelatorios = [];
  }

  atualizarListaSidebar();
}

function persistirBanco() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bancoRelatorios));
}

function salvarNoBanco() {
  const nome = (document.getElementById("nomeEstudante").value || "").trim();
  if (!nome) {
    alert("⚠️ Digite o NOME DO ESTUDANTE antes de salvar.");
    return;
  }

  // Coleta inputs/areas (exceto busca)
  const inputs = coletarInputs();

  // Salva seleção de assinaturas
  inputs.sel_pedagoga = document.getElementById("sel_pedagoga").value;
  inputs.sel_psicologa = document.getElementById("sel_psicologa").value;
  inputs.sel_social = document.getElementById("sel_social").value;

  const idAtual = document.getElementById("reportId").value || Date.now().toString();

  const relatorioObjeto = {
    id: idAtual,
    nome,
    dataSalvo: new Date().toLocaleString("pt-BR"),
    inputs,
    dadosRelatorio
  };

  const idx = bancoRelatorios.findIndex(r => r.id === idAtual);
  if (idx >= 0) bancoRelatorios[idx] = relatorioObjeto;
  else bancoRelatorios.push(relatorioObjeto);

  document.getElementById("reportId").value = idAtual;

  persistirBanco();
  atualizarListaSidebar();

  // feedback no botão
  feedbackBotaoSalvar();

  // após salvar, travar identificação (conforme pedido)
  travarIdentificacao(true);
}

function coletarInputs() {
  const inputs = {};
  document.querySelectorAll("input, textarea").forEach(el => {
    if (!el.id) return;
    if (el.id === "buscaAluno") return;
    inputs[el.id] = el.value;
  });
  return inputs;
}

function feedbackBotaoSalvar() {
  const btn = document.getElementById("btnSalvar");
  if (!btn) return;
  const original = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check"></i> SALVO!';
  setTimeout(() => (btn.innerHTML = original), 1400);
}

function atualizarListaSidebar() {
  const lista = document.getElementById("lista-alunos");
  const termo = (document.getElementById("buscaAluno").value || "").toLowerCase();

  lista.innerHTML = "";
  const ordenado = [...bancoRelatorios].sort((a, b) => Number(b.id) - Number(a.id));

  ordenado.forEach(rel => {
    if (!rel.nome.toLowerCase().includes(termo)) return;

    const div = document.createElement("div");
    div.className = "item-aluno";
    div.setAttribute("role", "listitem");
    div.innerHTML = `
      <h4>${escapeHtml(rel.nome)}</h4>
      <span><i class="far fa-clock"></i> ${escapeHtml(rel.dataSalvo || "")}</span>
      <button type="button" class="btn-apagar-item" title="Excluir" aria-label="Excluir">
        <i class="fas fa-trash"></i>
      </button>
    `;

    // abrir
    div.addEventListener("click", (e) => {
      if (e.target.closest(".btn-apagar-item")) return;
      carregarRelatorio(rel.id);
    });

    // excluir
    div.querySelector(".btn-apagar-item").addEventListener("click", (e) => {
      e.stopPropagation();
      deletarRelatorio(rel.id);
    });

    lista.appendChild(div);
  });
}

function carregarRelatorio(id) {
  const rel = bancoRelatorios.find(r => r.id === id);
  if (!rel) return;

  if (!confirm(`Deseja abrir o relatório de "${rel.nome}"?\nDados não salvos na tela atual serão perdidos.`)) return;

  // Preenche campos
  if (rel.inputs) {
    for (const [key, value] of Object.entries(rel.inputs)) {
      const el = document.getElementById(key);
      if (!el) continue;

      el.value = value ?? "";

      // atualização do espelho de impressão
      if (el.tagName === "TEXTAREA" && el.mirrorDiv) {
        el.mirrorDiv.innerText = el.value;
        ajustarAltura(el);
      }

      // se for select assinatura, disparar change para atualizar imagem/cargo
      if (key.startsWith("sel_")) {
        el.dispatchEvent(new Event("change"));
      }
    }
  }

  // estado dos checklists
  if (rel.dadosRelatorio) dadosRelatorio = rel.dadosRelatorio;

  document.getElementById("reportId").value = rel.id;

  atualizarStatusVisual("pedagogica");
  atualizarStatusVisual("clinica");
  atualizarStatusVisual("social");

  calcularIdade();
  atualizarFinais();

  // travar identificação ao carregar (pode destravar pelo botão)
  travarIdentificacao(true);

  // fecha sidebar (se estiver aberta)
  if (document.getElementById("sidebar").classList.contains("aberto")) toggleSidebar();
}

function deletarRelatorio(id) {
  if (!confirm("ATENÇÃO: Deseja EXCLUIR PERMANENTEMENTE este relatório?")) return;

  bancoRelatorios = bancoRelatorios.filter(r => r.id !== id);
  persistirBanco();
  atualizarListaSidebar();

  if (document.getElementById("reportId").value === id) {
    novoRelatorio(false);
  }
}

function novoRelatorio(perguntar = true) {
  if (perguntar && !confirm("Deseja limpar a tela para iniciar um NOVO aluno?")) return;

  // limpa inputs/textarea (exceto fixos)
  document.querySelectorAll("input, textarea").forEach(el => {
    if (!el.id) return;
    if (["nre", "municipio", "escola", "buscaAluno"].includes(el.id)) return;
    el.value = "";
    if (el.mirrorDiv) el.mirrorDiv.innerText = "";
    if (el.tagName === "TEXTAREA") ajustarAltura(el);
  });

  // reseta selects
  ["pedagoga", "psicologa", "social"].forEach(tipo => {
    const sel = document.getElementById(`sel_${tipo}`);
    if (sel) {
      sel.value = 0;
      sel.dispatchEvent(new Event("change"));
    }
  });

  // reseta dados
  dadosRelatorio = {
    pedagogica: { texto: "", extra: "" },
    clinica: { texto: "", extra: "" },
    social: { texto: "", extra: "" }
  };

  document.getElementById("reportId").value = "";

  atualizarDataExtenso();

  atualizarStatusVisual("pedagogica");
  atualizarStatusVisual("clinica");
  atualizarStatusVisual("social");

  // identificação livre no novo
  travarIdentificacao(false);
}

/* ============ 7) TRAVAR / DESTRAVAR IDENTIFICAÇÃO ============ */
function travarIdentificacao(travar) {
  identificacaoTravada = !!travar;
  const ids = ["nomeEstudante", "dataNascimento", "filiacao", "dataAvaliacao"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.readOnly = identificacaoTravada;
    el.disabled = identificacaoTravada && el.type === "date"; // date não respeita bem readonly
  });
}

function desbloquearIdentificacao() {
  if (!document.getElementById("reportId").value) {
    travarIdentificacao(false);
    return;
  }
  if (!confirm("Deseja habilitar edição da IDENTIFICAÇÃO deste relatório?")) return;
  travarIdentificacao(false);
}

/* ============ 8) ASSINATURAS ============ */
function inicializarAssinaturas() {
  ["pedagoga", "psicologa", "social"].forEach(tipo => {
    const select = document.getElementById(`sel_${tipo}`);
    const lista = DB_ASSINATURAS[tipo];

    if (!select || !lista) return;

    select.innerHTML = "";
    lista.forEach((prof, idx) => {
      const option = document.createElement("option");
      option.value = String(idx);
      option.textContent = prof.nome;
      select.appendChild(option);
    });

    // Atualiza imagem/cargo
    mudarAssinatura(tipo);
  });
}

function mudarAssinatura(tipo) {
  const select = document.getElementById(`sel_${tipo}`);
  const img = document.getElementById(`img_${tipo}`);
  const cargo = document.getElementById(`cargo_${tipo}`);

  if (!select || !img || !cargo) return;

  const dados = DB_ASSINATURAS[tipo][Number(select.value)];

  if (dados?.arquivo) {
    img.src = dados.arquivo;
    img.style.display = "block";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
  }

  cargo.textContent = dados?.cargo || cargo.textContent || "";
}

/* ============ 9) ESPAÇAMENTO / ESPELHO PARA IMPRESSÃO ============ */
function configurarEspelhoTextareas() {
  document.querySelectorAll("textarea").forEach(tx => {
    const mirror = document.createElement("div");
    mirror.className = "print-mirror";
    tx.parentNode.insertBefore(mirror, tx.nextSibling);
    tx.mirrorDiv = mirror;

    const sync = () => {
      mirror.innerText = tx.value || "";
      ajustarAltura(tx);
    };

    tx.addEventListener("input", sync);
    sync();
  });
}

function ajustarAltura(el) {
  // Ajuste de altura para visualização na tela (não interfere no print, que usa o mirror)
  if (!el) return;
  el.style.height = "auto";
  el.style.height = (el.scrollHeight + 2) + "px";
}

/* ============ 10) IDADE ============ */
function vincularEventos() {
  const nasc = document.getElementById("dataNascimento");
  if (nasc) nasc.addEventListener("change", calcularIdade);
}

function calcularIdade() {
  const nasc = document.getElementById("dataNascimento").value;
  if (!nasc) return;

  const hoje = new Date();
  const n = new Date(nasc);

  let idade = hoje.getFullYear() - n.getFullYear();
  const aniversarioEsteAno = new Date(hoje.getFullYear(), n.getMonth(), n.getDate());
  if (hoje < aniversarioEsteAno) idade--;

  document.getElementById("idade").value = `${idade} anos`;
}

/* ============ 11) STATUS VISUAL ============ */
function atualizarStatusVisual(tipo) {
  const st = document.getElementById(`status-${tipo}`);
  if (!st) return;

  const temTexto = (dadosRelatorio[tipo]?.texto || "").trim().length > 0;

  if (temTexto) {
    st.innerHTML = `<i class="fas fa-check-circle"></i> OK`;
    st.className = "status salvo";
  } else {
    st.textContent = "Pendente";
    st.className = "status pendente";
  }
}

/* ============ 12) MODAL CHECKLIST ============ */
function abrirModal(tipo) {
  modalAtual = tipo;

  const overlay = document.getElementById("modalOverlay");
  const container = document.getElementById("container-checklist");
  const labelExtra = document.getElementById("labelExtra");
  const titulo = document.getElementById("modalTitulo");

  if (!overlay || !container || !labelExtra || !titulo) return;

  titulo.textContent = "Checklist: " + tipo.charAt(0).toUpperCase() + tipo.slice(1);

  labelExtra.textContent = (tipo === "pedagogica")
    ? "2. Indicações (Automático):"
    : "2. Encaminhamentos (Automático):";

  document.getElementById("modalTexto").value = dadosRelatorio[tipo]?.texto || "";
  document.getElementById("modalExtra").value = dadosRelatorio[tipo]?.extra || "";

  container.innerHTML = "";

  const db = CHECKLIST_DB[tipo];
  if (db) {
    for (const [categoria, itens] of Object.entries(db)) {
      const grupo = document.createElement("div");
      grupo.className = "grupo-checklist";
      grupo.innerHTML = `<h5>${escapeHtml(categoria)}</h5>`;

      itens.forEach(item => {
        const checked = (document.getElementById("modalTexto").value || "").includes(item.texto);

        const linha = document.createElement("div");
        linha.className = "item-check";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = checked;
        input.addEventListener("change", () => procCheck(input.checked, item.texto, item.extra || ""));

        const lab = document.createElement("label");
        lab.textContent = item.label;

        linha.appendChild(input);
        linha.appendChild(lab);
        grupo.appendChild(linha);
      });

      container.appendChild(grupo);
    }
  }

  overlay.style.display = "flex";
  overlay.setAttribute("aria-hidden", "false");
}

function procCheck(checked, texto, extra) {
  const t = document.getElementById("modalTexto");
  const e = document.getElementById("modalExtra");
  if (!t || !e) return;

  const linhasT = (t.value || "").split("\n").map(s => s.trim()).filter(Boolean);
  const linhasE = (e.value || "").split("\n").map(s => s.trim()).filter(Boolean);

  if (checked) {
    if (!linhasT.includes(texto)) linhasT.push(texto);
    if (extra && !linhasE.includes(`- ${extra}`) && !linhasE.includes(extra)) linhasE.push(`- ${extra}`);
  } else {
    const idxT = linhasT.indexOf(texto);
    if (idxT >= 0) linhasT.splice(idxT, 1);

    if (extra) {
      const idxE1 = linhasE.indexOf(`- ${extra}`);
      const idxE2 = linhasE.indexOf(extra);
      const idxE = idxE1 >= 0 ? idxE1 : idxE2;
      if (idxE >= 0) linhasE.splice(idxE, 1);
    }
  }

  t.value = linhasT.join("\n");
  e.value = linhasE.join("\n");
}

function salvarModal() {
  if (!modalAtual) return;

  dadosRelatorio[modalAtual] = {
    texto: document.getElementById("modalTexto").value || "",
    extra: document.getElementById("modalExtra").value || ""
  };

  // mantém espelho do textarea oculto (para impressão)
  const hidden = document.getElementById(`texto-${modalAtual}`);
  if (hidden) {
    hidden.value = dadosRelatorio[modalAtual].texto;
    if (hidden.mirrorDiv) hidden.mirrorDiv.innerText = hidden.value;
  }

  atualizarStatusVisual(modalAtual);
  atualizarFinais();
  fecharModal();
}

function fecharModal() {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;
  overlay.style.display = "none";
  overlay.setAttribute("aria-hidden", "true");
}

/* ============ 13) FINAIS AUTOMÁTICOS ============ */
function atualizarFinais() {
  // Indicações (prioriza extra pedagógico quando o campo estiver vazio ou igual ao último automático)
  const ind = document.getElementById("final-indicacoes");
  if (ind) {
    const auto = (dadosRelatorio.pedagogica.extra || "").trim();
    if (auto && (!ind.value.trim() || ind.value.trim() === auto)) {
      ind.value = auto;
      if (ind.mirrorDiv) ind.mirrorDiv.innerText = ind.value;
      ajustarAltura(ind);
    }
  }

  // Encaminhamentos (compõe clinica + social quando estiver vazio)
  const finEnc = document.getElementById("final-encaminhamentos");
  if (finEnc) {
    let enc = "";
    const c = (dadosRelatorio.clinica.extra || "").trim();
    const s = (dadosRelatorio.social.extra || "").trim();
    if (c) enc += "SAÚDE:\n" + c + "\n\n";
    if (s) enc += "SOCIAL:\n" + s;

    if (enc.trim() && !finEnc.value.trim()) {
      finEnc.value = enc.trim();
      if (finEnc.mirrorDiv) finEnc.mirrorDiv.innerText = finEnc.value;
      ajustarAltura(finEnc);
    }
  }
}

function gerarConclusaoAutomatica() {
  const nome = (document.getElementById("nomeEstudante").value || "").trim() || "O estudante";
  const conc = document.getElementById("final-conclusao");
  if (!conc) return;

  if (conc.value.trim() && !confirm("O campo de conclusão já possui texto. Deseja sobrescrever?")) return;

  const ped = (dadosRelatorio.pedagogica.texto || "").replace(/\n/g, " ");
  const cli = (dadosRelatorio.clinica.texto || "").replace(/\n/g, " ");
  const soc = (dadosRelatorio.social.texto || "").replace(/\n/g, " ");

  conc.value =
`Considerando o processo avaliativo realizado, conclui-se que ${nome} apresenta necessidades educacionais específicas que requerem apoio sistemático e intervenções planejadas no contexto escolar.

Síntese pedagógica: ${ped || "Foram observadas características relevantes para organização de estratégias pedagógicas individualizadas."}

Síntese clínica: ${cli || "Foram consideradas informações sobre saúde, autonomia e aspectos do desenvolvimento."}

Síntese social: ${soc || "Foram levantadas informações sobre contexto familiar e rede de apoio."}

Recomenda-se continuidade do acompanhamento interdisciplinar, com adequações pedagógicas, suporte à comunicação e organização de rotinas, visando participação, aprendizagem e desenvolvimento integral.`;

  if (conc.mirrorDiv) conc.mirrorDiv.innerText = conc.value;
  ajustarAltura(conc);
}

/* ============ 14) SEGURANÇA (escape) ============ */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
