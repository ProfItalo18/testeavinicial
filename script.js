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

/* ================= AUTH POR ÁREA (ADMIN CADASTRA) ================= */
const AUTH_DB_KEY = "sgr_users_area_v1";
const AUTH_SESSION_KEY = "sgr_session_area_v1";

// >>> Defina aqui o login do ADMIN (somente ele cadastra as áreas)
const ADMIN_LOGIN = {
  email: "admin@col.com",
  senha: "Col123"
};

let authAreaPendente = null; // qual área pediu login (pedagogica/clinica/social)
// ================= FIREBASE (Firestore + Storage) =================
// Usando SDK compat já incluído no index.html
const firebaseConfig = {
  apiKey: "AIzaSyC7GtKuIQwXdDMI12FRl_Zj0cC38VfLOzs",
  authDomain: "avinicialcol.firebaseapp.com",
  projectId: "avinicialcol",
  storageBucket: "avinicialcol.firebasestorage.app",
  messagingSenderId: "881095984950",
  appId: "1:881095984950:web:d2fdc79250efc96c279597"
};

const FB = {
  ready: false,
  db: null,
  storage: null,
};

function initFirebase() {
  try {
    if (typeof firebase === "undefined") return false;
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
    FB.db = firebase.firestore();
    FB.storage = firebase.storage();
        FB.auth = firebase.auth();
FB.reportsCol = FB.db.collection("relatorios");
    FB.usersCol = FB.db.collection("users");
    FB.ready = true;
    return true;
  } catch (e) {
    console.warn("Firebase não inicializado:", e);
    FB.ready = false;
    return false;
  }
}

// Inicializa o Firebase o quanto antes
initFirebase();


function normalizeUsersDB(db){
  const out = (db && typeof db === "object") ? db : {};
  ["pedagogica","clinica","social"].forEach((area)=>{
    const v = out[area];
    if(!v){ out[area] = []; return; }

    // legado: {email, senha, assinaturaDataUrl}
    if(!Array.isArray(v) && typeof v === "object" && (v.email || v.senha || v.assinaturaDataUrl)){
      out[area] = [{
        id: "legacy_" + area,
        email: String(v.email||"").toLowerCase(),
        senha: String(v.senha||""),
        assinaturaDataUrl: String(v.assinaturaDataUrl||""),
        criadoEm: Date.now()
      }];
      return;
    }

    // já é lista
    if(Array.isArray(v)){
      out[area] = v
        .filter(x => x && typeof x === "object")
        .map((x, i) => ({
          id: String(x.id || ("u_"+area+"_"+i+"_"+Date.now())),
          email: String(x.email||"").toLowerCase(),
          senha: String(x.senha||""),
          assinaturaDataUrl: String(x.assinaturaDataUrl||""),
          criadoEm: Number(x.criadoEm || Date.now())
        }));
      return;
    }

    // fallback
    out[area] = [];
  });
  return out;
}

function loadUsersArea(){
  try {
    const raw = JSON.parse(localStorage.getItem(AUTH_DB_KEY) || "{}");
    const norm = normalizeUsersDB(raw);
    // regrava se houver migração
    localStorage.setItem(AUTH_DB_KEY, JSON.stringify(norm));
    return norm;
  } catch(e){
    const norm = normalizeUsersDB({});
    localStorage.setItem(AUTH_DB_KEY, JSON.stringify(norm));
    return norm;
  }
}
function saveUsersArea(db){
  localStorage.setItem(AUTH_DB_KEY, JSON.stringify(normalizeUsersDB(db || {})));
}

// ================= USERS (NUVEM - FIRESTORE) =================
// Requisito: credenciais cadastradas no ADMIN devem ficar guardadas na nuvem
// até serem excluídas. Usamos a coleção "users" (FB.usersCol) com ID estável.
function _userDocId(area, email){
  return `${String(area || "").trim().toLowerCase()}__${String(email || "").trim().toLowerCase()}`;
}

async function cloudLoadUsersDB(){
  if (!FB || !FB.ready || !FB.usersCol) return null;
  const out = normalizeUsersDB({});
  const snap = await FB.usersCol.get();
  snap.forEach(doc => {
    const d = doc.data() || {};
    const area = String(d.area || "").trim().toLowerCase();
    if (!area || !out[area]) return;
    if (d.deleted === true) return;
    const email = String(d.email || "").trim().toLowerCase();
    const senha = String(d.senha || "");
    const assinaturaDataUrl = String(d.assinaturaDataUrl || "");
    if (!email || !senha) return;
    out[area].push({ email, senha, assinaturaDataUrl });
  });
  return out;
}

async function cloudUpsertUser(area, email, senha, assinaturaDataUrl){
  if (!FB || !FB.ready || !FB.usersCol) throw new Error("Firestore não disponível");
  const a = String(area || "").trim().toLowerCase();
  const e = String(email || "").trim().toLowerCase();
  const s = String(senha || "");
  const sig = String(assinaturaDataUrl || "");
  if (!a || !e || !s) throw new Error("Dados de credencial incompletos");

  const now = firebase.firestore.FieldValue.serverTimestamp();
  const id = _userDocId(a, e);
  await FB.usersCol.doc(id).set({
    area: a,
    email: e,
    senha: s,
    assinaturaDataUrl: sig,
    deleted: false,
    updatedAt: now,
    createdAt: now,
  }, { merge: true });
}

async function cloudDeleteUser(area, email){
  if (!FB || !FB.ready || !FB.usersCol) throw new Error("Firestore não disponível");
  const id = _userDocId(area, email);
  await FB.usersCol.doc(id).delete();
}

async function syncUsersFromCloudToLocal(){
  try {
    const db = await cloudLoadUsersDB();
    if (db) {
      saveUsersArea(db);
      return db;
    }
  } catch (e) {
    console.warn("Falha ao sincronizar credenciais da nuvem:", e);
  }
  return null;
}
function getSessao(){
  try { return JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY) || "null"); } catch(e){ return null; }
}
function setSessao(s){
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(s));
}
function clearSessao(){
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}


function readFileAsDataURL(file){
  return new Promise((resolve, reject)=>{
    try{
      const r = new FileReader();
      r.onload = ()=> resolve(String(r.result || ""));
      r.onerror = ()=> reject(new Error("Falha ao ler arquivo"));
      r.readAsDataURL(file);
    }catch(e){ reject(e); }
  });
}


function setSignatureForArea(area, dataUrl){
  const map = {
    pedagogica: "img_pedagoga",
    clinica: "img_psicologa",
    social: "img_social"
  };
  const id = map[area];
  if(!id) return;
  const img = document.getElementById(id);
  if(img && dataUrl){ img.src = dataUrl; }
}

function aplicarAssinaturasCadastradas(){
  // Mantém a assinatura coerente com a sessão atual (quando houver)
  const s = getSessao();
  if(s && s.area && s.assinaturaDataUrl){
    setSignatureForArea(s.area, s.assinaturaDataUrl);
  }
}


function areaLabel(area){
  if(area==="pedagogica") return "Avaliação Pedagógica";
  if(area==="clinica") return "Avaliação Clínica";
  if(area==="social") return "Avaliação do Serviço Social";
  return "Avaliação";
}
function assinaturaRoleParaArea(area){
  if(area==="pedagogica") return "pedagoga";
  if(area==="clinica") return "psicologa";
  if(area==="social") return "social";
  return "";
}

function podeAcessarArea(area){
  const s = getSessao();
  return !!(s && s.area === area);
}

function abrirAuth(area){
  authAreaPendente = area;
  const o = document.getElementById("authOverlay");
  if(!o) return;
  const titulo = document.getElementById("authTitulo");
  const sub = document.getElementById("authSub");
  const msg = document.getElementById("authMsg");
  if(titulo) titulo.innerHTML = '<i class="fas fa-lock"></i> ' + areaLabel(area);
  if(sub) sub.textContent = "Acesso restrito ao responsável da assinatura desta área.";
  if(msg){ msg.textContent=""; msg.className="auth-msg"; }
  const em = document.getElementById("authEmail");
  const se = document.getElementById("authSenha");
  if(em) em.value="";
  if(se) se.value="";
  o.style.display="flex";
  o.setAttribute("aria-hidden","false");
  setTimeout(()=> em && em.focus(), 50);
}
function fecharAuth(){
  const o = document.getElementById("authOverlay");
  if(!o) return;
  o.style.display="none";
  o.setAttribute("aria-hidden","true");
  authAreaPendente = null;
}


async function confirmarAuth(){
  const area = authAreaPendente;
  const msg = document.getElementById("authMsg");
  const em = (document.getElementById("authEmail")?.value || "").trim().toLowerCase();
  const se = (document.getElementById("authSenha")?.value || "").trim();
  if(!area){ return; }
  if(!em || !se){
    if(msg){ msg.textContent="Preencha e-mail e senha."; msg.className="auth-msg err"; }
    return;
  }

  // Garante que as credenciais mais recentes (nuvem) estejam carregadas
  try{ await cloudSyncUsersToLocal(); }catch(e){}
  const db = loadUsersArea();
  const lista = db[area] || [];
  if(!lista.length){
    if(msg){ msg.textContent="Área ainda não cadastrada pelo administrador."; msg.className="auth-msg err"; }
    return;
  }

  const user = lista.find(u => (u.email||"").toLowerCase() === em && u.senha === se);
  if(!user){
    if(msg){ msg.textContent="Credenciais inválidas para esta área."; msg.className="auth-msg err"; }
    return;
  }

  setSessao({ area, email: em, userId: user.id, assinaturaDataUrl: user.assinaturaDataUrl || "", ts: Date.now() });

  // aplica a assinatura desta credencial no relatório/ impressão
  if(user.assinaturaDataUrl){
    setSignatureForArea(area, user.assinaturaDataUrl);
  }

  if(msg){ msg.textContent="Acesso liberado."; msg.className="auth-msg ok"; }
  const pending = area;
  fecharAuth();
  abrirModal(pending);
}


/* ===== ADMIN ===== */
let adminLogado = false;

function abrirAdmin(){
  const o = document.getElementById("adminOverlay");
  if(!o) return;
  o.style.display="flex";
  o.setAttribute("aria-hidden","false");
  // reset telas
  document.getElementById("adminLoginBox").style.display = adminLogado ? "none" : "block";
  document.getElementById("adminPainel").style.display = adminLogado ? "block" : "none";
  const msg = document.getElementById("adminMsg");
  const msg2 = document.getElementById("adminMsg2");
  if(msg){ msg.textContent=""; msg.className="auth-msg"; }
  if(msg2){ msg2.textContent=""; msg2.className="auth-msg"; }
  if(adminLogado) preencherCamposAdmin();
}

function fecharAdmin(){
  const o = document.getElementById("adminOverlay");
  if(!o) return;
  o.style.display="none";
  o.setAttribute("aria-hidden","true");
}

function entrarAdmin(){
  const em = (document.getElementById("adminEmail")?.value || "").trim().toLowerCase();
  const se = (document.getElementById("adminSenha")?.value || "").trim();
  const msg = document.getElementById("adminMsg");
  if(!em || !se){
    if(msg){ msg.textContent="Preencha e-mail e senha do administrador."; msg.className="auth-msg err"; }
    return;
  }
  if(em === (ADMIN_LOGIN.email||"").toLowerCase() && se === ADMIN_LOGIN.senha){
    adminLogado = true;
    document.getElementById("adminLoginBox").style.display="none";
    document.getElementById("adminPainel").style.display="block";
    if(msg){ msg.textContent="Acesso de administrador liberado."; msg.className="auth-msg ok"; }
    // Puxa credenciais/assinaturas do Firestore antes de listar no painel
    Promise.resolve(cloudSyncUsersToLocal(true)).finally(() => preencherCamposAdmin());
  }else{
    if(msg){ msg.textContent="Admin inválido."; msg.className="auth-msg err"; }
  }
}

function sairAdmin(){
  adminLogado = false;
  const msg2 = document.getElementById("adminMsg2");
  if(msg2){ msg2.textContent="Sessão do admin encerrada."; msg2.className="auth-msg ok"; }
  document.getElementById("adminPainel").style.display="none";
  document.getElementById("adminLoginBox").style.display="block";
}


