// Health 7 — cartão "Clima espacial" com dados do NASA DONKI.
// Sem chave e sem servidor. Se a API falhar, usa a última cópia salva no navegador.

const API = "https://ccmc.gsfc.nasa.gov/DONKI-API/get";
const TIPOS = ["SEP", "FLR", "GST"];
const HISTORICO = { inicio: "2026-09-01", fim: "2026-09-10" }; // contém o SEP de 05/09/2026
const CHAVE_CACHE = "donki-cache-v1";

const $ = (id) => document.getElementById(id);

// ---------- datas ----------
const iso = (d) => d.toISOString().slice(0, 10);

function intervalo(dias) {
  const fim = new Date();
  const ini = new Date(fim.getTime() - dias * 86400000);
  return { inicio: iso(ini), fim: iso(fim) };
}

function fmtData(s) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }) + " UTC";
}

// ---------- rede ----------
async function buscar(tipo, { inicio, fim }) {
  const url = `${API}/${tipo}?startDate=${inicio}&endDate=${fim}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`${tipo}: HTTP ${r.status}`);
    const txt = await r.text();
    return txt.trim() ? JSON.parse(txt) : []; // API devolve corpo vazio quando não há eventos
  } finally {
    clearTimeout(t);
  }
}

async function carregar(faixa) {
  const resp = await Promise.all(TIPOS.map((t) => buscar(t, faixa)));
  return { SEP: resp[0], FLR: resp[1], GST: resp[2] };
}

// ---------- cache local ----------
function salvarCache(dados, faixa) {
  try {
    localStorage.setItem(CHAVE_CACHE, JSON.stringify({ dados, faixa, salvoEm: new Date().toISOString() }));
  } catch (_) { /* sem cache; segue */ }
}

function lerCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CHAVE_CACHE));
    return c && c.dados ? c : null;
  } catch (_) {
    return null;
  }
}

// ---------- renderização ----------
function el(tag, cls, texto) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (texto != null) e.textContent = texto;
  return e;
}

function link(href, texto) {
  const a = el("a", null, texto);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  return a;
}

function vazio(ul, msg) {
  ul.replaceChildren(el("li", "vazio", msg));
}

function selo(id, texto, nivel) {
  const s = $(id);
  s.textContent = texto;
  s.className = "selo" + (nivel ? " " + nivel : "");
}

function tipoLigado(id) {
  const m = /-(FLR|CME|SEP|GST|IPS|MPC|HSS|RBE)-/.exec(id || "");
  return m ? m[1] : "evento";
}

const porDataDesc = (campo) => (a, b) => new Date(b[campo]) - new Date(a[campo]);

function renderSEP(lista, janelaTxt) {
  const ul = $("lista-sep");
  if (!lista.length) {
    selo("selo-sep", "Calmo", "calmo");
    vazio(ul, `Nenhum evento de partículas solares ${janelaTxt}.`);
    return;
  }
  selo("selo-sep", `${lista.length} evento${lista.length > 1 ? "s" : ""}`, "atencao");
  ul.replaceChildren(...lista.sort(porDataDesc("eventTime")).map((e) => {
    const li = el("li");
    const l1 = el("div", "linha1");
    l1.append(el("strong", null, fmtData(e.eventTime)), link(e.link, "Ver alerta original"));
    li.append(l1);
    const inst = (e.instruments || []).map((i) => i.displayName).join(", ");
    if (inst) li.append(el("div", "meta", `Instrumento: ${inst}`));
    const lig = (e.linkedEvents || []).map((x) => tipoLigado(x.activityID));
    if (lig.length) li.append(el("div", "cadeia", `Ligado a: ${lig.join(" + ")} do mesmo período`));
    return li;
  }));
}

function nivelFlr(classe) {
  const c = (classe || "")[0];
  if (c === "X") return "forte";
  if (c === "M") return "atencao";
  return "";
}

function renderFLR(lista, janelaTxt) {
  const ul = $("lista-flr");
  if (!lista.length) {
    selo("selo-flr", "Calmo", "calmo");
    vazio(ul, `Nenhuma erupção solar ${janelaTxt}.`);
    return;
  }
  const ordenada = lista.sort(porDataDesc("peakTime"));
  const maior = ordenada.reduce((m, e) => {
    const ord = (c) => ({ X: 3, M: 2, C: 1, B: 0, A: 0 }[(c || "")[0]] ?? 0) * 1000 + parseFloat((c || "").slice(1) || 0);
    return ord(e.classType) > ord(m.classType) ? e : m;
  }, ordenada[0]);
  selo("selo-flr", `${lista.length} · máx ${maior.classType || "?"}`, nivelFlr(maior.classType) || "calmo");
  ul.replaceChildren(...ordenada.slice(0, 8).map((e) => {
    const li = el("li");
    const l1 = el("div", "linha1");
    l1.append(el("strong", null, `Classe ${e.classType || "?"}`), el("span", "meta", fmtData(e.peakTime)));
    li.append(l1);
    if (e.link) li.append(link(e.link, "Ver evento"));
    return li;
  }));
  if (ordenada.length > 8) {
    ul.append(el("li", "vazio", `+ ${ordenada.length - 8} erupções mais antigas`));
  }
}

function renderGST(lista, janelaTxt) {
  const ul = $("lista-gst");
  if (!lista.length) {
    selo("selo-gst", "Calmo", "calmo");
    vazio(ul, `Nenhuma tempestade geomagnética ${janelaTxt}.`);
    return;
  }
  const kpMax = (g) => Math.max(0, ...(g.allKpIndex || []).map((k) => k.kpIndex));
  const maior = Math.max(...lista.map(kpMax));
  selo("selo-gst", `${lista.length} · Kp máx ${maior}`, maior >= 7 ? "forte" : "atencao");
  ul.replaceChildren(...lista.sort(porDataDesc("startTime")).map((g) => {
    const li = el("li");
    const l1 = el("div", "linha1");
    l1.append(el("strong", null, `Kp ${kpMax(g)}`), el("span", "meta", fmtData(g.startTime)));
    li.append(l1);
    if (g.link) li.append(link(g.link, "Ver evento"));
    return li;
  }));
}

function status(msg, cls) {
  const s = $("status");
  s.textContent = msg;
  s.className = "status" + (cls ? " " + cls : "");
}

// ---------- resumo (cartão com ícones) ----------
const ORDEM_NIVEL = { calmo: 0, atencao: 1, forte: 2 };
const TEXTO_NIVEL = { calmo: "Calmo", atencao: "Atenção", forte: "Elevado" };

function indicador(id, valor, nivel) {
  const e = $(id);
  e.className = "ind" + (nivel ? " " + nivel : "");
  e.querySelector(".ind-valor").textContent = valor;
}

function resetResumo() {
  $("resumo").className = "resumo";
  $("resumo-nivel").textContent = "Sem dados";
  $("resumo-msg").textContent = "Não foi possível obter eventos do DONKI.";
  ["ind-sep", "ind-flr", "ind-gst", "ind-ult"].forEach((id) => indicador(id, "—", ""));
}

function renderResumo(dados) {
  const classeFlr = (c) => ({ X: 3, M: 2, C: 1 }[(c || "")[0]] ?? 0) * 1000 + parseFloat((c || "").slice(1) || 0);
  const kpMax = (g) => Math.max(0, ...(g.allKpIndex || []).map((k) => k.kpIndex));

  const nSep = dados.SEP.length;
  const maiorFlr = dados.FLR.reduce((m, e) => (!m || classeFlr(e.classType) > classeFlr(m.classType) ? e : m), null);
  const kp = dados.GST.length ? Math.max(...dados.GST.map(kpMax)) : null;

  const nSepNivel = nSep ? "atencao" : "calmo";
  const nFlrNivel = maiorFlr ? (nivelFlr(maiorFlr.classType) || "calmo") : "calmo";
  const nGstNivel = kp == null ? "calmo" : kp >= 7 ? "forte" : "atencao";

  indicador("ind-sep", nSep ? `${nSep} evento${nSep > 1 ? "s" : ""}` : "Nenhum", nSepNivel);
  indicador("ind-flr", maiorFlr ? maiorFlr.classType || "?" : "Nenhuma", nFlrNivel);
  indicador("ind-gst", kp == null ? "Nenhuma" : `Kp ${kp}`, nGstNivel);

  const datas = [
    ...dados.SEP.map((e) => e.eventTime),
    ...dados.FLR.map((e) => e.peakTime),
    ...dados.GST.map((e) => e.startTime),
  ].filter(Boolean).sort((a, b) => new Date(b) - new Date(a));
  indicador("ind-ult", datas.length ? new Date(datas[0]).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }) : "—", "");

  const nivel = [nSepNivel, nFlrNivel, nGstNivel].reduce((a, b) => (ORDEM_NIVEL[b] > ORDEM_NIVEL[a] ? b : a), "calmo");
  $("resumo").className = "resumo " + nivel;
  $("resumo-nivel").textContent = TEXTO_NIVEL[nivel];
  $("resumo-msg").textContent = nSep
    ? "Há evento de partículas solares na janela: o tipo mais ligado à radiação que chega à tripulação."
    : nivel === "calmo"
      ? "Sem partículas solares e sem eventos fortes na janela."
      : "Sem partículas solares, mas há atividade solar ou magnética na janela.";
}

function renderTudo(dados, janelaTxt) {
  renderResumo(dados);
  renderSEP(dados.SEP, janelaTxt);
  renderFLR(dados.FLR, janelaTxt);
  renderGST(dados.GST, janelaTxt);
}

// ---------- fluxo ----------
let historico = false;

async function atualizar() {
  const dias = Number($("janela").value);
  const faixa = historico ? HISTORICO : intervalo(dias);
  const janelaTxt = historico
    ? `entre ${HISTORICO.inicio} e ${HISTORICO.fim}`
    : `nos últimos ${dias} dias`;

  $("btn-atualizar").disabled = true;
  status("Consultando o DONKI…");

  try {
    const dados = await carregar(faixa);
    renderTudo(dados, janelaTxt);
    if (historico) {
      status(`Modo histórico: eventos passados (${HISTORICO.inicio} a ${HISTORICO.fim}), não são condições atuais.`, "hist");
    } else {
      salvarCache(dados, faixa);
      status(`Dados ao vivo do DONKI · consulta em ${new Date().toLocaleString("pt-BR")} · janela ${faixa.inicio} a ${faixa.fim}.`);
    }
  } catch (err) {
    const c = lerCache();
    if (c) {
      renderTudo(c.dados, `na cópia local (${c.faixa.inicio} a ${c.faixa.fim})`);
      status(`Sem conexão com o DONKI (${err.message}). Mostrando cópia local salva em ${new Date(c.salvoEm).toLocaleString("pt-BR")}.`, "cache");
    } else {
      status(`Não foi possível consultar o DONKI (${err.message}) e não há cópia local.`, "erro");
      resetResumo();
      TIPOS.forEach((t) => {
        selo("selo-" + t.toLowerCase(), "Sem dados", "");
        vazio($("lista-" + t.toLowerCase()), "Sem dados disponíveis.");
      });
    }
  } finally {
    $("btn-atualizar").disabled = false;
  }
}

$("btn-atualizar").addEventListener("click", atualizar);
$("janela").addEventListener("change", () => { if (!historico) atualizar(); });
$("btn-historico").addEventListener("click", () => {
  historico = !historico;
  const b = $("btn-historico");
  b.setAttribute("aria-pressed", String(historico));
  b.textContent = historico ? "Voltar ao tempo real" : "Modo histórico (SEP de 05/09/2026)";
  $("janela").disabled = historico;
  atualizar();
});

atualizar();
