"use strict";
/* ============================================================
   SECURE VAULT — lógica
   Terminal de archivos clasificados, pantalla completa, 1998.
   ============================================================ */

// ---------- Credenciales válidas (demo) ----------

const VALID_CREDENTIALS = {
    ADMIN: 'ULTRA1998',
    OPERATOR: 'ULTRA1998',
};

// ---------- Paletas ----------

const COLORS = {
    green: '#33ff77',
    greenDim: '#1f7a48',
    red: '#ff4d4d',
    amber: '#ffb347',
    paleMint: '#b9f5d0',
    brown: '#c97a2b',
    text: '#baffd1',
};

// ---------- Datos de archivos ----------
// Los datos ya NO se definen aquí. Se cargan desde data/files.json
// (ver loadFilesData() más abajo). Para agregar/editar archivos y
// gráficos, edita ese JSON — no hace falta tocar este script.
// Guía completa: data/README.md

let FILES = [];
let dataLoadError = null;

// ---------- Carga de datos (data/files.json) ----------

const DATA_URL = 'data/files.json';
const REQUIRED_FIELDS = ['id', 'filename', 'size', 'date', 'classification'];

// Convierte un color del JSON a un valor CSS válido.
// Acepta nombres de la paleta ("green", "amber", ...) o un hex directo ("#ff00ff").
function resolveColor(value) {
    if (typeof value !== 'string') return COLORS.green;
    if (value.startsWith('#')) return value;
    return COLORS[value] || COLORS.green;
}

function resolveChartColors(chart) {
    if (!chart) return chart;
    if (Array.isArray(chart.series)) {
        chart.series.forEach((s) => { s.color = resolveColor(s.color); });
    }
    if (Array.isArray(chart.slices)) {
        chart.slices.forEach((s) => { s.color = resolveColor(s.color); });
    }
    return chart;
}

// Valida mínimamente cada entrada para no romper toda la app por un solo
// archivo mal formado. Las entradas inválidas se descartan y se avisa en consola.
function validateAndNormalizeFiles(raw) {
    if (!Array.isArray(raw)) {
        throw new Error('data/files.json debe ser un array de archivos (usa [ ] en la raíz).');
    }
    const seenIds = new Set();
    const valid = [];
    raw.forEach((entry, i) => {
        const missing = REQUIRED_FIELDS.filter((f) => entry[f] === undefined || entry[f] === null || entry[f] === '');
        if (missing.length > 0) {
            console.warn(`[data/files.json] Entrada #${i} omitida: faltan los campos ${missing.join(', ')}.`, entry);
            return;
        }
        if (seenIds.has(entry.id)) {
            console.warn(`[data/files.json] Entrada #${i} omitida: el id "${entry.id}" está repetido.`);
            return;
        }
        if (entry.chart && !CHART_RENDERERS[entry.chart.kind]) {
            console.warn(`[data/files.json] "${entry.id}": tipo de gráfico "${entry.chart && entry.chart.kind}" desconocido. Se mostrará como texto sin gráfico.`);
            entry.chart = null;
        }
        seenIds.add(entry.id);
        valid.push({
            requiresFloppy: false,
            chart: null,
            paragraphs: [],
            ...entry,
            chart: resolveChartColors(entry.chart),
        });
    });
    return valid;
}