function limparCamposArea(area){
  const ids = {
    pedagogica: { email:"userPedEmail", senha:"userPedSenha", ass:"userPedAss" },
    clinica:    { email:"userCliEmail", senha:"userCliSenha", ass:"userCliAss" },
    social:     { email:"userSocEmail", senha:"userSocSenha", ass:"userSocAss" }
  }[area];
  if(!ids) return;
  const e = document.getElementById(ids.email); if(e) e.value = "";
  const s = document.getElementById(ids.senha); if(s) s.value = "";
  const a = document.getElementById(ids.ass);  if(a) a.value = "";
}

function renderCredenciaisArea(area){
  const db = loadUsersArea();
  const lista = db[area] || [];
  const mapList = {
    pedagogica:"credList_pedagogica",
    clinica:"credList_clinica",
    social:"credList_social"
  };
  const host = document.getElementById(mapList[area]);
  if(!host) return;
  host.innerHTML = "";

  if(!lista.length){
    host.innerHTML = '<div class="auth-sub" style="margin:6px 0 0;">Nenhuma credencial cadastrada.</div>';
    return;
  }

  lista.forEach((u)=>{
    const item = document.createElement("div");
    item.className = "cred-item";
    const left = document.createElement("div");
    left.className = "cred-info";

    const thumb = document.createElement("div");
    thumb.className = "cred-thumb";
    if(u.assinaturaDataUrl){
      const im = document.createElement("img");
      im.src = u.assinaturaDataUrl;
      im.alt = "Assinatura";
      thumb.appendChild(im);
    }else{
      thumb.innerHTML = '<i class="fas fa-signature" style="opacity:.55"></i>';
    }

    const mail = document.createElement("div");
    mail.className = "mail";
    mail.textContent = u.email || "(sem e-mail)";

    left.appendChild(thumb);
    left.appendChild(mail);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn-mini btn-mini-danger";
    del.innerHTML = '<i class="fas fa-trash"></i> Excluir';
    del.addEventListener("click", ()=> excluirUsuarioArea(area, u.id));

    item.appendChild(left);
    item.appendChild(del);
    host.appendChild(item);
  });
}

function renderCredenciaisTodas(){
  renderCredenciaisArea("pedagogica");
  renderCredenciaisArea("clinica");
  renderCredenciaisArea("social");
}

function preencherCamposAdmin(){
  // deixa pronto para cadastrar 1 por vez
  limparCamposArea("pedagogica");
  limparCamposArea("clinica");
  limparCamposArea("social");

  renderCredenciaisTodas();
}




async function salvarUsuarioArea(area){
  if(!adminLogado){
    abrirAdmin();
    return;
  }
  const db = loadUsersArea();
  let emailEl, senhaEl, assEl;
  if(area==="pedagogica"){ emailEl="userPedEmail"; senhaEl="userPedSenha"; assEl="userPedAss"; }
  if(area==="clinica"){ emailEl="userCliEmail"; senhaEl="userCliSenha"; assEl="userCliAss"; }
  if(area==="social"){ emailEl="userSocEmail"; senhaEl="userSocSenha"; assEl="userSocAss"; }

  const em = (document.getElementById(emailEl)?.value || "").trim().toLowerCase();
  const se = (document.getElementById(senhaEl)?.value || "").trim();
  const msg2 = document.getElementById("adminMsg2");
  const inputFile = document.getElementById(assEl);
  const file = inputFile?.files?.[0] || null;

  if(!em || !se){
    if(msg2){ msg2.textContent="Preencha e-mail e senha para a área."; msg2.className="auth-msg err"; }
    return;
  }
  if(!file){
    if(msg2){ msg2.textContent="Envie a imagem da assinatura (obrigatório) para cadastrar esta credencial."; msg2.className="auth-msg err"; }
    return;
  }

  // Impede duplicar por e-mail na mesma área
  const lista = db[area] || [];
  if(lista.some(u => (u.email||"").toLowerCase() === em)){
    if(msg2){ msg2.textContent="Já existe uma credencial cadastrada com esse e-mail nesta área."; msg2.className="auth-msg err"; }
    return;
  }

  let assinaturaDataUrl = "";
  try{
    assinaturaDataUrl = await readFileAsDataURL(file);
  }catch(e){
    if(msg2){ msg2.textContent="Não foi possível ler a imagem da assinatura. Tente novamente."; msg2.className="auth-msg err"; }
    return;
  }

  const novo = {
    id: "u_" + area + "_" + Date.now() + "_" + Math.random().toString(16).slice(2,8),
    email: em,
    senha: se,
    assinaturaDataUrl,
    criadoEm: Date.now()
  };

  db[area] = [...lista, novo];
  saveUsersArea(db);

  // Persiste também na nuvem (Firestore)
  try{ await cloudUpsertUser(novo); }catch(e){
    console.warn("Falha ao salvar credencial na nuvem (seguindo com local):", e);
  }

  // limpa para novo cadastro (1 por vez)
  limparCamposArea(area);

  // atualiza lista visual e previews
  renderCredenciaisArea(area);

  if(msg2){ msg2.textContent="Credencial cadastrada para " + areaLabel(area) + "."; msg2.className="auth-msg ok"; }
}

async function excluirUsuarioArea(area, id){
  if(!adminLogado){
    abrirAdmin();
    return;
  }
  if(!confirm("Excluir esta credencial?")) return;

  const db = loadUsersArea();
  const lista = db[area] || [];
  const alvo = lista.find(u => String(u.id) === String(id)) || null;
  db[area] = lista.filter(u => String(u.id) !== String(id));
  saveUsersArea(db);

  // Remove também da nuvem
  if(alvo?.email){
    try{ await cloudDeleteUser(area, alvo.email); }catch(e){
      console.warn("Falha ao excluir credencial na nuvem (seguindo com local):", e);
    }
  }

  // Se a credencial deletada estava logada, encerra sessão
  const s = getSessao();
  if(s && s.area === area && String(s.userId||"") === String(id)){
    clearSessao();
  }

  renderCredenciaisArea(area);

  const msg2 = document.getElementById("adminMsg2");
  if(msg2){ msg2.textContent="Credencial removida."; msg2.className="auth-msg ok"; }
}




