// ============================================================
// CONFIGURAÇÃO
// ============================================================
const CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzYDlw_Ta2yXWZMRF17yX4NYiGU4w39oJIMjAjrZEM-GQ4ZLP9kn59ypHsox5rO1qt0/exec'
};

// ============================================================
// LOGIN SIMPLES
// ============================================================
let usuarioNome = '';
let usuarioEmail = '';
let draftRow = null; // Linha do rascunho na planilha
let autoSaveTimer = null;

function entrarFormulario() {
    const nome = document.getElementById('loginNome').value.trim();
    const email = document.getElementById('loginEmail').value.trim();
    const errorEl = document.getElementById('login-error');

    if (!nome) {
        errorEl.textContent = 'Por favor, digite seu nome completo.';
        errorEl.style.display = 'block';
        return;
    }

    if (!email || !email.includes('@')) {
        errorEl.textContent = 'Por favor, digite um e-mail válido.';
        errorEl.style.display = 'block';
        return;
    }

    errorEl.style.display = 'none';
    usuarioNome = nome;
    usuarioEmail = email;

    // Pré-preencher campos do formulário
    const nomeInput = document.getElementById('nomeCompleto');
    const emailInput = document.getElementById('emailColaborador');
    if (nomeInput && !nomeInput.value) nomeInput.value = nome;
    if (emailInput && !emailInput.value) emailInput.value = email;

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    // Salvar rascunho inicial na planilha
    salvarRascunho();

    // Auto-save a cada 30 segundos
    autoSaveTimer = setInterval(salvarRascunho, 30000);
}

// Salvar/atualizar rascunho com dados preenchidos até agora
async function salvarRascunho() {
    try {
        const empresa = (typeof detectarEmpresa === 'function') ? detectarEmpresa() : { nome: 'Rigarr' };
        const dados = {
            action: 'saveDraft',
            draftRow: draftRow,
            formData: {
                timestamp: new Date().toLocaleString('pt-BR'),
                empresa: empresa.nome,
                enviadoPor: usuarioEmail || '',
                nomeCompleto: val('nomeCompleto'),
                telefone: val('telefone'),
                dataNascimento: val('dataNascimento'),
                sexo: val('sexo'),
                estadoCivil: val('estadoCivil'),
                nomePai: val('nomePai'),
                nomeMae: val('nomeMae'),
                rg: val('rg'),
                cpf: val('cpf'),
                motorista: val('motorista'),
                pis: val('pis'),
                emailColaborador: val('emailColaborador'),
                endereco: val('endereco'),
                bairro: val('bairro'),
                cidadeEstado: val('cidadeEstado'),
                escolaridade: val('escolaridade'),
                contaItau: val('contaItau'),
                filhos: val('filhos'),
                documentoEtnia: val('documentoEtnia'),
                valeTransporte: val('valeTransporte'),
                declaracao: val('declaracao')
            }
        };

        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(dados)
        });

        try {
            const result = await response.json();
            if (result.row) draftRow = result.row;
        } catch (e) { /* silencioso */ }
    } catch (e) {
        console.log('Auto-save erro (silencioso):', e);
    }
}