async function loadFilesData() {
    try {
        const res = await fetch(DATA_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status} al pedir ${DATA_URL}`);
        const raw = await res.json();
        FILES = validateAndNormalizeFiles(raw);
    } catch (err) {
        console.error('No se pudo cargar data/files.json:', err);
        dataLoadError = err;
        FILES = [];
    }
}

// ---------- Estado ----------

const insertedFloppies = new Set();
let currentUser = '';
let selectedIndex = 0;
let sessionStartTime = null;
let activeDocId = null;
let resizeHandler = null;

// ---------- Utilidades DOM ----------

function $(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error('No se encontró el elemento #' + id);
    return el;
}

function showView(id) {
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('view-active'));
    $(id).classList.add('view-active');
}

function pad2(n) { return String(n).padStart(2, '0'); }

function formatSize(bytes) {
    return bytes.toLocaleString('en-US');
}

function classCode(classification) {
    if (classification === 'TOP SECRET') return 'cls-top';
    if (classification === 'SECRET') return 'cls-secret';
    return 'cls-conf';
}

// ---------- Secuencia de arranque ----------

const BOOT_LINES = [
    'VAULT-OS KERNEL v3.11 ................ LOADED',
    'ENLACE CIFRADO CON ARCHIVO CENTRAL ... ESTABLECIDO',
    'VERIFICANDO INTEGRIDAD DE INDICE ..... OK',
    '',
    'SECURE VAULT — CLASSIFIED FILE SYSTEM',
    'ACCESO RESTRINGIDO AL PERSONAL AUTORIZADO',
    '',
    'Iniciando protocolo de acceso_',
];

function runBootSequence(onDone) {
    const log = $('boot-log');
    let lineIndex = 0;
    let charIndex = 0;
    log.textContent = '';

    function typeNextChar() {
        if (lineIndex >= BOOT_LINES.length) {
            window.setTimeout(onDone, 400);
            return;
        }
        const line = BOOT_LINES[lineIndex];
        if (charIndex <= line.length) {
            const soFar = BOOT_LINES.slice(0, lineIndex).join('\n');
            log.textContent = (soFar ? soFar + '\n' : '') + line.slice(0, charIndex);
            charIndex++;
            window.setTimeout(typeNextChar, line.length === 0 ? 70 : 10);
        } else {
            lineIndex++;
            charIndex = 0;
            window.setTimeout(typeNextChar, 70);
        }
    }
    typeNextChar();
}

// ---------- Login ----------

function setupLogin() {
    const form = $('login-form');
    const errorEl = $('login-error');

    form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const user = $('user-input').value.trim().toUpperCase();
        const pass = $('pass-input').value;

        if (VALID_CREDENTIALS[user] && VALID_CREDENTIALS[user] === pass) {
            currentUser = user;
            errorEl.textContent = '';
            enterIndex();
        } else {
            errorEl.textContent = 'ACCESO DENEGADO — CREDENCIALES NO VALIDAS. INTENTO REGISTRADO.';
        }
    });
}

function enterIndex() {
    $('session-user').textContent = currentUser;
    sessionStartTime = Date.now();
    showView('view-index');
    renderFileTable();
    tickClock();
    tickSession();
    window.setInterval(tickClock, 1000);
    window.setInterval(tickSession, 1000);
    document.addEventListener('keydown', handleGlobalKeydown);
}

function renderDataError(err) {
    const body = $('file-table-body');
    body.innerHTML = `
    <tr><td colspan="5" class="data-error">
      ⚠ ERROR AL LEER data/files.json — ${(err && err.message) || 'error desconocido'}<br/>
      Revisa que el archivo tenga JSON válido (sin comas finales, comillas correctas).
      Si abriste index.html con doble clic, usa un servidor local
      (por ejemplo <code>python3 -m http.server</code>) en vez de file://.
    </td></tr>`;
}

function tickClock() {
    const now = new Date();
    $('clock').textContent = `1998-09-14 ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
}

function tickSession() {
    if (!sessionStartTime) return;
    const secs = Math.floor((Date.now() - sessionStartTime) / 1000);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    $('session-timer').textContent = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

// ---------- Tabla de índice ----------

function renderFileTable() {
    if (dataLoadError) {
        renderDataError(dataLoadError);
        return;
    }
    const body = $('file-table-body');
    body.innerHTML = '';
    if (FILES.length === 0) {
        body.innerHTML = '<tr><td colspan="5" class="data-error">SIN ARCHIVOS — data/files.json está vacío ([]).</td></tr>';
        return;
    }
    FILES.forEach((file, i) => {
        const tr = document.createElement('tr');
        tr.className = 'file-row' + (i === selectedIndex ? ' selected' : '');
        tr.dataset.index = String(i);

        const chartTag = file.chart ? `<span class="tag-chart">[${file.chart.kind.toUpperCase()}]</span>` : '';
        const floppyIcon = file.requiresFloppy ? '<span class="tag-icon">⊞</span>' : '';

        tr.innerHTML = `
      <td class="col-id">${file.id}</td>
      <td class="col-name">${floppyIcon}${chartTag}<span class="fname-text">${file.filename}</span></td>
      <td class="col-size">${formatSize(file.size)}</td>
      <td class="col-date">${file.date}</td>
      <td class="col-class"><span class="${classCode(file.classification)}">${file.classification}</span></td>
    `;
        tr.addEventListener('click', () => {
            selectedIndex = i;
            renderFileTable();
            openFile(file.id);
        });
        body.appendChild(tr);
    });

    const selectedRow = body.querySelector('.file-row.selected');
    if (selectedRow) selectedRow.scrollIntoView({ block: 'nearest' });
}

function handleGlobalKeydown(ev) {
    const inDoc = $('view-doc').classList.contains('view-active');

    if (inDoc) {
        if (ev.key === 'Escape') {
            closeDocument();
        }
        return;
    }

    const inIndex = $('view-index').classList.contains('view-active');
    if (!inIndex) return;

    if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, FILES.length - 1);
        renderFileTable();
    } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        renderFileTable();
    } else if (ev.key === 'Enter') {
        ev.preventDefault();
        openFile(FILES[selectedIndex].id);
    } else if (ev.key === 'F10') {
        ev.preventDefault();
        logOut();
    }
}