const CHECKLIST_DB = {
  pedagogica: {
    "1. Cognição e Aprendizagem": [
      { label: "Atenção sustentada", texto: "Demonstra capacidade de manter o foco por períodos curtos a moderados, com mediação.", extra: "Oferecer tarefas segmentadas e pausas planejadas." },
      { label: "Atenção oscilante", texto: "Apresenta variação de foco, necessitando de redirecionamentos frequentes.", extra: "Reduzir distratores e usar sinais combinados para retomada." },
      { label: "Memória de trabalho", texto: "Mostra limitações para reter e manipular informações imediatas durante as tarefas.", extra: "Utilizar pistas visuais, repetição e instruções em etapas." },
      { label: "Compreensão de comandos", texto: "Compreende comandos simples, especialmente quando acompanhados de apoio visual.", extra: "Manter linguagem objetiva e demonstrar antes de solicitar." },
      { label: "Planejamento e organização", texto: "Necessita de apoio para planejar ações e organizar materiais/etapas.", extra: "Usar rotinas visuais, checklist de passos e modelagem." },
      { label: "Flexibilidade cognitiva", texto: "Apresenta rigidez em mudanças de rotina e transições.", extra: "Antecipar mudanças e oferecer escolhas limitadas." },
      { label: "Resolução de problemas", texto: "Dificulta-se em resolver situações novas sem ajuda direta.", extra: "Treinar tentativa/erro guiado e perguntas de mediação." },
      { label: "Generalização", texto: "Tem dificuldade em transferir aprendizados para contextos diferentes.", extra: "Variar contextos e repetir objetivos em ambientes diversos." },
      { label: "Ritmo de aprendizagem", texto: "Necessita de maior tempo para aquisição e consolidação de habilidades.", extra: "Reforçar com revisão frequente e prática espaçada." },
      { label: "Persistência", texto: "Pode interromper a tarefa diante de frustração ou dificuldade.", extra: "Reforço positivo, metas curtas e apoio emocional." },
      { label: "Iniciativa", texto: "A iniciativa é reduzida, aguardando direcionamentos para começar.", extra: "Usar prompts graduais e incentivar escolhas." },
      { label: "Autorregulação", texto: "Apresenta dificuldade para regular emoções durante exigências.", extra: "Estratégias de respiração, cantinho de regulação e combinados." },
      { label: "Resposta a feedback", texto: "Responde melhor a feedback imediato e concreto.", extra: "Dar retorno curto, específico e imediatamente após a ação." },
      { label: "Atenção compartilhada", texto: "A atenção compartilhada ocorre com apoio e estímulo do adulto.", extra: "Atividades de turnos e apontamento guiado." },
      { label: "Engajamento", texto: "Engaja-se mais quando a atividade é significativa e lúdica.", extra: "Usar interesses do estudante e gamificação." },
      { label: "Percepção visual", texto: "Demonstra necessidade de apoio para discriminação visual em detalhes.", extra: "Usar contrastes, ampliar fonte e pareamento." },
      { label: "Percepção auditiva", texto: "Pode ter dificuldade em discriminar falas em ambiente ruidoso.", extra: "Ambiente mais silencioso e instruções próximas." },
      { label: "Sequenciação", texto: "Apresenta dificuldade em seguir sequências de ações.", extra: "Rotinas com imagens numeradas e repetição guiada." },
      { label: "Lateralidade/espacial", texto: "Pode confundir direita/esquerda e relações espaciais.", extra: "Atividades corporais e jogos de localização no espaço." },
      { label: "Tempo e rotina", texto: "Necessita de referência para noções de tempo (antes/depois).", extra: "Calendário visual e contagem regressiva de transições." }
    ],
    "2. Comunicação e Linguagem": [
      { label: "Comunicação não verbal", texto: "Utiliza gestos/expressões para comunicar necessidades de forma parcial.", extra: "Ampliar repertório com CAA e pistas visuais." },
      { label: "Comunicação verbal", texto: "Apresenta linguagem oral funcional em situações conhecidas.", extra: "Expandir vocabulário e treinar perguntas/respostas." },
      { label: "Ausência de fala funcional", texto: "Não utiliza fala funcional como principal meio de comunicação.", extra: "Implantar/fortalecer CAA com apoio multiprofissional." },
      { label: "Ecolalia", texto: "Apresenta repetição de falas (ecolalia) em alguns contextos.", extra: "Modelar respostas funcionais e ampliar intenção comunicativa." },
      { label: "Compreensão verbal", texto: "Compreende melhor instruções curtas e concretas.", extra: "Evitar metáforas; usar frases simples e exemplos." },
      { label: "Nomeação", texto: "Nomeia objetos/pessoas com apoio e em contextos familiares.", extra: "Jogos de nomeação com imagens reais e generalização." },
      { label: "Pragmática", texto: "Necessita de apoio para iniciar, manter e encerrar interações.", extra: "Treino de turnos, scripts sociais e rodas mediadas." },
      { label: "Atenção conjunta", texto: "A atenção conjunta ocorre com apoio e mediação do adulto.", extra: "Atividades de turnos e apontamento guiado." },
      { label: "Imitação", texto: "Imita ações simples com mediação.", extra: "Modelagem, espelhamento e reforço imediato." },
      { label: "Turnos de fala", texto: "Dificulta-se em aguardar sua vez.", extra: "Jogos de turnos com regras claras e temporizador." },
      { label: "Expressão emocional", texto: "Demonstra emoções, porém pode ter dificuldade em nomeá-las.", extra: "Cartões de emoções e rotinas de identificação." },
      { label: "Vocabulário restrito", texto: "Vocabulário é restrito a temas de interesse e rotinas.", extra: "Ampliar por categorias (objetos, lugares, ações)." },
      { label: "Narrativa", texto: "Dificuldade em relatar eventos com sequência e detalhes.", extra: "Sequência de imagens e perguntas guiadas." },
      { label: "Consciência fonológica", texto: "Necessita de apoio para rimas e sons iniciais.", extra: "Jogos de rimas, aliteração e segmentação oral." },
      { label: "Leitura de imagens", texto: "Compreende imagens/pictogramas com bom desempenho.", extra: "Usar suportes visuais na rotina e instruções." },
      { label: "Compreensão de histórias", texto: "Acompanha histórias curtas com apoio visual.", extra: "Leitura compartilhada e perguntas de compreensão." },
      { label: "Interação com pares", texto: "Interage com pares de forma pontual, com mediação.", extra: "Atividades cooperativas estruturadas e pareamento." },
      { label: "Solicitação de ajuda", texto: "Nem sempre solicita ajuda espontaneamente.", extra: "Ensinar sinais/expressões para pedir ajuda." },
      { label: "Resposta a perguntas", texto: "Responde melhor a perguntas fechadas e com opções.", extra: "Oferecer escolhas visuais e perguntas objetivas." },
      { label: "Comunicação funcional", texto: "Comunica necessidades básicas com pistas e rotina.", extra: "Rotinas de comunicação diária e reforço de iniciativa." }
    ],
    "3. Habilidades Acadêmicas": [
      { label: "Pré-leitura", texto: "Reconhece símbolos/figuras e inicia associação imagem-palavra.", extra: "Pareamento imagem-palavra e rótulos no ambiente." },
      { label: "Reconhecimento de letras", texto: "Identifica algumas letras do próprio nome/alfabeto.", extra: "Jogos de letras e atividades multissensoriais." },
      { label: "Escrita do nome", texto: "Registra o próprio nome com apoio e modelo.", extra: "Traçado guiado e prática diária." },
      { label: "Hipótese de escrita", texto: "Apresenta hipóteses iniciais de escrita, com registros não convencionais.", extra: "Consciência fonológica e escrita espontânea mediada." },
      { label: "Leitura global", texto: "Reconhece palavras familiares de forma global.", extra: "Cartões de palavras funcionais e leitura no cotidiano." },
      { label: "Compreensão leitora", texto: "Compreende textos curtos com mediação.", extra: "Perguntas simples e retomadas com imagens." },
      { label: "Motricidade fina", texto: "Necessita de apoio para preensão e controle do lápis.", extra: "Pinças, massinha, traçados e recorte." },
      { label: "Cópia", texto: "Copia com variação de alinhamento e tamanho.", extra: "Folhas pautadas ampliadas e modelo destacado." },
      { label: "Coordenação visomotora", texto: "Dificuldade em coordenação visomotora para escrita/desenho.", extra: "Labirintos, pontilhados e coordenação olho-mão." },
      { label: "Noção de número", texto: "Reconhece numerais em sequência limitada.", extra: "Bingo numérico e pareamento numeral-quantidade." },
      { label: "Contagem", texto: "Realiza contagem verbal com correspondência variável.", extra: "Contagem com objetos e marcação visual." },
      { label: "Comparação de quantidades", texto: "Dificulta-se em comparar mais/menos/igual.", extra: "Jogos de comparação com material concreto." },
      { label: "Classificação", texto: "Classifica por cor/forma com apoio.", extra: "Atividades por categorias e agrupamentos." },
      { label: "Seriação", texto: "Organiza sequências simples com ajuda.", extra: "Seriação com blocos, figuras e objetos." },
      { label: "Medidas", texto: "Inicia compreensão de medidas em situações práticas.", extra: "Receitas e medir com utensílios." },
      { label: "Rotina/tempo", texto: "Reconhece momentos da rotina com apoio visual.", extra: "Quadro de rotina e calendário." },
      { label: "Autonomia acadêmica", texto: "Necessita de ajuda para iniciar/finalizar atividades.", extra: "Prompts graduais e metas pequenas." },
      { label: "Participação em grupo", texto: "Participa de atividades coletivas com mediação.", extra: "Combinados visuais e organização do espaço." },
      { label: "Uso de tecnologia", texto: "Responde bem a recursos digitais como suporte.", extra: "Apps educativos e recursos de acessibilidade." },
      { label: "Avaliação adaptada", texto: "Necessita de adequações de acesso e resposta.", extra: "Tempo ampliado, mediação e formatos alternativos." }
    ]
  },

  clinica: {
    "1. Desenvolvimento e Saúde": [
      { label: "Histórico de desenvolvimento", texto: "Há relato de atraso e/ou diferenças no desenvolvimento neuropsicomotor.", extra: "Manter acompanhamento clínico especializado conforme necessidade." },
      { label: "Sono", texto: "Apresenta alterações de sono que impactam disposição e atenção.", extra: "Orientar higiene do sono e alinhar com a família." },
      { label: "Alimentação", texto: "Demonstra seletividade alimentar e/ou dificuldades na aceitação.", extra: "Estratégias graduais e acompanhamento multiprofissional." },
      { label: "Audição", texto: "Há necessidade de monitoramento auditivo.", extra: "Encaminhar para avaliação audiológica quando indicado." },
      { label: "Visão", texto: "Há necessidade de monitoramento visual.", extra: "Encaminhar para avaliação oftalmológica quando indicado." },
      { label: "Convulsões", texto: "Há relato de crises convulsivas controladas/em investigação.", extra: "Plano de segurança e acompanhamento neurológico." },
      { label: "Medicação", texto: "Pode fazer uso de medicação com impacto em alerta/atenção.", extra: "Registrar efeitos observados e comunicar responsáveis." },
      { label: "Alergias", texto: "Há relatos de alergias que exigem cuidados.", extra: "Plano de cuidados e comunicação com a equipe." },
      { label: "Comorbidades", texto: "Há indícios de condições associadas que impactam aprendizagem.", extra: "Acompanhamento interdisciplinar e registro sistemático." },
      { label: "Regulação emocional", texto: "Variações de humor e reações intensas a frustrações.", extra: "Rotina previsível e estratégias de regulação." },
      { label: "Sensibilidade sonora", texto: "Reage a ruídos com desconforto ou fuga.", extra: "Reduzir ruídos e considerar protetor auricular." },
      { label: "Sensibilidade tátil", texto: "Desconforto com toque/texturas em algumas situações.", extra: "Respeitar limites e oferecer adaptação sensorial." },
      { label: "Sensibilidade visual", texto: "Incomoda-se com luz forte/excesso de estímulos visuais.", extra: "Iluminação indireta e organização visual." },
      { label: "Comunicação de dor", texto: "Nem sempre comunica dor com clareza.", extra: "Observar sinais, registrar e comunicar família." },
      { label: "Saúde bucal", texto: "Necessita de apoio para higiene bucal.", extra: "Orientações e encaminhamento quando necessário." },
      { label: "Controle esfincteriano", texto: "Está em processo de autonomia para uso do banheiro.", extra: "Rotina com reforço e apoio gradual." },
      { label: "Higiene pessoal", texto: "Necessita mediação para higienização.", extra: "Rotinas visuais e treino de autonomia." },
      { label: "Segurança pessoal", texto: "Precisa de apoio para reconhecer riscos.", extra: "Ensino explícito de regras de segurança." },
      { label: "Consultas/rotinas médicas", texto: "Pode demandar consultas e terapias frequentes.", extra: "Articular horários e registrar em plano." },
      { label: "Acompanhamento terapêutico", texto: "Pode se beneficiar de fono/TO/psico/fisio.", extra: "Alinhar objetivos escolares com equipe terapêutica." }
    ],
    "2. Autonomia e Motricidade": [
      { label: "Coordenação grossa", texto: "Dificuldades em corrida, saltos e mudanças de direção.", extra: "Atividades motoras graduais e suporte quando indicado." },
      { label: "Equilíbrio", texto: "Instabilidade em postura estática/dinâmica.", extra: "Circuitos simples e exercícios de equilíbrio." },
      { label: "Coordenação bilateral", texto: "Dificuldade em usar as duas mãos de forma coordenada.", extra: "Atividades bimanual e jogos de encaixe." },
      { label: "Motricidade fina", texto: "Dificuldade em pinça, recorte, encaixe e escrita.", extra: "Atividades lúdicas e apoio de TO se indicado." },
      { label: "Planejamento motor", texto: "Dificuldade em organizar movimentos em sequência.", extra: "Modelagem, pistas visuais e repetição guiada." },
      { label: "Tônus muscular", texto: "Pode apresentar hipotonia/hipertonia.", extra: "Ajustes posturais e orientação especializada." },
      { label: "Postura", texto: "Necessita adequações posturais para ficar sentado.", extra: "Ajuste de mobiliário e apoio postural." },
      { label: "Resistência física", texto: "Fadiga em atividades prolongadas.", extra: "Pausas, alternância de tarefas e hidratação." },
      { label: "Locomoção", texto: "Segurança na locomoção é variável.", extra: "Rotas seguras e supervisão nas transições." },
      { label: "Escadas/desníveis", texto: "Dificuldade em escadas e desníveis.", extra: "Treino supervisionado e uso de corrimão." },
      { label: "Óculo-manual", texto: "Dificulta-se em arremessar/receber objetos.", extra: "Bolas leves, metas próximas e progressão." },
      { label: "Esquema corporal", texto: "Consolida noções do corpo e partes corporais.", extra: "Músicas, espelho e atividades corporais." },
      { label: "Lateralidade", texto: "Lateralidade indefinida/confusão direcional.", extra: "Jogos de direita/esquerda e pistas visuais." },
      { label: "Orientação espacial", texto: "Dificuldade em localizar objetos e seguir trajetos.", extra: "Marcações visuais e rotas simples." },
      { label: "Autonomia alimentar", texto: "Necessita apoio para uso de talheres.", extra: "Treino funcional e utensílios adaptados." },
      { label: "Autonomia no vestir", texto: "Apoio para vestir/abotoar/fechar zíper.", extra: "Treino por etapas e recursos facilitadores." },
      { label: "Organização de materiais", texto: "Dificulta-se em organizar mochila/itens.", extra: "Rotina de organização com imagens." },
      { label: "Acessibilidade", texto: "Responde a adaptações (pranchas, teclado, etc.).", extra: "Manter e revisar recursos de acessibilidade." },
      { label: "Pausas sensoriais", texto: "Pode apresentar cansaço sensorial ao longo do dia.", extra: "Pausas sensoriais e organização de demandas." },
      { label: "Nível de apoio", texto: "Necessita apoio humano e/ou tecnológico para participar.", extra: "Definir apoios e responsabilidades na rotina." }
    ],
    "3. Comportamento e Sensorial": [
      { label: "Fuga/recusa", texto: "Evita demandas quando a tarefa é difícil.", extra: "Ajustar exigência e reforçar tentativa." },
      { label: "Crises", texto: "Desorganização diante de mudanças/sobrecarga.", extra: "Plano de manejo e previsibilidade." },
      { label: "Inquietação", texto: "Necessidade de movimento frequente.", extra: "Pausas ativas e tarefas com movimento." },
      { label: "Impulsividade", texto: "Age sem esperar orientação.", extra: "Regras claras, sinais e reforço por autocontrole." },
      { label: "Reatividade", texto: "Reação intensa a frustrações/limites.", extra: "Estratégias de regulação e análise funcional." },
      { label: "Autoagressão", texto: "Possíveis comportamentos autoagressivos em situações específicas.", extra: "Registro, prevenção e acompanhamento." },
      { label: "Estereotipias", texto: "Movimentos repetitivos em ansiedade/autorregulação.", extra: "Alternativas sensoriais e aceitação quando seguro." },
      { label: "Interesses restritos", texto: "Foco intenso em temas/objetos específicos.", extra: "Usar como motivação e ampliar repertório." },
      { label: "Rigidez", texto: "Resistência a mudanças de rotina.", extra: "Antecipação e transições graduais." },
      { label: "Transições", texto: "Dificuldade em trocar de atividade.", extra: "Avisos prévios, temporizador e escolha." },
      { label: "Hiper/hiporreatividade", texto: "Resposta sensorial aumentada ou reduzida.", extra: "Adaptações ambientais e estratégias sensoriais." },
      { label: "Busca sensorial", texto: "Procura estímulos para organizar-se.", extra: "Cantinho sensorial e objetos reguladores." },
      { label: "Tolerância à frustração", texto: "Tolerância reduzida quando não atinge objetivo.", extra: "Ensinar pedir pausa e reforçar esforço." },
      { label: "Autorregulação emocional", texto: "Precisa de apoio para identificar e regular emoções.", extra: "Rotina de emoções e estratégias combinadas." },
      { label: "Proximidade física", texto: "Reage à aproximação física de colegas/adultos.", extra: "Orientar pares e respeitar limites." },
      { label: "Interação social", texto: "Interação limitada ou atípica.", extra: "Mediação com pares e atividades estruturadas." },
      { label: "Regras e limites", texto: "Necessita ensino explícito de regras.", extra: "Combinados visuais e prática guiada." },
      { label: "Percepção de risco", texto: "Baixa percepção de risco (correr, subir).", extra: "Supervisão e ensino de segurança." },
      { label: "Reforço positivo", texto: "Responde bem a reforçadores e metas curtas.", extra: "Plano de reforço e registro de progresso." },
      { label: "Alinhamento família-escola", texto: "Demanda consistência entre escola e família.", extra: "Reuniões periódicas e comunicação estruturada." }
    ]
  },

  social: {
    "1. Contexto Familiar e Rede": [
      { label: "Composição familiar", texto: "A família tem cuidadores de referência definidos.", extra: "Registrar responsáveis e manter comunicação contínua." },
      { label: "Participação familiar", texto: "Participação nas demandas escolares é variável.", extra: "Fortalecer vínculo e canais de comunicação." },
      { label: "Rede de apoio", texto: "Rede de apoio participa parcialmente.", extra: "Articular rede e encaminhar quando necessário." },
      { label: "Vínculo com a escola", texto: "Vínculo em construção requer acolhimento.", extra: "Ações de acolhimento e escuta ativa." },
      { label: "Rotina domiciliar", texto: "Rotina em casa influencia hábitos e participação escolar.", extra: "Orientações e alinhamento de rotinas com a família." },
      { label: "Cuidador principal", texto: "Há cuidador principal responsável pelas rotinas.", extra: "Mapear disponibilidade e orientar sobre rede de serviços." },
      { label: "Consultas/terapias", texto: "Necessita suporte para consultas/terapias.", extra: "Organizar agenda e orientar sobre transporte/benefícios." },
      { label: "Comunicação família-escola", texto: "Melhor resposta a mensagens objetivas e frequentes.", extra: "Diário de recados e comunicação estruturada." },
      { label: "Histórico escolar", texto: "Histórico com interrupções/trocas de escola.", extra: "Registrar histórico e planejar acolhimento." },
      { label: "Adesão às orientações", texto: "Adesão variável, com necessidade de mediação.", extra: "Reuniões e orientação em linguagem simples." },
      { label: "Dinâmica familiar", texto: "Dinâmica pode impactar frequência/comportamento.", extra: "Acolhimento e encaminhamento quando indicado." },
      { label: "Fatores de risco", texto: "Possíveis fatores de risco social demandam atenção.", extra: "Acionar rede de proteção quando necessário." },
      { label: "Documentação", texto: "Documentos podem estar incompletos.", extra: "Orientar regularização junto aos órgãos." },
      { label: "Transporte", texto: "Necessidade de apoio para deslocamento.", extra: "Articular transporte e rotas seguras." },
      { label: "Acesso à saúde", texto: "Barreiras de acesso a serviços de saúde.", extra: "Encaminhar e apoiar agendamentos." },
      { label: "Acesso a terapias", texto: "Necessita terapias na rede pública/privada.", extra: "Orientar busca e articular serviços." },
      { label: "CRAS/CREAS", texto: "Há vínculo ou necessidade de vínculo com CRAS/CREAS.", extra: "Encaminhar e acompanhar com a rede." },
      { label: "Conselho Tutelar", texto: "Pode demandar interface com rede de proteção.", extra: "Seguir fluxos institucionais e registrar." },
      { label: "Intersetorialidade", texto: "Necessita articulação educação-saúde-assistência.", extra: "Plano integrado de acompanhamento." },
      { label: "Acompanhamento social", texto: "Demanda acompanhamento social sistemático.", extra: "Definir periodicidade e registrar atendimentos." }
    ],
    "2. Condições Socioeconômicas": [
      { label: "Renda familiar", texto: "Renda limitada impacta acesso a recursos.", extra: "Orientar programas e benefícios sociais." },
      { label: "Trabalho/emprego", texto: "Situação laboral pode ser instável.", extra: "Encaminhar a serviços socioassistenciais quando aplicável." },
      { label: "Moradia", texto: "Condições de moradia podem demandar atenção.", extra: "Articular rede e orientar conforme necessidade." },
      { label: "Segurança alimentar", texto: "Pode haver insegurança alimentar em períodos do mês.", extra: "Encaminhar rede e políticas públicas." },
      { label: "Gastos com saúde", texto: "Gastos elevados com saúde/terapias.", extra: "Orientar benefícios e isenções quando cabíveis." },
      { label: "Internet/dispositivos", texto: "Acesso a internet/dispositivos pode ser limitado.", extra: "Alternativas offline e apoio institucional." },
      { label: "Material escolar", texto: "Dificuldade para aquisição de materiais.", extra: "Articular apoio institucional/programas." },
      { label: "Sobrecarga do cuidador", texto: "Rotina de cuidado intensivo pode sobrecarregar.", extra: "Acolhimento e orientação sobre suporte ao cuidador." },
      { label: "Vulnerabilidade", texto: "Vulnerabilidade socioeconômica identificada.", extra: "Acompanhamento e encaminhamentos conforme avaliação." },
      { label: "Endividamento", texto: "Endividamento pode comprometer orçamento.", extra: "Orientação e encaminhamento socioassistencial." },
      { label: "Benefícios eventuais", texto: "Pode necessitar de benefícios eventuais.", extra: "Encaminhar conforme critérios da rede." },
      { label: "Mudanças frequentes", texto: "Mudanças de endereço impactam continuidade escolar.", extra: "Registrar e orientar para permanência." },
      { label: "Lazer/cultura", texto: "Acesso a lazer e cultura pode ser restrito.", extra: "Sugerir atividades comunitárias gratuitas." },
      { label: "Apoio comunitário", texto: "Apoio comunitário (ONG/igreja) pode contribuir.", extra: "Mapear e articular quando pertinente." },
      { label: "Território de risco", texto: "O território pode apresentar riscos.", extra: "Orientar cuidados e articular rede." },
      { label: "Transporte público", texto: "Dificuldades com transporte público impactam frequência.", extra: "Avaliar necessidade de transporte escolar." },
      { label: "Horários do cuidador", texto: "Cuidador pode ter horários restritos.", extra: "Flexibilizar comunicação e orientar apoio." },
      { label: "Documentos para benefícios", texto: "Falta de documentos limita acesso a benefícios.", extra: "Orientar documentação e regularização." },
      { label: "Barreiras financeiras", texto: "Barreiras financeiras afetam participação escolar.", extra: "Adequar propostas e reduzir custos." },
      { label: "Suporte contínuo", texto: "Necessita suporte social contínuo para estabilidade.", extra: "Plano de acompanhamento com metas." }
    ],
    "3. Acesso a Direitos e Serviços": [
      { label: "BPC/LOAS", texto: "Possui ou pode se enquadrar para BPC/LOAS.", extra: "Orientar requerimento e CadÚnico." },
      { label: "CadÚnico", texto: "Cadastro pode estar desatualizado.", extra: "Orientar atualização junto ao CRAS." },
      { label: "Passe livre", texto: "Pode se beneficiar de passe livre/benefícios de transporte.", extra: "Orientar solicitação conforme regras locais." },
      { label: "Carteira PcD", texto: "Pode necessitar identificação PcD para acesso a direitos.", extra: "Orientar emissão conforme município/estado." },
      { label: "Isenções", texto: "Pode ter direito a isenções conforme critérios.", extra: "Orientar busca com assistência social." },
      { label: "Direitos educacionais", texto: "Necessita garantia de acessibilidade e apoios na escola.", extra: "Registrar adequações e orientar família." },
      { label: "Orientação jurídica", texto: "Pode necessitar orientação jurídica em demandas específicas.", extra: "Encaminhar para defensoria/serviços." },
      { label: "Rede de proteção", texto: "Necessita interface com rede de proteção, quando aplicável.", extra: "Seguir fluxos institucionais e registrar." },
      { label: "Saúde mental", texto: "Pode necessitar CAPS/serviços especializados.", extra: "Encaminhar conforme rede de saúde." },
      { label: "Reabilitação", texto: "Pode se beneficiar de serviços de reabilitação.", extra: "Orientar e articular encaminhamento." },
      { label: "Atualização documental", texto: "Pode precisar atualizar documentos clínicos periodicamente.", extra: "Orientar família sobre prazos e serviços." },
      { label: "Acessibilidade", texto: "Acessibilidade pode demandar adaptações.", extra: "Orientar e buscar recursos com a rede." },
      { label: "Programas educacionais", texto: "Pode acessar programas/auxílios educacionais.", extra: "Orientar conforme políticas vigentes." },
      { label: "Normativas PR", texto: "Demandas devem observar normativas do Paraná.", extra: "Atuar conforme orientações vigentes (CEE/PR e SEED/PR)." },
      { label: "Devolutivas de terapias", texto: "Necessita devolutivas de terapias para alinhar ações.", extra: "Solicitar devolutivas e alinhar objetivos." },
      { label: "Acompanhamento periódico", texto: "Necessita reavaliação e acompanhamento social periódico.", extra: "Definir cronograma e registrar evolução." },
      { label: "Plano intersetorial", texto: "Beneficia-se de plano intersetorial de acompanhamento.", extra: "Reuniões com saúde/assistência/educação." },
      { label: "Garantia de direitos", texto: "Família precisa de suporte para garantia de direitos sociais.", extra: "Orientação contínua e encaminhamentos documentados." },
      { label: "Encaminhamentos formais", texto: "Encaminhamentos devem ser documentados e monitorados.", extra: "Registrar, acompanhar prazos e retornos." },
      { label: "Fortalecimento de vínculo", texto: "Fortalecer vínculo e autonomia familiar para sustentação do plano.", extra: "Ações educativas e acompanhamento contínuo." }
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

const OBSERVACAO_PADRAO = "Esta avaliação e o presente registro foram elaborados em conformidade com a legislação nacional e com as normativas do Estado do Paraná vigentes que regulamentam a Educação Especial na perspectiva da Educação Inclusiva, incluindo diretrizes educacionais federais e estaduais, bem como orientações e atos normativos aplicáveis do CEE/PR e da SEED/PR.";


/* ============ 3B) ENCAMINHAMENTOS AUTOMÁTICOS (A PARTIR DO CHECKLIST) ============ */
function normalizarLinhaEnc(l) {
  return (l || "").replace(/^[-•\s]+/, "").trim();
}
function montarEncAuto() {
  const partes = [];
  const addSec = (titulo, texto) => {
    const linhas = (texto || "")
      .split("\n")
      .map(normalizarLinhaEnc)
      .filter(Boolean);
    if (!linhas.length) return;
    // remove duplicatas mantendo ordem
    const seen = new Set();
    const uniq = [];
    for (const ln of linhas) {
      const key = ln.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(`- ${ln}`);
    }
    partes.push(`${titulo}:\n${uniq.join("\n")}`);
  };

  addSec("PEDAGÓGICO", dadosRelatorio?.pedagogica?.extra || "");
  addSec("SAÚDE", dadosRelatorio?.clinica?.extra || "");
  addSec("SOCIAL", dadosRelatorio?.social?.extra || "");

  return partes.join("\n\n").trim();
}

function atualizarEncaminhamentosFinais(force = false) {
  const finEnc = document.getElementById("final-encaminhamentos");
  if (!finEnc) return;

  const auto = montarEncAuto();
  const userEdited = finEnc.dataset.useredit === "1";

  // Se usuário editou manualmente, não sobrescreve (a menos que force=true)
  if (!force && userEdited) return;

  // Só escreve se houver conteúdo automático; se não houver, não apaga conteúdo do usuário
  if (!auto) return;

  finEnc.value = auto;
  finEnc.dataset.auto = auto;
  if (finEnc.mirrorDiv) finEnc.mirrorDiv.innerText = finEnc.value;
  ajustarAltura(finEnc);
}

/* marca quando o usuário edita manualmente o campo de encaminhamentos */
function vincularEdicaoEncaminhamentos() {
  const finEnc = document.getElementById("final-encaminhamentos");
  if (!finEnc) return;
  finEnc.addEventListener("input", () => {
    finEnc.dataset.useredit = "1";
  });
}

function aplicarObservacaoPadrao(force=false) {
  const obs = document.getElementById("final-observacoes");
  if (!obs) return;
  obs.readOnly = true;
  obs.value = OBSERVACAO_PADRAO;
  if (obs.mirrorDiv) obs.mirrorDiv.innerText = obs.value;
  ajustarAltura(obs);
}

/* ============ 4) INICIALIZAÇÃO ============ */
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa Firebase e ativa o login global.
  try { initFirebase(); } catch (e) { console.error("Erro initFirebase:", e); }
  try { setupLoginGlobal(); } catch (e) { console.error("Erro setupLoginGlobal:", e); }
});

let __APP_BOOTED__ = false;
async function bootAppAfterLogin() {
  if (__APP_BOOTED__) return;
  __APP_BOOTED__ = true;

  // 1) Campos FIXOS e datas devem funcionar mesmo se algo der erro depois
  try { configurarEspelhoTextareas(); } catch (e) { console.error("Erro configurarEspelhoTextareas:", e); }

  // Sincroniza credenciais/assinaturas do ADMIN com a nuvem (Firestore)
  // para que todos os dispositivos vejam as mesmas credenciais.

  try { aplicarObservacaoPadrao(true); } catch (e) { console.error("Erro aplicarObservacaoPadrao:", e); }
  try { atualizarDataAvaliacaoLigada(true); } catch (e) { console.error("Erro atualizarDataAvaliacaoLigada:", e); }
  try { calcularIdade(); } catch (e) { console.error("Erro calcularIdade:", e); }

  // Listeners "garantia" (não dependem dos outros módulos)
  const dn = document.getElementById("dataNascimento");
  if (dn) dn.addEventListener("input", () => { try { calcularIdade(); } catch (e) {} });
  const da = document.getElementById("dataAvaliacao");
  if (da) da.addEventListener("input", () => { try { atualizarDataAvaliacaoLigada(false); } catch (e) {} });

  // 2) Restante da inicialização (cada etapa isolada para não quebrar o todo)
  try { aplicarAssinaturasCadastradas(); } catch (e) { console.error("Erro aplicarAssinaturasCadastradas:", e); }
  try { await carregarBancoDeDados(); } catch (e) { console.error("Erro carregarBancoDeDados:", e); }
  try { inicializarAssinaturas(); } catch (e) { console.error("Erro inicializarAssinaturas:", e); }
  try { prepararDatas(); } catch (e) { console.error("Erro prepararDatas:", e); }
  try { vincularEventos(); } catch (e) { console.error("Erro vincularEventos:", e); }
  try { vincularEdicaoEncaminhamentos(); } catch (e) { console.error("Erro vincularEdicaoEncaminhamentos:", e); }
  try { atualizarEncaminhamentosFinais(false); } catch (e) { console.error("Erro atualizarEncaminhamentosFinais:", e); }

  // 3) Se não existe ID, inicia como novo relatório
  try {
    if (!document.getElementById("reportId")?.value) {
      novoRelatorio(false);
    }
  } catch (e) { console.error("Erro novoRelatorio:", e); }

  // 4) Reforça novamente (garantia)
  try { aplicarObservacaoPadrao(true); } catch (e) {}
  try { atualizarDataAvaliacaoLigada(false); } catch (e) {}

}




function atualizarDataAvaliacaoLigada(forceHoje = false) {
  const inp = document.getElementById("dataAvaliacao");
  const span = document.getElementById("dataAtual");
  if (!inp || !span) return;

  let d;
  if (forceHoje || !inp.value) {
    d = new Date();
    // normaliza para YYYY-MM-DD
    const iso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
    inp.value = iso;
  } else {
    d = new Date(inp.value + "T00:00:00");
  }

  span.textContent = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

function prepararDatas() {
  // A data por extenso deve refletir a DATA DE AVALIAÇÃO
  atualizarDataAvaliacaoLigada(false);
}

/* ============ 5) SIDEBAR ============ */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("aberto");
}

function filtrarLista() {
  atualizarListaSidebar();
}

/* ============ 6) BANCO (CLOUD/FIRESTORE + FALLBACK LOCAL) ============ */

function __carregarBancoLocal() {
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

function __persistirBancoLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bancoRelatorios));
}