// ============================================================
// BOTÕES DE OPÇÃO (radio buttons customizados)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Modo preview: pular login quando carregado dentro do dashboard
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === 'true') {
        const loginEl = document.getElementById('login-screen');
        const appEl = document.getElementById('app');
        if (loginEl) loginEl.style.display = 'none';
        if (appEl) {
            appEl.style.display = 'block';
            appEl.style.minHeight = '100%';
        }
        usuarioNome = 'RH Rigarr';
        usuarioEmail = 'rh@rigarr.com.br';
        // Aplicar tema padrão
        if (typeof detectarEmpresa === 'function' && typeof aplicarTemaEmpresa === 'function') {
            const empresa = detectarEmpresa();
            aplicarTemaEmpresa(empresa);
        }
    }
    // Botões de opção
    document.querySelectorAll('.btn-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const field = btn.dataset.field;
            const value = btn.dataset.value;

            // Desmarcar irmãos
            btn.parentElement.querySelectorAll('.btn-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            // Atualizar input hidden
            const hiddenInput = document.getElementById(field);
            if (hiddenInput) {
                hiddenInput.value = value;
                hiddenInput.classList.remove('error');
            }

            // Lógica condicional
            handleConditionalFields(field, value);
        });
    });

    // Drag & drop nos uploads
    document.querySelectorAll('.file-upload').forEach(zone => {
        const input = zone.querySelector('input[type="file"]');

        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                input.files = e.dataTransfer.files;
                input.dispatchEvent(new Event('change'));
            }
        });

        input.addEventListener('change', () => {
            const nameEl = zone.querySelector('.file-name');
            if (input.files.length > 0) {
                const names = Array.from(input.files).map(f => f.name).join(', ');
                nameEl.textContent = names;
                zone.classList.add('has-file');
                zone.classList.remove('error');
            } else {
                nameEl.textContent = '';
                zone.classList.remove('has-file');
            }
        });
    });

    // Máscara de telefone
    const telInput = document.getElementById('telefone');
    if (telInput) {
        telInput.addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length > 6) {
                v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
            } else if (v.length > 2) {
                v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
            } else if (v.length > 0) {
                v = `(${v}`;
            }
            e.target.value = v;
        });
    }

    // Máscara de CPF
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length > 9) {
                v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
            } else if (v.length > 6) {
                v = `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
            } else if (v.length > 3) {
                v = `${v.slice(0, 3)}.${v.slice(3)}`;
            }
            e.target.value = v;
        });
    }

    // Submit do formulário
    const form = document.getElementById('formAdmissional');
    form.addEventListener('submit', handleSubmit);
});

// ============================================================
// CAMPOS CONDICIONAIS
// ============================================================
function handleConditionalFields(field, value) {
    // Sexo → Certificado de Reservista
    if (field === 'sexo') {
        const reservistaGroup = document.getElementById('reservistaGroup');
        if (value === 'Masculino') {
            reservistaGroup.style.display = '';
            reservistaGroup.classList.add('show');
        } else {
            reservistaGroup.style.display = 'none';
            reservistaGroup.classList.remove('show');
            clearFileInput('certificadoReservista', 'fileNameReservista', 'dropReservista');
        }
    }

    // Estado Civil → Certidão de Casamento
    if (field === 'estadoCivil') {
        const casamentoGroup = document.getElementById('casamentoGroup');
        if (value === 'Casado(a)' || value === 'União estável') {
            casamentoGroup.style.display = '';
            casamentoGroup.classList.add('show');
        } else {
            casamentoGroup.style.display = 'none';
            casamentoGroup.classList.remove('show');
            clearFileInput('certidaoCasamento', 'fileNameCasamento', 'dropCasamento');
        }
    }

    // Motorista → CNH
    if (field === 'motorista') {
        const cnhGroup = document.getElementById('cnhGroup');
        if (value === 'Sim') {
            cnhGroup.style.display = '';
            cnhGroup.classList.add('show');
        } else {
            cnhGroup.style.display = 'none';
            cnhGroup.classList.remove('show');
            clearFileInput('cnhDocumento', 'fileNameCnh', 'dropCnh');
        }
    }

    // Escolaridade → Comprovante de Escolaridade
    if (field === 'escolaridade') {
        const escolaridadeDocGroup = document.getElementById('grupoComprovanteEscolaridade');
        if (value) {
            escolaridadeDocGroup.style.display = '';
            escolaridadeDocGroup.classList.add('show');
        }
    }

    // Filhos → Certidão de Nascimento
    if (field === 'filhos') {
        const filhosDocGroup = document.getElementById('filhosDocGroup');
        if (value === 'Sim') {
            filhosDocGroup.style.display = '';
            filhosDocGroup.classList.add('show');
        } else {
            filhosDocGroup.style.display = 'none';
            filhosDocGroup.classList.remove('show');
            clearFileInput('certidaoFilhos', 'fileNameFilhos', 'dropFilhos');
        }
    }
}

function clearFileInput(inputId, nameId, zoneId) {
    const input = document.getElementById(inputId);
    const nameEl = document.getElementById(nameId);
    const zone = document.getElementById(zoneId);
    if (input) input.value = '';
    if (nameEl) nameEl.textContent = '';
    if (zone) zone.classList.remove('has-file');
}

// ============================================================
// VALIDAÇÃO
// ============================================================
function validateForm() {
    let isValid = true;
    const form = document.getElementById('formAdmissional');

    // Limpar erros anteriores
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    // Campos de texto/select obrigatórios
    const requiredInputs = form.querySelectorAll('input[required]:not([type="hidden"]):not([type="file"]), select[required]');
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        }
    });

    // Campos hidden (botões de opção) obrigatórios
    const requiredHidden = form.querySelectorAll('input[type="hidden"][required]');
    requiredHidden.forEach(input => {
        if (!input.value) {
            const btnGroup = input.previousElementSibling;
            if (btnGroup) btnGroup.classList.add('error');
            isValid = false;
        }
    });

    // Arquivos obrigatórios (que estão visíveis)
    const requiredFiles = form.querySelectorAll('input[type="file"][required]');
    requiredFiles.forEach(input => {
        if (!input.files.length) {
            const zone = input.closest('.file-upload');
            if (zone) zone.classList.add('error');
            isValid = false;
        }
    });

    // Arquivos condicionais que estão visíveis
    // Reservista (masculino)
    if (document.getElementById('sexo').value === 'Masculino') {
        const reservista = document.getElementById('certificadoReservista');
        if (!reservista.files.length) {
            document.getElementById('dropReservista').classList.add('error');
            isValid = false;
        }
    }

    // Certidão de casamento
    const ec = document.getElementById('estadoCivil').value;
    if (ec === 'Casado(a)' || ec === 'União estável') {
        const certidao = document.getElementById('certidaoCasamento');
        if (!certidao.files.length) {
            document.getElementById('dropCasamento').classList.add('error');
            isValid = false;
        }
    }

    // CNH (motorista)
    if (document.getElementById('motorista').value === 'Sim') {
        const cnh = document.getElementById('cnhDocumento');
        if (!cnh.files.length) {
            document.getElementById('dropCnh').classList.add('error');
            isValid = false;
        }
    }

    // Certidão filhos
    if (document.getElementById('filhos').value === 'Sim') {
        const filhos = document.getElementById('certidaoFilhos');
        if (!filhos.files.length) {
            document.getElementById('dropFilhos').classList.add('error');
            isValid = false;
        }
    }

    // Declaração deve ser "Sim"
    if (document.getElementById('declaracao').value !== 'Sim') {
        const btnGroup = document.getElementById('declaracaoGroup');
        if (btnGroup) btnGroup.classList.add('error');
        isValid = false;
    }

    if (!isValid) {
        // Scroll para o primeiro erro
        const firstError = form.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return isValid;
}

// ============================================================
// CONVERSÃO DE ARQUIVO PARA BASE64
// ============================================================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================================
// ENVIO DO FORMULÁRIO
// ============================================================
async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const btn = document.getElementById('btnSubmit');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    // Mostrar overlay de loading
    showLoading('Preparando documentos...');

    try {
        // Detectar empresa
        const empresa = (typeof detectarEmpresa === 'function') ? detectarEmpresa() : { nome: 'Rigarr1' };

        // Coletar dados de texto
        const formData = {
            timestamp: new Date().toLocaleString('pt-BR'),
            empresa: empresa.nome,
            enviadoPor: usuarioEmail || 'Formulário Web',
            nomeCompleto: val('nomeCompleto'),
            telefone: val('telefone'),
            dataNascimento: val('dataNascimento'),
            sexo: val('sexo'),
            estadoCivil: val('estadoCivil'),
            nomePai: val('nomePai'),
            nomeMae: val('nomeMae'),
            rg: val('rg'),
            cpf: val('cpf'),
            motorista: val('motorista'),
            pis: val('pis'),
            emailColaborador: val('emailColaborador'),
            endereco: val('endereco'),
            bairro: val('bairro'),
            cidadeEstado: val('cidadeEstado'),
            escolaridade: val('escolaridade'),
            contaItau: val('contaItau'),
            filhos: val('filhos'),
            documentoEtnia: val('documentoEtnia'),
            valeTransporte: val('valeTransporte'),
            declaracao: val('declaracao')
        };

        // Coletar arquivos como base64
        const files = {};

        const fileFields = [
            'certificadoReservista',
            'certidaoCasamento',
            'cnhDocumento',
            'comprovantePis',
            'comprovanteResidencia',
            'comprovanteEscolaridade',
            'ctpsDigital',
            'pdfCarteiraTrabalho',
            'foto3x4',
            'certidaoFilhos'
        ];

        // Converter todos os arquivos em paralelo (muito mais rápido)
        const filePromises = [];
        for (const fieldId of fileFields) {
            const input = document.getElementById(fieldId);
            if (input && input.files.length > 0) {
                if (input.multiple) {
                    filePromises.push(
                        Promise.all(Array.from(input.files).map(f => fileToBase64(f)))
                            .then(results => { files[fieldId] = results; })
                    );
                } else {
                    filePromises.push(
                        fileToBase64(input.files[0]).then(result => { files[fieldId] = result; })
                    );
                }
            }
        }
        await Promise.all(filePromises);

        // Atualizar loading
        updateLoading('Enviando para o servidor...');

        // Enviar para o Google Apps Script
        // Parar auto-save
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
            autoSaveTimer = null;
        }

        const payload = {
            formData: formData,
            files: files,
            nomeColaborador: formData.nomeCompleto,
            draftRow: draftRow
        };

        const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify(payload)
        });

        // Com no-cors, não temos acesso ao response body, então assumimos sucesso
        // Se quiser resposta, use mode: 'cors' e configure CORS no Apps Script
        hideLoading();

        // Mostrar mensagem de sucesso
        document.getElementById('formAdmissional').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
        document.querySelector('.form-header').style.display = 'none';

        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        hideLoading();
        console.error('Erro ao enviar:', error);
        alert('Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.\n\nDetalhes: ' + error.message);
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

// ============================================================
// LOADING OVERLAY
// ============================================================
function showLoading(message) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
        <div class="overlay-content">
            <div class="spinner-lg"></div>
            <p>${message || 'Processando...'}</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

function updateLoading(message) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        const p = overlay.querySelector('p');
        if (p) p.textContent = message;
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.remove();
}

// ============================================================
// RESET FORM
// ============================================================
function resetForm() {
    document.getElementById('formAdmissional').reset();
    document.getElementById('formAdmissional').style.display = '';
    document.getElementById('successMessage').style.display = 'none';
    document.querySelector('.form-header').style.display = '';

    // Limpar seleções de botões
    document.querySelectorAll('.btn-option.selected').forEach(b => b.classList.remove('selected'));

    // Limpar inputs hidden
    document.querySelectorAll('input[type="hidden"]').forEach(i => i.value = '');

    // Esconder campos condicionais
    document.querySelectorAll('.conditional').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('show');
    });

    // Limpar nomes de arquivos
    document.querySelectorAll('.file-name').forEach(el => el.textContent = '');
    document.querySelectorAll('.file-upload').forEach(el => el.classList.remove('has-file'));

    window.scrollTo({ top: 0, behavior: 'smooth' });
}
