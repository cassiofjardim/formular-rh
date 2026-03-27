// ============================================================
// CONFIGURAÇÃO
// ============================================================
const CONFIG = {
    DEV_MODE: true,
    GOOGLE_CLIENT_ID: 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com',
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxDyU5BYL1mS3tLEQpH6hXZDd5JL4TD9xobrzsWV0YzjbzoYQ3vFZFzsR85EUYkbKl_/exec',
    ALLOWED_DOMAIN: 'rigarr.com.br'
};

// ============================================================
// ESTADO
// ============================================================
let currentUser = null;
let cadastros = [];
let filteredCadastros = [];
let selectedIndex = -1;
let isEditMode = false;

// Mapeamento de colunas (ordem dos headers no Code.gs)
const COLUMNS = [
    'timestamp', 'empresa', 'enviadoPor', 'nomeCompleto', 'telefone', 'dataNascimento',
    'sexo', 'estadoCivil', 'nomePai', 'nomeMae', 'rg', 'cpf',
    'motorista', 'pis', 'emailColaborador', 'endereco', 'bairro',
    'cidadeEstado', 'escolaridade', 'contaItau', 'filhos',
    'documentoEtnia', 'valeTransporte', 'declaracao',
    'linkReservista', 'linkCasamento', 'linkCnh', 'linkPis',
    'linkResidencia', 'linkEscolaridade', 'linkCtps',
    'linkCarteira', 'linkFoto', 'linkFilhos', 'linkPasta',
    'status'
];

// Labels amigáveis
const LABELS = {
    timestamp: 'Data de Envio',
    empresa: 'Empresa',
    enviadoPor: 'Enviado Por',
    nomeCompleto: 'Nome',
    telefone: 'Telefone Celular',
    dataNascimento: 'Data de nascimento',
    sexo: 'Sexo',
    estadoCivil: 'Estado civil',
    nomePai: 'Nome do pai',
    nomeMae: 'Nome da mãe',
    rg: 'RG',
    cpf: 'CPF',
    motorista: 'Contratado como Motorista',
    pis: 'PIS',
    emailColaborador: 'Email',
    endereco: 'Endereço completo',
    bairro: 'Bairro',
    cidadeEstado: 'Cidade/Estado',
    escolaridade: 'Escolaridade',
    contaItau: 'Conta no Itaú',
    filhos: 'Possui filhos',
    documentoEtnia: 'Documento de etnia',
    valeTransporte: 'Formulário vale transporte',
    declaracao: 'Declaração de veracidade',
    linkReservista: 'Certificado de Reservista',
    linkCasamento: 'Certidão de Casamento',
    linkCnh: 'CNH',
    linkPis: 'Comprovante PIS',
    linkResidencia: 'Comprovante de Residência',
    linkEscolaridade: 'Comprovante de Escolaridade',
    linkCtps: 'CTPS Digital',
    linkCarteira: 'Carteira de Trabalho PDF',
    linkFoto: 'Foto 3x4',
    linkFilhos: 'Certidão de Nascimento dos filhos',
    linkPasta: 'Pasta de Documentos',
    status: 'Status'
};

// Campos de arquivo (editáveis com re-upload)
const FILE_FIELDS = [
    'linkReservista', 'linkCasamento', 'linkCnh', 'linkPis',
    'linkResidencia', 'linkEscolaridade', 'linkCtps',
    'linkCarteira', 'linkFoto', 'linkFilhos'
];

// linkPasta é só leitura (não faz re-upload)
const READONLY_FILE_FIELDS = ['linkPasta'];

// Campos de texto editáveis
const EDITABLE_FIELDS = [
    'nomeCompleto', 'telefone', 'dataNascimento', 'sexo', 'estadoCivil',
    'nomePai', 'nomeMae', 'rg', 'cpf', 'motorista', 'pis',
    'emailColaborador', 'endereco', 'bairro', 'cidadeEstado',
    'escolaridade', 'contaItau', 'filhos',
    'documentoEtnia', 'valeTransporte', 'declaracao'
];