function __salvarNoBancoLocal() {
  const nome = (document.getElementById("nomeEstudante").value || "").trim();
  if (!nome) {
    alert("⚠️ Digite o NOME DO ESTUDANTE antes de salvar.");
    return;
  }

  // Coleta inputs/areas (exceto busca)
  const inputs = coletarInputs();

  // (Opcional) Seleção de assinaturas (caso exista no HTML)
  const elPed = document.getElementById("sel_pedagoga");
  const elPsi = document.getElementById("sel_psicologa");
  const elSoc = document.getElementById("sel_social");
  if (elPed) inputs.sel_pedagoga = elPed.value;
  if (elPsi) inputs.sel_psicologa = elPsi.value;
  if (elSoc) inputs.sel_social = elSoc.value;

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
  renderListaRelatoriosModal();

  // feedback no botão
  feedbackBotaoSalvar();

  // após salvar, travar identificação (conforme pedido)
  travarIdentificacao(true);

  // Após salvar: abrir "Meus Relatórios" e limpar a tela de coleta
  // (mantendo apenas as OBSERVAÇÕES COMPLEMENTARES fixas).
  try { abrirModalRelatorios(); } catch (e) {}
  try { novoRelatorio(false); } catch (e) {}
}

function __carregarRelatorioLocal(id) {
  const rel = bancoRelatorios.find(r => r.id === id);
  if (!rel) return false;
  // Abre diretamente (sem confirmação)
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
  atualizarDataAvaliacaoLigada(false);
  atualizarFinais();
  atualizarStatusAreas();
  aplicarObservacaoPadrao();

  // travar identificação ao carregar (pode destravar pelo botão)
  travarIdentificacao(true);

  // fecha sidebar (se estiver aberta)
  if (document.getElementById("sidebar").classList.contains("aberto")) toggleSidebar();
  return true;
}