function logOut() {
    document.removeEventListener('keydown', handleGlobalKeydown);
    sessionStartTime = null;
    currentUser = '';
    $('user-input').value = '';
    $('pass-input').value = '';
    $('login-error').textContent = '';
    showView('view-login');
    $('user-input').focus();
}

// ---------- Documento / gráfico ----------

function openFile(id) {
    activeDocId = id;
    const file = FILES.find((f) => f.id === id);
    if (!file) return;

    $('doc-title').textContent = `${file.id} · ${file.filename}`;
    const badge = $('doc-badge');
    badge.textContent = file.classification;
    badge.className = 'doc-badge ' + classCode(file.classification);
    $('doc-sub').textContent = file.chart ? file.chart.subtitle : `TAMAÑO: ${formatSize(file.size)} bytes · FECHA: ${file.date}`;
    $('doc-hint').textContent = file.requiresFloppy && !insertedFloppies.has(file.id) ? 'UNIDAD A: EN ESPERA' : '';

    renderDocContent(file);
    showView('view-doc');
}

function closeDocument() {
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }
    activeDocId = null;
    showView('view-index');
}

function renderDocContent(file) {
    const container = $('doc-content');
    container.innerHTML = '';
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }

    const needsFloppy = file.requiresFloppy && !insertedFloppies.has(file.id);

    if (needsFloppy) {
        container.innerHTML = floppyPromptHTML(file.id);
        $(`floppy-btn-${file.id}`).addEventListener('click', () => insertFloppy(file.id));
        return;
    }

    if (file.chart) {
        renderChartBlock(container, file.chart);
        return;
    }

    const textWrap = document.createElement('div');
    textWrap.className = 'doc-text';
    textWrap.innerHTML = file.paragraphs.map((p) => `<p>${p}</p>`).join('');
    container.appendChild(textWrap);
}