// Mapeamento de campo de link para campo de arquivo original (para o Drive)
const FILE_FIELD_MAP = {
    linkReservista: 'certificadoReservista',
    linkCasamento: 'certidaoCasamento',
    linkCnh: 'cnhDocumento',
    linkPis: 'comprovantePis',
    linkResidencia: 'comprovanteResidencia',
    linkEscolaridade: 'comprovanteEscolaridade',
    linkCtps: 'ctpsDigital',
    linkCarteira: 'pdfCarteiraTrabalho',
    linkFoto: 'foto3x4',
    linkFilhos: 'certidaoFilhos'
};

// ============================================================
// LOGIN
// ============================================================
function devLogin() {
    currentUser = {
        name: 'RH Rigarr',
        email: 'rh@rigarr.com.br'
    };
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById('user-email').textContent = currentUser.email;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    loadCadastros();
}

function logout() {
    currentUser = null;
    location.reload();
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('open');
}

// ============================================================
// CARREGAR CADASTROS
// ============================================================
async function loadCadastros() {
    const loading = document.getElementById('loadingState');
    const empty = document.getElementById('emptyState');
    const content = document.getElementById('contentArea');

    loading.style.display = 'flex';
    empty.style.display = 'none';
    content.style.display = 'none';

    try {
        const response = await fetch(CONFIG.APPS_SCRIPT_URL + '?action=getCadastros');
        const result = await response.json();

        if (result.status === 'ok' && result.data && result.data.length > 0) {
            cadastros = result.data.map((row, index) => {
                const obj = { _row: index + 2 };
                COLUMNS.forEach((col, i) => {
                    obj[col] = row[i] || '';
                });
                return obj;
            });

            filteredCadastros = [...cadastros];
            renderCards();
            loading.style.display = 'none';
            content.style.display = 'flex';
        } else {
            loading.style.display = 'none';
            empty.style.display = 'flex';
        }
    } catch (error) {
        console.error('Erro ao carregar:', error);
        loading.style.display = 'none';
        empty.style.display = 'flex';
        empty.querySelector('p').textContent = 'Erro ao carregar dados: ' + error.message;
    }
}