function __deletarRelatorioLocal(id) {
  if (!confirm("ATENÇÃO: Deseja EXCLUIR PERMANENTEMENTE este relatório?")) return;

  bancoRelatorios = bancoRelatorios.filter(r => r.id !== id);
  persistirBanco();
  atualizarListaSidebar();

  if (document.getElementById("reportId").value === id) {
    novoRelatorio(false);
  }
}


async function carregarBancoDeDados() {
  // 1) Tenta Firebase / Firestore
  if (FB.ready && FB.db) {
    try {
      const snap = await FB.db
        .collection("relatorios")
        .orderBy("updatedAt", "desc")
        .limit(300)
        .get();

      bancoRelatorios = snap.docs.map((doc) => {
        const d = doc.data() || {};
        const updated = d.updatedAt && typeof d.updatedAt.toDate === "function" ? d.updatedAt.toDate() : null;
        return {
          id: doc.id,
          nome: (d.nomeEstudante || d.nome || "").toString(),
          data: updated ? updated.toISOString() : (d.dataISO || ""),
          dados: d.dados || {},
        dadosRelatorio: d.dadosRelatorio || null,
          size: d.size || 0
        };
      });

      atualizarListaSidebar();
      try { renderListaRelatoriosModal(); } catch (e) {}
      return;
    } catch (e) {
      console.error("Falha ao carregar do Firestore. Usando armazenamento local.", e);
    }
  }

  // 2) Fallback local
  return __carregarBancoLocal();
}

function persistirBanco() {
  // Mantemos cache local (útil offline / para não perder em caso de falha de rede)
  try { __persistirBancoLocal(); } catch (e) {}

  // No Firestore, o "persist" é feito no salvar/deletar.
}