function floppyPromptHTML(fileId) {
    return `
    <div class="floppy-prompt">
      <p>◇ ARCHIVO INCOMPLETO — PARTE DEL CONTENIDO RESIDE EN SOPORTE EXTRAIBLE.</p>
      <p>INSERTE EL DISQUETE ROTULADO "${fileId}" EN LA UNIDAD A: PARA CONTINUAR.</p>
      <button type="button" class="floppy-btn" id="floppy-btn-${fileId}">▣ INSERTAR DISQUETE</button>
      <div class="floppy-progress" id="floppy-progress-${fileId}"></div>
    </div>
  `;
}

function insertFloppy(fileId) {
    const btn = $(`floppy-btn-${fileId}`);
    const progress = $(`floppy-progress-${fileId}`);
    btn.disabled = true;
    btn.textContent = '▣ LEYENDO...';

    const steps = ['[■□□□□□□□□□] 10%', '[■■■□□□□□□□] 30%', '[■■■■■□□□□□] 50%',
        '[■■■■■■■□□□] 70%', '[■■■■■■■■■□] 90%', '[■■■■■■■■■■] 100%'];
    let i = 0;
    const interval = window.setInterval(() => {
        progress.textContent = steps[i];
        i++;
        if (i >= steps.length) {
            window.clearInterval(interval);
            window.setTimeout(() => {
                insertedFloppies.add(fileId);
                $('doc-hint').textContent = '';
                const file = FILES.find((f) => f.id === fileId);
                renderDocContent(file);
                renderFileTable();
            }, 300);
        }
    }, 250);
}

// ---------- Gráficos ----------
//
// Registro de tipos de gráfico soportados. Para agregar un tipo nuevo
// (por ejemplo "area" o "radar") en el futuro:
//   1. Escribe una función drawTuGrafico(ctx, width, height, chart)
//      que dibuje sobre el canvas usando chart.labels/series o chart.slices.
//   2. Agrégala aquí abajo con la clave que usarás en el JSON, p.ej.:
//        area: drawAreaChart,
//   3. En data/files.json usa "kind": "area" en el objeto chart.
// No hace falta tocar ninguna otra parte del código.

const CHART_RENDERERS = {
    bar: drawGroupedBarChart,
    line: drawMultiLineChart,
    pie: drawPieChart,
};

function renderChartBlock(container, chart) {
    const wrap = document.createElement('div');
    wrap.className = 'chart-wrap';

    const canvas = document.createElement('canvas');
    canvas.className = 'chart-canvas-el';
    wrap.appendChild(canvas);

    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    const legendItems = chart.kind === 'pie' ? chart.slices : chart.series;
    legendItems.forEach((item) => {
        const el = document.createElement('span');
        el.className = 'chart-legend-item';
        const shape = chart.kind === 'bar' ? 'legend-sq' : 'legend-dot';
        el.innerHTML = `<span class="${shape}" style="background:${item.color}"></span>${item.name || item.label}`;
        legend.appendChild(el);
    });
    wrap.appendChild(legend);

    container.appendChild(wrap);

    function draw() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);

        const renderer = CHART_RENDERERS[chart.kind];
        if (renderer) {
            renderer(ctx, rect.width, rect.height, chart);
        } else {
            ctx.fillStyle = COLORS.red;
            ctx.font = '12px "JetBrains Mono", monospace';
            ctx.fillText(`TIPO DE GRAFICO NO SOPORTADO: "${chart.kind}"`, 12, 24);
        }
    }

    window.requestAnimationFrame(draw);
    resizeHandler = () => window.requestAnimationFrame(draw);
    window.addEventListener('resize', resizeHandler);
}

function drawAxes(ctx, pad, w, h, yMax, yStep) {
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = COLORS.greenDim;
    ctx.strokeStyle = 'rgba(31,122,72,0.5)';
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 1;

    const steps = yMax / yStep;
    for (let i = 0; i <= steps; i++) {
        const y = pad.top + h - (h / steps) * i;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + w, y);
        ctx.stroke();
        ctx.fillText(String(Math.round(yStep * i)), 4, y + 4);
    }
    ctx.setLineDash([]);

    ctx.strokeStyle = COLORS.greenDim;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + h);
    ctx.lineTo(pad.left + w, pad.top + h);
    ctx.stroke();
}