// ============================================================
// RENDERIZAR CARDS
// ============================================================
function renderCards() {
    const grid = document.getElementById('cardsGrid');
    grid.innerHTML = '';

    if (filteredCadastros.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><p>Nenhum resultado encontrado.</p></div>';
        return;
    }

    filteredCadastros.forEach((cad, index) => {
        const isApproved = (cad.status || '').toLowerCase() === 'aprovado';
        const phone = (cad.telefone || '').replace(/\D/g, '');
        const dataNasc = formatDate(cad.dataNascimento);
        const empresaKey = (cad.empresa || '').toLowerCase();
        const empresaConfig = EMPRESAS[empresaKey];
        const barColor = empresaConfig ? empresaConfig.cores.primary : '#ccc';
        const badgeColor = empresaConfig ? empresaConfig.cores.accent : '#999';

        const card = document.createElement('div');
        card.className = 'card' + (index === selectedIndex ? ' active' : '');
        card.onclick = () => openDetail(index);

        card.innerHTML = `
            <div class="card-color-bar" style="background:${barColor};"></div>
            <div class="card-inner">
                <div class="card-header">
                    <div class="card-title">${escapeHtml(cad.nomeCompleto || 'Sem nome')}</div>
                </div>
                <div class="card-body">
                    <div class="card-body-item">
                        <span class="card-body-label">CPF</span>
                        <span class="card-body-value">${escapeHtml(cad.cpf || '-')}</span>
                    </div>
                    <div class="card-body-item">
                        <span class="card-body-label">Telefone</span>
                        <span class="card-body-value">${escapeHtml(cad.telefone || '-')}</span>
                    </div>
                    <div class="card-body-item">
                        <span class="card-body-label">Nascimento</span>
                        <span class="card-body-value">${dataNasc || '-'}</span>
                    </div>
                    <div class="card-body-item">
                        <span class="card-body-label">Bairro</span>
                        <span class="card-body-value">${escapeHtml(cad.bairro || '-')}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <a href="https://wa.me/55${phone}" target="_blank" class="card-whatsapp" onclick="event.stopPropagation();">WhatsApp</a>
                    <span class="card-empresa" style="background:${badgeColor};">${escapeHtml(cad.empresa || '')}</span>
                    ${isApproved
                        ? '<span class="card-status aprovado-badge">Aprovado</span>'
                        : '<span class="card-status pendente-badge">Pendente</span>'}
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

// ============================================================
// FILTRAR
// ============================================================
function filterCards() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const statusFilter = document.getElementById('filterStatus').value;
    const empresaFilter = document.getElementById('filterEmpresa').value;

    filteredCadastros = cadastros.filter(cad => {
        const matchSearch = !search ||
            (cad.nomeCompleto || '').toLowerCase().includes(search) ||
            (cad.cpf || '').includes(search) ||
            (cad.telefone || '').includes(search) ||
            (cad.emailColaborador || '').toLowerCase().includes(search);

        const status = (cad.status || '').toLowerCase();
        const matchStatus = !statusFilter ||
            (statusFilter === 'aprovado' && status === 'aprovado') ||
            (statusFilter === 'pendente' && status !== 'aprovado');

        const matchEmpresa = !empresaFilter ||
            (cad.empresa || '').toLowerCase() === empresaFilter.toLowerCase();

        return matchSearch && matchStatus && matchEmpresa;
    });

    selectedIndex = -1;
    closeDetail();
    renderCards();
}

// ============================================================
// ABRIR DETALHE
// ============================================================
function openDetail(index) {
    selectedIndex = index;
    isEditMode = false;
    const cad = filteredCadastros[index];
    if (!cad) return;

    const panel = document.getElementById('detailPanel');
    const body = document.getElementById('detailBody');

    document.getElementById('detailName').textContent = cad.nomeCompleto || 'Sem nome';
    updateEditButton();

    // Montar conteúdo
    let html = '';

    // Seção 1
    html += '<div class="detail-section-title">Dados do Colaborador</div>';
    const section1 = [
        'nomeCompleto', 'telefone', 'dataNascimento', 'sexo',
        'linkReservista', 'estadoCivil', 'linkCasamento',
        'nomePai', 'nomeMae', 'rg', 'cpf', 'motorista', 'linkCnh',
        'pis', 'linkPis', 'emailColaborador', 'endereco', 'bairro',
        'cidadeEstado', 'linkResidencia', 'escolaridade', 'linkEscolaridade',
        'contaItau', 'filhos', 'linkFilhos',
        'documentoEtnia', 'valeTransporte', 'declaracao'
    ];

    section1.forEach(key => {
        const value = cad[key];
        if (!value && !FILE_FIELDS.includes(key)) return;
        html += renderDetailField(key, value, cad);
    });

    // Seção 2
    html += '<div class="detail-section-title">Documentos do Colaborador</div>';
    const section2 = ['linkCtps', 'linkCarteira', 'linkFoto', 'linkPasta'];

    section2.forEach(key => {
        const value = cad[key];
        if (!value && !FILE_FIELDS.includes(key)) return;
        html += renderDetailField(key, value, cad);
    });

    body.innerHTML = html;

    // WhatsApp
    const phone = (cad.telefone || '').replace(/\D/g, '');
    document.getElementById('btnWhatsapp').href = 'https://wa.me/55' + phone;

    // Aprovar
    const btnAprovar = document.getElementById('btnAprovar');
    const isApproved = (cad.status || '').toLowerCase() === 'aprovado';
    if (isApproved) {
        btnAprovar.innerHTML = '&#9989; CADASTRO APROVADO';
        btnAprovar.classList.add('approved');
        btnAprovar.disabled = true;
    } else {
        btnAprovar.innerHTML = '&#9989; APROVAR CADASTRO';
        btnAprovar.classList.remove('approved');
        btnAprovar.disabled = false;
    }

    panel.style.display = 'flex';
    renderCards();
}

// ============================================================
// RENDERIZAR CAMPO NO DETALHE (visualização + edição inline)
// ============================================================
function renderDetailField(key, value, cad) {
    const label = LABELS[key] || key;
    const isFile = FILE_FIELDS.includes(key);
    const isReadonlyFile = READONLY_FILE_FIELDS.includes(key);

    // === CAMPO DE ARQUIVO ===
    if (isFile || isReadonlyFile) {
        let fileHtml = '';

        if (value) {
            if (value.includes('|')) {
                const links = value.split('|').map(l => l.trim()).filter(l => l);
                fileHtml = links.map((l, i) =>
                    `<a href="${escapeHtml(l)}" target="_blank" class="file-link-item">&#128196; Arquivo ${i + 1}</a>`
                ).join(' ');
            } else {
                fileHtml = `<a href="${escapeHtml(value)}" target="_blank" class="file-link-item">&#128196; Ver arquivo</a>`;
            }
        } else {
            fileHtml = '<span class="no-file">Nenhum arquivo enviado</span>';
        }

        // Botão de re-upload (não aparece para linkPasta)
        let uploadBtn = '';
        if (!isReadonlyFile) {
            uploadBtn = `
                <div class="file-reupload">
                    <label class="btn-reupload" for="reupload_${key}">
                        &#8635; ${value ? 'Substituir arquivo' : 'Enviar arquivo'}
                    </label>
                    <input type="file" id="reupload_${key}" class="reupload-input"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onchange="handleReupload('${key}', this)">
                    <span id="reupload_status_${key}" class="reupload-status"></span>
                </div>`;
        }

        return `<div class="detail-field" data-key="${key}">
            <div class="detail-label">${escapeHtml(label)}</div>
            <div class="detail-value detail-file">${fileHtml}</div>
            ${uploadBtn}
        </div>`;
    }

    // === CAMPO DE TEXTO ===
    const isEditable = EDITABLE_FIELDS.includes(key);
    let displayValue = value || '';
    if (key === 'dataNascimento') {
        displayValue = formatDate(value);
    }

    if (isEditable) {
        return `<div class="detail-field editable-field" data-key="${key}">
            <div class="detail-label">${escapeHtml(label)}</div>
            <div class="detail-value" id="display_${key}" onclick="startInlineEdit('${key}')">${escapeHtml(displayValue)}<span class="edit-hint"> &#9998;</span></div>
            <div class="inline-edit" id="edit_${key}" style="display:none;">
                <input type="text" id="input_${key}" value="${escapeHtml(value || '')}"
                    onkeydown="if(event.key==='Enter')saveInlineEdit('${key}'); if(event.key==='Escape')cancelInlineEdit('${key}');">
                <div class="inline-edit-actions">
                    <button class="btn-inline-save" onclick="saveInlineEdit('${key}')">&#10003;</button>
                    <button class="btn-inline-cancel" onclick="cancelInlineEdit('${key}')">&#10005;</button>
                </div>
            </div>
        </div>`;
    }

    // Campo somente leitura (timestamp, enviadoPor)
    return `<div class="detail-field">
        <div class="detail-label">${escapeHtml(label)}</div>
        <div class="detail-value">${escapeHtml(displayValue)}</div>
    </div>`;
}