async function salvarNoBanco(abrirModalDepois = true) {
  const nomeEl = document.getElementById("nomeEstudante");
  const nome = (nomeEl?.value || "").trim();

  if (!nome) {
    alert("Digite o NOME DO ESTUDANTE antes de salvar.");
    try { nomeEl?.focus(); } catch (e) {}
    return;
  }

  let dados;
  try {
    dados = coletarInputs();
  } catch (e) {
    console.error("Erro ao coletar dados do formulário:", e);
    alert("Ocorreu um erro ao coletar dados do formulário.");
    return;
  }

  // Garante Observações Complementares fixa
  try { aplicarObservacaoPadrao(true); } catch (e) {}

  // 1) Firestore
  if (FB.ready && FB.db) {
    try {
      const idEl = document.getElementById("reportId");
      let reportId = (idEl?.value || "").trim();

      const nowISO = new Date().toISOString();
      const payload = {
        nomeEstudante: nome,
        dados,
        dadosRelatorio: (typeof dadosRelatorio!=="undefined" ? JSON.parse(JSON.stringify(dadosRelatorio)) : null),
        dataISO: nowISO,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      if (!reportId) {
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        const docRef = await FB.db.collection("relatorios").add(payload);
        reportId = docRef.id;
        if (idEl) idEl.value = reportId;
      } else {
        await FB.db.collection("relatorios").doc(reportId).set(payload, { merge: true });
      }

      await carregarBancoDeDados();

      alert("Relatório salvo/atualizado com sucesso.");

      if (abrirModalDepois) {
        try { abrirModalRelatorios(); } catch (e) {}
      }

      // Após salvar: limpar a tela de coleta para um novo relatório
      // (mantém apenas as OBSERVAÇÕES COMPLEMENTARES fixas).
      try { novoRelatorio(false); } catch (e) {}
      return;
    } catch (e) {
      console.error("Erro ao salvar no Firestore. Usando fallback local.", e);
    }
  }

  // 2) Fallback local
  return __salvarNoBancoLocal(abrirModalDepois);
}


function coletarInputs() {
  // Coleta valores do formulário com base no id (inputs, textareas e selects).
  // Evita quebrar se algum elemento esperado não existir.
  const out = {};

  const els = document.querySelectorAll("input[id], textarea[id], select[id]");
  els.forEach((el) => {
    const id = el.id;
    if (!id) return;
    // campos auxiliares que não devem ir para o relatório/banco
    if (id === "buscaAluno" || id === "buscaRelatorio") return;

    const type = (el.type || "").toLowerCase();
    if (type === "file") return; // arquivos são tratados separadamente (assinaturas)

    if (type === "checkbox") {
      out[id] = !!el.checked;
      return;
    }
    if (type === "radio") {
      if (el.checked) out[id] = el.value;
      return;
    }

    out[id] = (el.value ?? "");
  });

  // Também inclui conteúdo editável (quando existir)
  document.querySelectorAll("[data-store-id]").forEach((node) => {
    const key = node.getAttribute("data-store-id");
    if (!key) return;
    out[key] = node.innerHTML;
  });

  return out;
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
  if (!lista) return;
  const termo = (document.getElementById("buscaAluno")?.value || "").toLowerCase();

  lista.innerHTML = "";
  const ordenado = [...bancoRelatorios].sort((a, b) => Number(b.id) - Number(a.id));

  ordenado.forEach(rel => {
    const idStr = String(rel.id ?? "");
    if (!(rel.nome.toLowerCase().includes(termo) || idStr.includes(termo))) return;

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

async function carregarRelatorio(id) {
  if (!id) return;

  const achado = (bancoRelatorios || []).find((r) => r.id === id);
  if (achado && achado.dados) {
    try {
      preencherFormularioComDados(achado.dados);
      const idEl = document.getElementById("reportId");
      if (idEl) idEl.value = id;
      try { fecharModalRelatorios(); } catch (e) {}
      return;
    } catch (e) {
      console.error("Erro ao preencher formulário com dados do cache:", e);
    }
  }

  if (FB.ready && FB.db) {
    try {
      const doc = await FB.db.collection("relatorios").doc(id).get();
      if (!doc.exists) {
        alert("Relatório não encontrado.");
        return;
      }
      const d = doc.data() || {};
      const dados = d.dados || {};
      preencherFormularioComDados(dados);

      const idEl = document.getElementById("reportId");
      if (idEl) idEl.value = id;

      try { fecharModalRelatorios(); } catch (e) {}
      return;
    } catch (e) {
      console.error("Erro ao carregar do Firestore. Usando fallback local.", e);
    }
  }

  return __carregarRelatorioLocal(id);
}

async function deletarRelatorio(id) {
  if (!id) return;
  if (!confirm("Tem certeza que deseja EXCLUIR este relatório?")) return;

  if (FB.ready && FB.db) {
    try {
      await FB.db.collection("relatorios").doc(id).delete();
      await carregarBancoDeDados();

      const idEl = document.getElementById("reportId");
      if (idEl && idEl.value === id) idEl.value = "";
      try { aplicarObservacaoPadrao(true); } catch (e) {}

      alert("Relatório excluído.");
      return;
    } catch (e) {
      console.error("Erro ao excluir no Firestore. Usando fallback local.", e);
    }
  }

  return __deletarRelatorioLocal(id);
}

function novoRelatorio(perguntar = true) {
  if (perguntar && !confirm("Deseja limpar a tela para iniciar um NOVO aluno?")) return;

  // limpa inputs/textarea (exceto fixos)
  document.querySelectorAll("input, textarea").forEach(el => {
    if (!el.id) return;
    if (["nre", "municipio", "escola", "buscaAluno", "final-observacoes"].includes(el.id)) return;
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

  atualizarStatusVisual("pedagogica");
  atualizarStatusVisual("clinica");
  atualizarStatusVisual("social");

  // identificação livre no novo
  travarIdentificacao(false);

  // mantém observações fixas e data vinculada
  aplicarObservacaoPadrao(true);
  atualizarStatusAreas();
  atualizarDataAvaliacaoLigada(true);

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
  if (nasc) {
    nasc.addEventListener("change", calcularIdade);
    nasc.addEventListener("input", calcularIdade);
  }

  // Toolbar do checklist (modal)
  const search = document.getElementById("checkSearch");
  if (search) search.addEventListener("input", aplicarFiltroChecklist);

  const btnAll = document.getElementById("btnMarcarTodos");
  if (btnAll) btnAll.addEventListener("click", () => marcarTodosChecklist(true));

  const btnClear = document.getElementById("btnLimparTodos");
  if (btnClear) btnClear.addEventListener("click", () => {
    const s = document.getElementById("checkSearch");
    if (s) s.value = "";
    aplicarFiltroChecklist();
    marcarTodosChecklist(false);
  });

  const dA = document.getElementById("dataAvaliacao");
  if (dA) {
    dA.addEventListener("change", () => atualizarDataAvaliacaoLigada(false));
    dA.addEventListener("input", () => atualizarDataAvaliacaoLigada(false));
  }
}

function calcularIdade() {
  const nascEl = document.getElementById("dataNascimento");
  const idadeEl = document.getElementById("idade");
  if (!idadeEl) return;

  const raw = (nascEl?.value || "").trim();
  if (!raw) {
    idadeEl.value = "";
    return;
  }

  // Evita bugs de fuso: prioriza valueAsDate (input type=date) e normaliza para data local
  let n;
  if (nascEl && nascEl.valueAsDate instanceof Date && !isNaN(nascEl.valueAsDate.getTime())) {
    // valueAsDate costuma vir em UTC; reinterpreta como data local (ano/mes/dia)
    const d = nascEl.valueAsDate;
    n = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  } else {
    n = new Date(raw + "T00:00:00");
  }

  if (isNaN(n.getTime())) {
    idadeEl.value = "";
    return;
  }

  const hoje = new Date();
  let idade = hoje.getFullYear() - n.getFullYear();
  const aniversarioEsteAno = new Date(hoje.getFullYear(), n.getMonth(), n.getDate());
  if (hoje < aniversarioEsteAno) idade--;

  if (idade < 0) idade = 0;
  idadeEl.value = `${idade} anos`;
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
function aplicarFiltroChecklist() {
  const q = (document.getElementById("checkSearch")?.value || "").trim().toLowerCase();
  const cards = document.querySelectorAll("#container-checklist .check-card");
  cards.forEach(card => {
    const texto = (card.innerText || "").toLowerCase();
    const ok = !q || texto.includes(q);
    const wrap = card.closest(".item-check");
    if (wrap) wrap.style.display = ok ? "" : "none";
  });
}

function marcarTodosChecklist(valor) {
  const inputs = document.querySelectorAll("#container-checklist .check-input");
  inputs.forEach(inp => {
    if (inp.checked !== valor) {
      inp.checked = valor;
      inp.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

function abrirModal(tipo) {
  // Controle de acesso por área
  if (!podeAcessarArea(tipo)) {
    abrirAuth(tipo);
    return;
  }

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

  const s = document.getElementById("checkSearch");
  if (s) s.value = "";

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

        // Cartão clicável (label envolvendo tudo)
        const card = document.createElement("label");
        card.className = "check-card";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "check-input";
        input.checked = checked;

        input.addEventListener("change", () => {
          procCheck(input.checked, item.texto, item.extra || "");
          aplicarFiltroChecklist();
        });

        const box = document.createElement("span");
        box.className = "check-box";
        box.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';

        const content = document.createElement("div");
        content.className = "check-content";
        content.innerHTML = `<strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.texto)}</small>`;

        card.appendChild(input);
        card.appendChild(box);
        card.appendChild(content);

        linha.appendChild(card);
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

  // Atualiza encaminhamentos finais automaticamente (prévia) se o usuário não editou manualmente
  atualizarEncaminhamentosFinais(false);
}



function marcarAreaConcluida(area){
  const statusEl = document.getElementById("status-" + area);
  if(statusEl){
    statusEl.textContent = "Concluída";
    statusEl.classList.remove("pendente");
    statusEl.classList.add("concluida");
  }
  // libera assinatura correspondente
  const role = assinaturaRoleParaArea(area);
  if(role){
    const box = document.querySelector(`#container_img_${role}`)?.closest(".assinatura-box");
    if(box) box.classList.remove("locked");
  }
}


function atualizarStatusAreas(){
  ["pedagogica","clinica","social"].forEach((area)=>{
    const data = dadosRelatorio[area] || {};
    const tem = (data.texto || "").trim().length > 0;
    const statusEl = document.getElementById("status-" + area);
    const role = assinaturaRoleParaArea(area);
    const box = role ? (document.querySelector(`#container_img_${role}`)?.closest(".assinatura-box")) : null;

    if(tem){
      if(statusEl){
        statusEl.textContent="Concluída";
        statusEl.classList.remove("pendente");
        statusEl.classList.add("concluida");
      }
      if(box) box.classList.remove("locked");
    } else {
      if(statusEl){
        statusEl.textContent="Pendente";
        statusEl.classList.add("pendente");
        statusEl.classList.remove("concluida");
      }
      if(box) box.classList.add("locked");
    }
  });
}

function salvarModal() {
  if (!modalAtual) return;

  dadosRelatorio[modalAtual] = {
    texto: document.getElementById("modalTexto").value || "",
    extra: document.getElementById("modalExtra").value || ""
  };
  marcarAreaConcluida(modalAtual);

  // mantém espelho do textarea oculto (para impressão)
  const hidden = document.getElementById(`texto-${modalAtual}`);
  if (hidden) {
    hidden.value = dadosRelatorio[modalAtual].texto;
    if (hidden.mirrorDiv) hidden.mirrorDiv.innerText = hidden.value;
  }

  atualizarStatusVisual(modalAtual);
  atualizarFinais();
  atualizarEncaminhamentosFinais(false);
  fecharModal();
}


function fecharModal(){
  const o = document.getElementById("modalOverlay");
  if(!o) return;
  const areaFechada = modalAtual;
  o.style.display = "none";
  o.setAttribute("aria-hidden","true");
  modalAtual = "";

  // Ao sair da avaliação: volta para a tela de login e senha da mesma área
  if(areaFechada && ["pedagogica","clinica","social"].includes(areaFechada)){
    clearSessao();
    abrirAuth(areaFechada);
  }
}


/* ============ 13) FINAIS AUTOMÁTICOS ============ */
function atualizarFinais() {
  // Indicações (prioriza extra pedagógico quando o campo estiver vazio ou igual ao último automático)
  const ind = document.getElementById("final-indicacoes");
  if (ind) {
    const autoInd = (dadosRelatorio.pedagogica.extra || "").trim();
    const ultimoAuto = ind.dataset.auto || "";
    if (autoInd && (!ind.value.trim() || ind.value.trim() === ultimoAuto)) {
      ind.value = autoInd;
      ind.dataset.auto = autoInd;
      if (ind.mirrorDiv) ind.mirrorDiv.innerText = ind.value;
      ajustarAltura(ind);
    }
  }

  // Encaminhamentos: migram automaticamente do checklist (extra) e se atualizam se o usuário não editou manualmente
  const finEnc = document.getElementById("final-encaminhamentos");
  if (finEnc) {
    let encAuto = "";
    const c = (dadosRelatorio.clinica.extra || "").trim();
    const s = (dadosRelatorio.social.extra || "").trim();

    if (c) encAuto += "SAÚDE:\n" + c + "\n\n";
    if (s) encAuto += "SOCIAL:\n" + s;

    encAuto = encAuto.trim();

    const ultimoAuto = finEnc.dataset.auto || "";
    // sobrescreve se estiver vazio OU se ainda estiver igual ao último automático (ou seja: não foi editado manualmente)
    if (encAuto && (!finEnc.value.trim() || finEnc.value.trim() === ultimoAuto)) {
      finEnc.value = encAuto;
      finEnc.dataset.auto = encAuto;
      if (finEnc.mirrorDiv) finEnc.mirrorDiv.innerText = finEnc.value;
      ajustarAltura(finEnc);
    }
  }

  atualizarEncaminhamentosFinais(false);
}


function gerarConclusaoAutomatica() {
  const nome = (document.getElementById("nomeEstudante")?.value || "").trim() || "o estudante";
  const conc = document.getElementById("final-conclusao");
  const ind  = document.getElementById("final-indicacoes");
  const encF = document.getElementById("final-encaminhamentos");
  if (!conc) return;

  // Se já tiver texto, pergunta antes de sobrescrever
  if (conc.value.trim() && !confirm("O campo de conclusão já possui texto. Deseja sobrescrever?")) return;

  // Lê as sínteses diretamente dos campos do HTML (evita erro se dadosRelatorio não estiver pronto)
  const pedRaw = (document.getElementById("texto-pedagogica")?.value || window.dadosRelatorio?.pedagogica?.texto || "").trim();
  const cliRaw = (document.getElementById("texto-clinica")?.value     || window.dadosRelatorio?.clinica?.texto     || "").trim();
  const socRaw = (document.getElementById("texto-social")?.value      || window.dadosRelatorio?.social?.texto      || "").trim();
  const ped = pedRaw.replace(/\n+/g, " ");
  const cli = cliRaw.replace(/\n+/g, " ");
  const soc = socRaw.replace(/\n+/g, " ");

  // Garante que encaminhamentos finais estejam atualizados a partir do checklist
  try { atualizarEncaminhamentosFinais(false); } catch (e) {}
  const encBase = (document.getElementById("encaminhamentos")?.value || "").trim();
  const encFinalAtual = (encF?.value || "").trim();

  conc.value =
`Considerando o processo avaliativo realizado, conclui-se que ${nome} apresenta necessidades educacionais específicas que requerem apoio sistemático e intervenções planejadas no contexto escolar.

Síntese pedagógica: ${ped || "Foram observadas características relevantes para organização de estratégias pedagógicas individualizadas."}

Síntese clínica: ${cli || "Foram consideradas informações sobre saúde, autonomia e aspectos do desenvolvimento."}

Síntese social: ${soc || "Foram levantadas informações sobre contexto familiar e rede de apoio."}

Recomenda-se continuidade do acompanhamento interdisciplinar, com adequações pedagógicas, suporte à comunicação e organização de rotinas, visando participação, aprendizagem e desenvolvimento integral.`;

  if (ind) {
    ind.value =
`Indicações pedagógicas e estratégias sugeridas:
• Planejar intervenções individualizadas com objetivos claros e avaliáveis.
• Oferecer recursos visuais, rotinas estruturadas e instruções em etapas.
• Garantir adaptações de acesso (tempo, mediação, materiais) conforme necessidade.
• Promover práticas de comunicação funcional e participação em atividades coletivas.
• Registrar progressos e ajustar estratégias continuamente.`;
    if (ind.mirrorDiv) ind.mirrorDiv.innerText = ind.value;
    ajustarAltura(ind);
  }

  if (encF) {
    // Prioriza o que veio do checklist; se estiver vazio, usa o campo 5.
    encF.value = encFinalAtual || encBase || "Encaminhamentos sugeridos:\n- Manter acompanhamento multiprofissional e adequações pedagógicas conforme necessidade.";
    if (encF.mirrorDiv) encF.mirrorDiv.innerText = encF.value;
    ajustarAltura(encF);
  }

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



/* ================= MODAL: MEUS RELATÓRIOS (HTML + PDF) ================= */
function abrirModalRelatorios() {
  const o = document.getElementById("relatoriosOverlay");
  if (!o) return;
  o.style.display = "flex";
  o.setAttribute("aria-hidden", "false");
  const busca = document.getElementById("buscaRelatorioModal");
  if (busca) {
    busca.value = "";
    busca.oninput = () => renderListaRelatoriosModal();
    setTimeout(() => busca.focus(), 50);
  }

  renderListaRelatoriosModal();
}

function fecharModalRelatorios() {
  const o = document.getElementById("relatoriosOverlay");
  if (!o) return;
  o.style.display = "none";
  o.setAttribute("aria-hidden", "true");
}

function abrirAbaRelatorios(aba) {
  const btnS = document.getElementById("tabBtnSalvos");
  const btnP = document.getElementById("tabBtnPdfs"); // pode não existir
  const aS = document.getElementById("abaSalvos");
  const aP = document.getElementById("abaPdfs"); // pode não existir

  // Se só existe a aba "Salvos", garante que ela esteja visível e ativa
  if (aS && !aP) {
    btnS?.classList.add("active");
    aS.classList.remove("hidden");
    return;
  }

  if (!btnS || !btnP || !aS || !aP) return;

  const isSalvos = aba === "salvos";
  btnS.classList.toggle("active", isSalvos);
  btnP.classList.toggle("active", !isSalvos);

  aS.classList.toggle("hidden", !isSalvos);
  aP.classList.toggle("hidden", isSalvos);
}


function renderListaRelatoriosModal() {
  const lista = document.getElementById("listaRelatoriosModal");
  if (!lista) return;

  const termo = (document.getElementById("buscaRelatorioModal")?.value || "").toLowerCase().trim();

  lista.innerHTML = "";
  const ordenado = [...bancoRelatorios].sort((a, b) => Number(b.id) - Number(a.id));

  if (ordenado.length === 0) {
    lista.innerHTML = `<div class="hint-mini"><i class="fas fa-circle-info"></i> Nenhum relatório salvo ainda.</div>`;
    return;
  }

  ordenado.forEach(rel => {
    if (termo && !(rel.nome.toLowerCase().includes(termo) || String(rel.id||"").includes(termo))) return;

    const item = document.createElement("div");
    item.className = "item-relatorio";
    item.setAttribute("role", "listitem");

    item.innerHTML = `
      <div class="meta">
        <h4>${escapeHtml(rel.nome)}</h4>
        <span><i class="far fa-clock"></i> ${escapeHtml(rel.dataSalvo || "")}</span>
      </div>
      <div class="acoes">
        <button class="btn-mini" type="button" title="Abrir">
          <i class="fas fa-folder-open"></i> Abrir
        </button>
        <button class="btn-mini danger" type="button" title="Excluir">
          <i class="fas fa-trash"></i> Excluir
        </button>
      </div>
    `;

    const btnAbrir = item.querySelector(".btn-mini");
    const btnExcluir = item.querySelector(".btn-mini.danger");

    btnAbrir.addEventListener("click", () => {
      try {
        carregarRelatorio(rel.id);
      } catch (e) {
        console.error("Erro ao abrir relatório:", e);
      }
      // Sempre fecha o modal ao clicar em Abrir (como solicitado)
      fecharModalRelatorios();
      // Leva o usuário ao topo do formulário
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
    });

    btnExcluir.addEventListener("click", () => {
      deletarRelatorio(rel.id);
      renderListaRelatoriosModal();
    });

    lista.appendChild(item);
  });
}

function exportarRelatorioAtualPDF() {
  // Exportação via impressão do navegador (Salvar como PDF)
  fecharModalRelatorios();
  setTimeout(() => window.print(), 200);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const o = document.getElementById("relatoriosOverlay");
    if (o && o.style.display === "flex") fecharModalRelatorios();
  }
});



/* ================= PDF (IndexedDB): importar / listar / baixar / excluir ================= */
const PDF_DB_NAME = "db_relatorios_pdfs_v1";
const PDF_STORE = "pdfs";

function abrirPdfDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error("IndexedDB não suportado neste navegador."));

    const req = indexedDB.open(PDF_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PDF_STORE)) {
        db.createObjectStore(PDF_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function adicionarPdfArquivo(file) {
  const db = await abrirPdfDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PDF_STORE, "readwrite");
    const store = tx.objectStore(PDF_STORE);

    const registro = {
      nome: file.name || "relatorio.pdf",
      tipo: file.type || "application/pdf",
      tamanho: file.size || 0,
      dataImportacao: new Date().toISOString(),
      blob: file
    };

    const req = store.add(registro);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);

    tx.oncomplete = () => db.close();
  });
}

async function listarPdfs() {
  const db = await abrirPdfDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PDF_STORE, "readonly");
    const store = tx.objectStore(PDF_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const arr = req.result || [];
      arr.sort((a, b) => (b.id || 0) - (a.id || 0));
      resolve(arr);
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function obterPdf(id) {
  const db = await abrirPdfDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PDF_STORE, "readonly");
    const store = tx.objectStore(PDF_STORE);
    const req = store.get(Number(id));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function excluirPdf(id) {
  const db = await abrirPdfDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PDF_STORE, "readwrite");
    const store = tx.objectStore(PDF_STORE);
    const req = store.delete(Number(id));
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function importarPDFs() {
  const input = document.getElementById("pdfInput");
  if (!input || !input.files || input.files.length === 0) {
    alert("Selecione pelo menos um arquivo PDF.");
    return;
  }

  const arquivos = Array.from(input.files).filter(f => (f.type === "application/pdf") || (f.name || "").toLowerCase().endsWith(".pdf"));
  if (arquivos.length === 0) {
    alert("Nenhum PDF válido selecionado.");
    return;
  }

  try {
    for (const f of arquivos) {
      await adicionarPdfArquivo(f);
    }
    input.value = "";
    renderListaPdfsModal();
    alert("PDF(s) importado(s) com sucesso!");
  } catch (e) {
    console.error(e);
    alert("Não foi possível importar o PDF. Verifique o tamanho do arquivo e tente novamente.");
  }
}

async function baixarPdf(id) {
  try {
    const reg = await obterPdf(id);
    if (!reg || !reg.blob) return alert("PDF não encontrado.");

    const url = URL.createObjectURL(reg.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = reg.nome || "relatorio.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch (e) {
    console.error(e);
    alert("Não foi possível baixar o PDF.");
  }
}


function extrairCandidatoIdDeNomeArquivo(nomeArquivo){
  if(!nomeArquivo) return "";
  const base = String(nomeArquivo).replace(/\.pdf$/i, "").trim();
  // tenta pegar prefixo antes de " - " ou " – "
  const parts = base.split(/[\s]*[-–][\s]*/);
  const first = (parts[0] || "").trim();

  // pega apenas dígitos do prefixo
  const digits = first.replace(/\D+/g, "");
  if(digits && digits.length >= 6) return digits;

  // fallback: procura algum bloco de dígitos no nome inteiro
  const m = base.match(/\b\d{6,}\b/);
  return m ? m[0] : "";
}

function tentarCarregarRelatorioAPartirDoPDF(p){
  // 1) tentar por ID no nome do arquivo
  const cand = extrairCandidatoIdDeNomeArquivo(p?.nome || "");
  if(cand){
    const achouId = bancoRelatorios.find(r => String(r.id) === String(cand));
    if(achouId){
      carregarRelatorio(achouId.id);
      fecharModalRelatorios();
      return true;
    }
  }

  // 2) tentar por nome (parte após o hífen)
  const base = String(p?.nome || "").replace(/\.pdf$/i, "").trim();
  const parts = base.split(/[\s]*[-–][\s]*/);
  const nomeParte = (parts.length >= 2 ? parts.slice(1).join(" - ") : "").trim();
  if(nomeParte){
    const lower = nomeParte.toLowerCase();
    // escolhe o mais recente
    const matches = bancoRelatorios
      .filter(r => (r.nome||"").toLowerCase().includes(lower))
      .sort((a,b) => Number(b.id) - Number(a.id));
    if(matches.length){
      carregarRelatorio(matches[0].id);
      fecharModalRelatorios();
      return true;
    }
  }

  alert("Não encontrei os dados desse PDF nos relatórios salvos.\n\nDica: salve o relatório no sistema (aba Salvos) e depois carregue por lá.");
  return false;
}


async function renderListaPdfsModal() {
  const lista = document.getElementById("listaPdfsModal");
  if (!lista) return;

  lista.innerHTML = "";
  try {
    const pdfs = await listarPdfs();
    if (pdfs.length === 0) {
      lista.innerHTML = `<div class="hint-mini"><i class="fas fa-circle-info"></i> Nenhum PDF importado.</div>`;
      return;
    }

    pdfs.forEach(p => {
      const item = document.createElement("div");
      item.className = "item-relatorio";
      item.setAttribute("role", "listitem");

      const data = (p.dataImportacao || "").replace("T", " ").slice(0, 16);
      const sizeKB = p.tamanho ? Math.round(p.tamanho / 1024) : 0;

      item.innerHTML = `
        <div class="meta">
          <h4>${escapeHtml(p.nome || "relatorio.pdf")}</h4>
          <span><i class="far fa-clock"></i> ${escapeHtml(data)} • ${escapeHtml(String(sizeKB))} KB</span>
        </div>
        <div class="acoes">
          <button class="btn-mini" type="button"><i class="fas fa-folder-open"></i> Carregar</button>
          <button class="btn-mini danger" type="button"><i class="fas fa-trash"></i> Excluir</button>
        </div>
      `;

      const [btnBaixar, btnExcluir] = item.querySelectorAll("button");
      btnBaixar.addEventListener("click", () => tentarCarregarRelatorioAPartirDoPDF(p));
      btnExcluir.addEventListener("click", async () => {
        await excluirPdf(p.id);
        renderListaPdfsModal();
      });

      lista.appendChild(item);
    });
  } catch (e) {
    console.error(e);
    lista.innerHTML = `<div class="hint-mini"><i class="fas fa-triangle-exclamation"></i> Não foi possível carregar os PDFs do navegador.</div>`;
  }
}



/* ===========================
   LOGIN GLOBAL (Firebase Auth)
   - Bloqueia o sistema até logar
   - Admin (admin@col.com) vê botão ADMIN
   - Usuários precisam existir em /users (enabled=true)
=========================== */

let CURRENT_USER = null;
let CURRENT_PROFILE = null;

function setAuthMsg(el, text, type){
  if(!el) return;
  el.textContent = text || "";
  el.className = "auth-msg" + (type ? (" " + type) : "");
  el.style.display = text ? "block" : "none";
}

function lockApp(locked){
  const overlay = document.getElementById("loginOverlay");
  const btnLogout = document.getElementById("btnLogout");
  if(overlay){
    overlay.style.display = locked ? "flex" : "none";
    overlay.setAttribute("aria-hidden", locked ? "false" : "true");
  }
  if(btnLogout){
    btnLogout.style.display = locked ? "none" : "inline-flex";
  }
}

async function fetchUserProfile(user){
  if(!FB.ready || !FB.db || !user) return null;
  // Admin sempre permitido
  if((user.email || "").toLowerCase() === (ADMIN_LOGIN.email || "").toLowerCase()){
    return { role: "admin", email: user.email, area: "admin", enabled: true, uid: user.uid };
  }

  // 1) tenta doc por UID
  try{
    const doc = await FB.usersCol.doc(user.uid).get();
    if(doc && doc.exists){
      const data = doc.data() || {};
      if(data.enabled === false) return null;
      return { ...data, uid: user.uid };
    }
  }catch(e){ console.warn("Perfil por UID falhou:", e); }

  // 2) fallback: query por e-mail
  try{
    const qs = await FB.usersCol.where("email","==",(user.email||"").toLowerCase()).limit(1).get();
    if(!qs.empty){
      const d = qs.docs[0];
      const data = d.data() || {};
      if(data.enabled === false) return null;
      return { ...data, uid: d.id };
    }
  }catch(e){ console.warn("Perfil por e-mail falhou:", e); }

  return null;
}

async function aplicarAssinaturasDaNuvem(){
  if(!FB.ready) return;
  try{
    const qs = await FB.usersCol.where("enabled","==", true).get();
    const porArea = { pedagogica:null, clinica:null, social:null };
    qs.forEach(doc=>{
      const u = doc.data() || {};
      const area = (u.area || "").trim();
      if(porArea[area] == null && u.assinaturaURL){
        porArea[area] = u.assinaturaURL;
      }
    });
    const ped = document.getElementById("previewPedAss");
    const cli = document.getElementById("previewCliAss");
    const soc = document.getElementById("previewSocAss");
    if(ped && porArea.pedagogica) ped.src = porArea.pedagogica;
    if(cli && porArea.clinica) cli.src = porArea.clinica;
    if(soc && porArea.social) soc.src = porArea.social;
  }catch(e){
    console.warn("Erro aplicarAssinaturasDaNuvem:", e);
  }
}

function setupLoginGlobal(){
  const emailEl = document.getElementById("loginEmail");
  const passEl  = document.getElementById("loginSenha");
  const btnEnter = document.getElementById("btnLoginEntrar");
  const btnForgot = document.getElementById("btnLoginEsqueci");
  const msgEl = document.getElementById("loginMsg");
  const btnAdmin = document.getElementById("btnAdmin");
  const btnLogout = document.getElementById("btnLogout");

  if(!FB.ready || !FB.auth){
    lockApp(false); // não travar caso firebase não carregue (evita tela travada)
    setAuthMsg(msgEl, "Firebase não carregou. Verifique sua internet e tente recarregar a página.", "err");
    return;
  }

  // Enter
  if(btnEnter){
    btnEnter.addEventListener("click", async () => {
      const em = (emailEl?.value || "").trim().toLowerCase();
      const se = (passEl?.value || "").trim();
      if(!em || !se){
        setAuthMsg(msgEl, "Informe e-mail e senha.", "err");
        return;
      }
      setAuthMsg(msgEl, "Entrando...", "");
      try{
        await FB.auth.signInWithEmailAndPassword(em, se);
      }catch(err){
        console.error(err);
        setAuthMsg(msgEl, "Não foi possível entrar. Verifique e-mail/senha ou procure o administrador.", "err");
      }
    });
  }

  // Forgot
  if(btnForgot){
    btnForgot.addEventListener("click", () => {
      setAuthMsg(msgEl, "Recuperação de senha: solicite ao ADMIN para redefinir sua senha no Firebase Authentication.", "ok");
    });
  }

  // Logout
  if(btnLogout){
    btnLogout.addEventListener("click", async () => {
      try{ await FB.auth.signOut(); }catch(e){}
    });
  }

  // Observer
  FB.auth.onAuthStateChanged(async (user) => {
    CURRENT_USER = user || null;
    CURRENT_PROFILE = null;

    // sempre esconde admin até validar
    if(btnAdmin) btnAdmin.style.display = "none";

    if(!user){
      lockApp(true);
      // limpa campos
      if(passEl) passEl.value = "";
      return;
    }

    // valida perfil
    const profile = await fetchUserProfile(user);
    if(!profile){
      try{ await FB.auth.signOut(); }catch(e){}
      lockApp(true);
      setAuthMsg(msgEl, "Acesso não autorizado. Procure o administrador para cadastrar seu usuário.", "err");
      return;
    }

    CURRENT_PROFILE = profile;

    // liberar app
    lockApp(false);
    setAuthMsg(msgEl, "", "");

    // mostra admin apenas se for admin
    const isAdmin = ((user.email||"").toLowerCase() === (ADMIN_LOGIN.email||"").toLowerCase());
    if(btnAdmin) btnAdmin.style.display = isAdmin ? "inline-flex" : "none";

    // aplica assinaturas da nuvem (para impressão/visualização)
    try{ await aplicarAssinaturasDaNuvem(); }catch(e){}

    // bootstrap app (uma vez)
    try{ await bootAppAfterLogin(); }catch(e){ console.error("Erro bootAppAfterLogin:", e); }
  });

  // trava no início até o observer rodar
  lockApp(true);
}

/* ===========================
   ADMIN (cadastra usuários no Firebase Authentication)
   - Cria usuário (Secondary App) para não desconectar o admin
   - Salva perfil em /users/{uid} com área + assinaturaURL
=========================== */

function isAdminLogado(){
  return !!(CURRENT_USER && (CURRENT_USER.email||"").toLowerCase() === (ADMIN_LOGIN.email||"").toLowerCase());
}

window.abrirAdmin = function(){
  if(!isAdminLogado()) return;
  const o = document.getElementById("adminOverlay");
  if(!o) return;
  o.style.display = "flex";
  o.setAttribute("aria-hidden","false");
  // ocultar login box, mostrar painel
  const lb = document.getElementById("adminLoginBox");
  const pn = document.getElementById("adminPainel");
  if(lb) lb.style.display = "none";
  if(pn) pn.style.display = "block";
  try{ listarUsuariosArea("pedagogica"); listarUsuariosArea("clinica"); listarUsuariosArea("social"); }catch(e){}
};

window.fecharAdmin = function(){
  const o = document.getElementById("adminOverlay");
  if(!o) return;
  o.style.display = "none";
  o.setAttribute("aria-hidden","true");
};

async function listarUsuariosArea(area){
  const cont = document.getElementById("credList_" + area);
  if(!cont || !FB.ready) return;
  cont.innerHTML = "";
  try{
    const qs = await FB.usersCol.where("area","==", area).where("enabled","==", true).get();
    if(qs.empty){
      cont.innerHTML = '<div class="cred-empty">Nenhum usuário cadastrado.</div>';
      return;
    }
    qs.forEach(doc=>{
      const u = doc.data() || {};
      const row = document.createElement("div");
      row.className = "cred-row";
      const info = document.createElement("div");
      info.className = "cred-info";
      info.innerHTML = `<strong>${(u.email||"")}</strong><br><small>Área: ${areaLabel(area)}</small>`;
      const actions = document.createElement("div");
      actions.className = "cred-actions";
      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "btn-sistema btn-vermelho";
      btnDel.innerHTML = '<i class="fas fa-trash"></i> Excluir';
      btnDel.addEventListener("click", async ()=>{
        if(!confirm("Excluir/Desativar este usuário?")) return;
        try{
          await FB.usersCol.doc(doc.id).set({ enabled:false, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge:true });
          if(u.storagePath){
            try{ await FB.storage.ref(u.storagePath).delete(); }catch(e){}
          }
          await listarUsuariosArea(area);
          await aplicarAssinaturasDaNuvem();
        }catch(e){
          alert("Não foi possível excluir. Verifique permissões do Firestore/Storage.");
          console.error(e);
        }
      });
      actions.appendChild(btnDel);

      row.appendChild(info);
      row.appendChild(actions);
      cont.appendChild(row);
    });
  }catch(e){
    console.error(e);
    cont.innerHTML = '<div class="cred-empty">Erro ao carregar usuários.</div>';
  }
}

// Cria usuário no Auth sem desconectar o admin (Secondary App)
async function createUserWithoutSwitch(email, senha){
  const name = "secondary";
  let secApp;
  try{
    secApp = firebase.app(name);
  }catch(e){
    secApp = firebase.initializeApp(firebaseConfig, name);
  }
  const secAuth = secApp.auth();
  const cred = await secAuth.createUserWithEmailAndPassword(email, senha);
  const uid = cred.user.uid;
  // limpa sessão do secundário
  try{ await secAuth.signOut(); }catch(e){}
  return uid;
}

window.salvarUsuarioArea = async function(area){
  if(!isAdminLogado()){
    alert("Apenas o ADMIN pode cadastrar usuários.");
    return;
  }
  if(!FB.ready) { alert("Firebase não inicializado."); return; }

  const map = {
    pedagogica: { email:"userPedEmail", senha:"userPedSenha", file:"userPedAss", preview:"previewPedAss" },
    clinica:    { email:"userCliEmail", senha:"userCliSenha", file:"userCliAss", preview:"previewCliAss" },
    social:     { email:"userSocEmail", senha:"userSocSenha", file:"userSocAss", preview:"previewSocAss" },
  };
  const cfg = map[area];
  if(!cfg){ alert("Área inválida."); return; }

  const emailEl = document.getElementById(cfg.email);
  const senhaEl = document.getElementById(cfg.senha);
  const fileEl  = document.getElementById(cfg.file);
  const prevEl  = document.getElementById(cfg.preview);

  const email = (emailEl?.value || "").trim().toLowerCase();
  const senha = (senhaEl?.value || "").trim();
  const file  = fileEl?.files?.[0];

  if(!email || !senha){
    alert("Informe e-mail e senha para cadastrar.");
    return;
  }
  if(!file){
    alert("Envie a imagem da assinatura.");
    return;
  }

  // prévia
  try{
    const fr = new FileReader();
    fr.onload = () => { if(prevEl) prevEl.src = fr.result; };
    fr.readAsDataURL(file);
  }catch(e){}

  // cria usuário no Auth e salva perfil
  try{
    const uid = await createUserWithoutSwitch(email, senha);

    const storagePath = `assinaturas/${uid}/${Date.now()}_${file.name}`;
    const ref = FB.storage.ref(storagePath);
    await ref.put(file);
    const url = await ref.getDownloadURL();

    const payload = {
      email,
      area,
      enabled: true,
      assinaturaURL: url,
      storagePath,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: CURRENT_USER?.uid || null,
    };

    await FB.usersCol.doc(uid).set(payload, { merge: true });

    alert("Usuário cadastrado com sucesso no Authentication e na nuvem.");

    // limpa apenas senha e arquivo (mantém e-mail para facilitar correções)
    if(senhaEl) senhaEl.value = "";
    if(fileEl) fileEl.value = "";

    await listarUsuariosArea(area);
    await aplicarAssinaturasDaNuvem();
  }catch(e){
    console.error(e);
    alert("Erro ao cadastrar usuário. Verifique se o e-mail já existe no Authentication e as permissões do Firebase.");
  }
};

/* ===========================
   AUTORIZAÇÃO POR ÁREA (opcional)
   - mantém compatibilidade com os botões existentes
=========================== */
function podeAcessarArea(area){
  if(!CURRENT_USER) return false;
  if(isAdminLogado()) return true;
  const a = (CURRENT_PROFILE?.area || "").trim();
  return a === area;
}