function drawGroupedBarChart(ctx, cw, ch, chart) {
    const pad = { top: 16, right: 20, bottom: 30, left: 44 };
    const w = cw - pad.left - pad.right;
    const h = ch - pad.top - pad.bottom;

    drawAxes(ctx, pad, w, h, chart.yMax, chart.yStep);

    const n = chart.labels.length;
    const groupSlot = w / n;
    const seriesCount = chart.series.length;
    const barGap = 4;
    const barW = (groupSlot * 0.68) / seriesCount;

    chart.labels.forEach((label, gi) => {
        const groupX = pad.left + groupSlot * gi + groupSlot * 0.16;
        chart.series.forEach((s, si) => {
            const val = s.values[gi];
            const barH = (val / chart.yMax) * h;
            const x = groupX + si * (barW + barGap);
            const y = pad.top + h - barH;

            ctx.fillStyle = s.color;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 6;
            ctx.fillRect(x, y, barW, barH);
            ctx.shadowBlur = 0;
        });

        ctx.fillStyle = COLORS.green;
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, groupX + (groupSlot * 0.68) / 2, pad.top + h + 18);
    });
    ctx.textAlign = 'left';
}

function drawMultiLineChart(ctx, cw, ch, chart) {
    const pad = { top: 16, right: 20, bottom: 30, left: 40 };
    const w = cw - pad.left - pad.right;
    const h = ch - pad.top - pad.bottom;
    const n = chart.labels.length;

    drawAxes(ctx, pad, w, h, chart.yMax, chart.yStep);

    chart.series.forEach((s) => {
        const points = s.values.map((val, i) => ({
            x: pad.left + (w / (n - 1)) * i,
            y: pad.top + h - (val / chart.yMax) * h,
        }));

        ctx.beginPath();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 7;
        points.forEach((p, i) => {
            if (i === 0) { ctx.moveTo(p.x, p.y); return; }
            const prev = points[i - 1];
            const cx = (prev.x + p.x) / 2;
            ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        points.forEach((p) => {
            ctx.beginPath();
            ctx.fillStyle = s.color;
            ctx.shadowColor = s.color;
            ctx.shadowBlur = 6;
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    });

    ctx.fillStyle = COLORS.greenDim;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    chart.labels.forEach((label, i) => {
        if (n > 12 && i % 2 !== 0) return;
        const x = pad.left + (w / (n - 1)) * i;
        ctx.fillText(label, x, pad.top + h + 16);
    });
    ctx.textAlign = 'left';
}

function drawPieChart(ctx, cw, ch, chart) {
    const cx = cw / 2;
    const cy = ch / 2;
    const r = Math.max(10, Math.min(cw, ch) / 2 - 24);
    const total = chart.slices.reduce((a, s) => a + s.value, 0);

    ctx.save();
    ctx.shadowColor = COLORS.green;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(51,255,119,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    let startAngle = -Math.PI / 2;
    chart.slices.forEach((slice) => {
        const angle = (slice.value / total) * Math.PI * 2;
        const endAngle = startAngle + angle;
        const midAngle = startAngle + angle / 2;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = slice.color;
        ctx.fill();

        ctx.strokeStyle = '#03110a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.closePath();
        ctx.stroke();

        const labelR = r * 0.62;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;
        ctx.fillStyle = '#03110a';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${slice.value}%`, lx, ly);

        startAngle = endAngle;
    });
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
}

// ---------- Arranque de la aplicación ----------

window.addEventListener('DOMContentLoaded', () => {
    const dataPromise = loadFilesData();
    setupLogin();
    runBootSequence(async () => {
        await dataPromise; // asegura que data/files.json ya esté leído
        showView('view-login');
        $('user-input').focus();
    });
});