// ============================================================
// EDIÇÃO INLINE DE TEXTO
// ============================================================
function startInlineEdit(key) {
    document.getElementById('display_' + key).style.display = 'none';
    document.getElementById('edit_' + key).style.display = 'flex';
    const input = document.getElementById('input_' + key);
    input.focus();
    input.select();
}

function cancelInlineEdit(key) {
    document.getElementById('display_' + key).style.display = '';
    document.getElementById('edit_' + key).style.display = 'none';
}

async function saveInlineEdit(key) {
    const cad = filteredCadastros[selectedIndex];
    if (!cad) return;

    const input = document.getElementById('input_' + key);
    const newValue = input.value;

    // Feedback visual
    input.disabled = true;

    try {
        const payload = {
            action: 'updateCadastro',
            row: cad._row,
            updates: { [key]: newValue }
        };

        await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        // Atualizar localmente
        cad[key] = newValue;
        const origIdx = cadastros.findIndex(c => c._row === cad._row);
        if (origIdx !== -1) cadastros[origIdx][key] = newValue;

        // Atualizar display
        let displayValue = newValue;
        if (key === 'dataNascimento') displayValue = formatDate(newValue);
        const displayEl = document.getElementById('display_' + key);
        displayEl.innerHTML = escapeHtml(displayValue) + '<span class="edit-hint"> &#9998;</span>';

        cancelInlineEdit(key);

        // Atualizar header se nome mudou
        if (key === 'nomeCompleto') {
            document.getElementById('detailName').textContent = newValue;
        }

        renderCards();

    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('Erro ao salvar: ' + error.message);
    } finally {
        input.disabled = false;
    }
}

// ============================================================
// RE-UPLOAD DE ARQUIVO
// ============================================================
async function handleReupload(fieldKey, inputEl) {
    if (!inputEl.files.length) return;

    const cad = filteredCadastros[selectedIndex];
    if (!cad) return;

    const file = inputEl.files[0];
    const statusEl = document.getElementById('reupload_status_' + fieldKey);
    statusEl.textContent = 'Enviando...';
    statusEl.className = 'reupload-status uploading';

    try {
        // Converter para base64
        const fileData = await fileToBase64(file);
        const originalFieldName = FILE_FIELD_MAP[fieldKey] || fieldKey;

        const payload = {
            action: 'reuploadFile',
            row: cad._row,
            fieldKey: fieldKey,
            originalFieldName: originalFieldName,
            nomeColaborador: cad.nomeCompleto || 'SemNome',
            file: fileData
        };

        // Enviar com cors para receber resposta
        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });

        let newUrl = '';
        try {
            const result = await response.json();
            if (result.fileUrl) newUrl = result.fileUrl;
        } catch (e) {
            // no-cors mode, não temos response
        }

        // Atualizar localmente
        if (newUrl) {
            cad[fieldKey] = newUrl;
            const origIdx = cadastros.findIndex(c => c._row === cad._row);
            if (origIdx !== -1) cadastros[origIdx][fieldKey] = newUrl;
        }

        statusEl.textContent = '&#10003; Enviado com sucesso!';
        statusEl.className = 'reupload-status success';

        // Reabrir detalhe após 1s para mostrar o novo link
        setTimeout(() => {
            openDetail(selectedIndex);
        }, 1000);

    } catch (error) {
        console.error('Erro no upload:', error);
        statusEl.textContent = 'Erro: ' + error.message;
        statusEl.className = 'reupload-status error';
    }

    // Limpar input
    inputEl.value = '';
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result.split(',')[1]
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================================
// BOTÃO EDIT (toggle modo edição — agora desnecessário, mas mantém visual)
// ============================================================
function editCadastro() {
    // Agora a edição é inline, clicando direto no campo
    // O botão Edit pode dar foco no primeiro campo editável
    const firstEditable = document.querySelector('.editable-field .detail-value');
    if (firstEditable) firstEditable.click();
}

function updateEditButton() {
    // Visual do botão Edit no header
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// ============================================================
// DETALHE - NAVEGAÇÃO
// ============================================================
function closeDetail() {
    document.getElementById('detailPanel').style.display = 'none';
    document.getElementById('detailPanel').classList.remove('fullscreen');
    selectedIndex = -1;
    renderCards();
}

function prevCadastro() {
    if (selectedIndex > 0) openDetail(selectedIndex - 1);
}

function nextCadastro() {
    if (selectedIndex < filteredCadastros.length - 1) openDetail(selectedIndex + 1);
}

function toggleFullscreen() {
    document.getElementById('detailPanel').classList.toggle('fullscreen');
}

// ============================================================
// APROVAR
// ============================================================
async function aprovarCadastro() {
    const cad = filteredCadastros[selectedIndex];
    if (!cad) return;
    if ((cad.status || '').toLowerCase() === 'aprovado') return;

    if (!confirm('Aprovar o cadastro de ' + (cad.nomeCompleto || 'este colaborador') + '?')) return;

    try {
        await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action: 'aprovarCadastro', row: cad._row })
        });

        cad.status = 'Aprovado';
        const origIdx = cadastros.findIndex(c => c._row === cad._row);
        if (origIdx !== -1) cadastros[origIdx].status = 'Aprovado';

        openDetail(selectedIndex);
        renderCards();
        alert('Cadastro aprovado!');
    } catch (error) {
        alert('Erro ao aprovar: ' + error.message);
    }
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';

    // Se for ISO (ex: 2026-01-15T00:00:00.000Z ou similar)
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
        try {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return day + '/' + month + '/' + year;
            }
        } catch (e) {}
    }

    // Se for yyyy-mm-dd
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return parts[2] + '/' + parts[1] + '/' + parts[0];
        }
    }

    // Se for objeto Date do Google Sheets (vem como string tipo "Sat Jan 01 1980...")
    if (typeof dateStr === 'string' && dateStr.match(/^\w{3}\s\w{3}/)) {
        try {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return day + '/' + month + '/' + year;
            }
        } catch (e) {}
    }

    return dateStr;
}

function extractFileName(url) {
    if (!url) return '';
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) return url;
    const parts = url.split('/');
    return parts[parts.length - 1] || url;
}
