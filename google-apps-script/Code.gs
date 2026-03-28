// ============================================================
// CONFIGURAÇÃO
// ============================================================
const SPREADSHEET_ID = '11qtC1o3WyhjL1wOaEGbQGZ28h-yhSPYc6HA3R9nsaJo'; // Planilha "Admissao"
const SHEET_NAME = 'Admissao';                     // Nome da aba
const DRIVE_FOLDER_ID = '142Ha2bkMOnMssADr1nBaG3TSmiS7UD1H';      // Pasta Google Drive

// Índice das colunas (1-indexed) para edição
// Ordem: Timestamp(1), Empresa(2), Enviado Por(3), Nome(4), Telefone(5)...
const COL_MAP = {
  nomeCompleto: 4, telefone: 5, dataNascimento: 6, sexo: 7,
  estadoCivil: 8, nomePai: 9, nomeMae: 10, rg: 11, cpf: 12,
  motorista: 13, pis: 14, emailColaborador: 15, endereco: 16,
  bairro: 17, cidadeEstado: 18, escolaridade: 19, contaItau: 20,
  filhos: 21
};

// ============================================================
// HANDLER GET - Retorna dados ou status
// ============================================================
function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getCadastros') {
      return getCadastros();
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'ok',
        message: 'API do Formulário Admissional Grupo Rigarr está ativa.'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// HANDLER POST - Formulário, Edição ou Aprovação
// ============================================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // === ATUALIZAR CADASTRO ===
    if (action === 'updateCadastro') {
      return updateCadastro(data.row, data.updates);
    }

    // === APROVAR CADASTRO ===
    if (action === 'aprovarCadastro') {
      return aprovarCadastro(data.row, data.emailDestinatario, data.nomeColaborador, data.empresa);
    }

    // === RE-UPLOAD DE ARQUIVO ===
    if (action === 'reuploadFile') {
      return reuploadFile(data.row, data.fieldKey, data.originalFieldName, data.nomeColaborador, data.file);
    }

    // === NOVO CADASTRO (formulário) ===
    const formData = data.formData;
    const files = data.files;
    const nomeColaborador = data.nomeColaborador || 'SemNome';

    // === VALIDAÇÃO: Todos os campos obrigatórios devem estar preenchidos ===
    const camposObrigatorios = [
      'nomeCompleto', 'telefone', 'dataNascimento', 'sexo', 'estadoCivil',
      'nomePai', 'nomeMae', 'rg', 'cpf', 'motorista', 'emailColaborador',
      'endereco', 'bairro', 'cidadeEstado', 'escolaridade', 'contaItau',
      'filhos', 'declaracao'
    ];

    const camposFaltando = camposObrigatorios.filter(c => !formData[c] || String(formData[c]).trim() === '');
    if (camposFaltando.length > 0) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Campos obrigatórios não preenchidos: ' + camposFaltando.join(', ') }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Validar arquivos obrigatórios
    const arquivosObrigatorios = ['comprovanteResidencia', 'comprovanteEscolaridade', 'ctpsDigital', 'pdfCarteiraTrabalho', 'foto3x4'];
    // Condicionais
    if (formData.sexo === 'Masculino') arquivosObrigatorios.push('certificadoReservista');
    if (formData.estadoCivil === 'Casado(a)' || formData.estadoCivil === 'União estável') arquivosObrigatorios.push('certidaoCasamento');
    if (formData.motorista === 'Sim') arquivosObrigatorios.push('cnhDocumento');
    if (formData.filhos === 'Sim') arquivosObrigatorios.push('certidaoFilhos');

    const arquivosFaltando = arquivosObrigatorios.filter(a => !files || !files[a]);
    if (arquivosFaltando.length > 0) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Documentos obrigatórios não enviados: ' + arquivosFaltando.join(', ') }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (formData.declaracao !== 'Sim') {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'A declaração deve ser aceita (Sim).' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Criar subpasta no Drive com o nome do colaborador
    const mainFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const timestamp = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd_HH-mm');
    const subFolderName = nomeColaborador.replace(/[^a-zA-ZÀ-ÿ0-9 ]/g, '') + ' - ' + timestamp;
    const subFolder = mainFolder.createFolder(subFolderName);

    // Salvar arquivos no Drive e coletar links
    const fileLinks = {};
    if (files) {
      for (const fieldName in files) {
        const fileData = files[fieldName];

        if (Array.isArray(fileData)) {
          const links = [];
          fileData.forEach((f, index) => {
            const link = saveFileToDrive(subFolder, f, fieldName + '_' + (index + 1));
            links.push(link);
          });
          fileLinks[fieldName] = links.join(' | ');
        } else {
          fileLinks[fieldName] = saveFileToDrive(subFolder, fileData, fieldName);
        }
      }
    }

    fileLinks['pastaDocumentos'] = subFolder.getUrl();

    saveToSheet(formData, fileLinks);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', folder: subFolder.getUrl() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Erro doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// GET CADASTROS - Retorna todos os dados da planilha
// ============================================================
function getCadastros() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet || sheet.getLastRow() < 2) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', data: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// UPDATE CADASTRO - Atualiza campos de uma linha
// ============================================================
function updateCadastro(rowNumber, updates) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  for (const key in updates) {
    if (COL_MAP.hasOwnProperty(key)) {
      const col = COL_MAP[key];
      sheet.getRange(rowNumber, col).setValue(updates[key]);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', message: 'Cadastro atualizado.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// APROVAR CADASTRO - Marca como "Aprovado" + envia email com docs
// ============================================================
function aprovarCadastro(rowNumber, emailDestinatario, nomeColaborador, empresa) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  // Garantir que a coluna Status existe no header
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let statusColIndex = headers.indexOf('Status') + 1;

  if (statusColIndex === 0) {
    statusColIndex = sheet.getLastColumn() + 1;
    sheet.getRange(1, statusColIndex).setValue('Status');
    sheet.getRange(1, statusColIndex).setFontWeight('bold');
  }

  sheet.getRange(rowNumber, statusColIndex).setValue('Aprovado');

  // Colorir a linha de verde claro
  const lastCol = sheet.getLastColumn();
  sheet.getRange(rowNumber, 1, 1, lastCol).setBackground('#e8f5e9');

  // === ENVIAR EMAIL COM DOCUMENTOS ===
  let emailMsg = 'Cadastro aprovado.';
  try {
    // Encontrar a pasta do colaborador
    const pastaColIndex = headers.indexOf('Link - Pasta Documentos') + 1;
    let attachments = [];

    if (pastaColIndex > 0) {
      const pastaUrl = sheet.getRange(rowNumber, pastaColIndex).getValue();
      if (pastaUrl) {
        const folderIdMatch = pastaUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (folderIdMatch) {
          const folder = DriveApp.getFolderById(folderIdMatch[1]);
          const files = folder.getFiles();

          while (files.hasNext()) {
            const file = files.next();
            attachments.push(file.getAs(file.getMimeType()));
          }
        }
      }
    }

    // Montar dados do colaborador para o corpo do email
    const rowData = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
    let dadosHtml = '';
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      const v = rowData[i];
      if (v && !String(h).startsWith('Link -') && h !== 'Status') {
        dadosHtml += '<tr><td style="padding:6px 12px;font-weight:600;color:#555;border-bottom:1px solid #eee;">' + h + '</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">' + v + '</td></tr>';
      }
    }

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <div style="background:#222;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="color:#EFC030;margin:0;">Cadastro Aprovado</h2>
          <p style="color:#ccc;margin:4px 0 0;">${empresa || 'Grupo Rigarr'}</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #eee;">
          <p style="font-size:16px;margin:0 0 16px;">O cadastro de <strong>${nomeColaborador || 'Colaborador'}</strong> foi aprovado.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${dadosHtml}
          </table>
          <p style="margin:20px 0 0;font-size:13px;color:#999;">
            ${attachments.length > 0 ? attachments.length + ' documento(s) anexado(s) a este email.' : 'Nenhum documento encontrado na pasta.'}
          </p>
        </div>
        <div style="background:#f5f5f5;padding:12px 24px;border-radius:0 0 8px 8px;border:1px solid #eee;border-top:none;">
          <p style="margin:0;font-size:12px;color:#999;">Formulário Admissional - Grupo Rigarr</p>
        </div>
      </div>
    `;

    if (emailDestinatario) {
      GmailApp.sendEmail(
        emailDestinatario,
        'Cadastro Aprovado - ' + (nomeColaborador || 'Colaborador') + ' (' + (empresa || '') + ')',
        'Cadastro de ' + (nomeColaborador || 'Colaborador') + ' aprovado. Documentos em anexo.',
        {
          htmlBody: htmlBody,
          attachments: attachments,
          name: 'RH Grupo Rigarr'
        }
      );
      emailMsg = 'Cadastro aprovado e email enviado para ' + emailDestinatario + ' com ' + attachments.length + ' documento(s).';
    }

  } catch (emailError) {
    Logger.log('Erro ao enviar email: ' + emailError.toString());
    emailMsg = 'Cadastro aprovado, mas houve erro ao enviar email: ' + emailError.toString();
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', message: emailMsg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// RE-UPLOAD DE ARQUIVO (substituição pelo RH)
// ============================================================
function reuploadFile(rowNumber, fieldKey, originalFieldName, nomeColaborador, fileObj) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  // Encontrar a coluna do link do arquivo no header
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Mapa de fieldKey para nome do header
  const headerMap = {
    linkReservista: 'Link - Certificado Reservista',
    linkCasamento: 'Link - Certidão Casamento',
    linkCnh: 'Link - CNH',
    linkPis: 'Link - Comprovante PIS',
    linkResidencia: 'Link - Comprovante Residência',
    linkEscolaridade: 'Link - Comprovante Escolaridade',
    linkCtps: 'Link - CTPS Digital',
    linkCarteira: 'Link - Carteira Trabalho PDF',
    linkFoto: 'Link - Foto 3x4',
    linkFilhos: 'Link - Certidão Filhos'
  };

  const headerName = headerMap[fieldKey];
  const colIndex = headers.indexOf(headerName) + 1;

  if (colIndex === 0) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: 'Coluna não encontrada: ' + fieldKey }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Verificar se já existe uma pasta para esse colaborador
  // Pegar o link da pasta existente
  const pastaColIndex = headers.indexOf('Link - Pasta Documentos') + 1;
  let folder;

  if (pastaColIndex > 0) {
    const pastaUrl = sheet.getRange(rowNumber, pastaColIndex).getValue();
    if (pastaUrl) {
      try {
        // Extrair o ID da pasta da URL
        const folderIdMatch = pastaUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (folderIdMatch) {
          folder = DriveApp.getFolderById(folderIdMatch[1]);
        }
      } catch (e) {
        Logger.log('Pasta anterior não encontrada, criando nova.');
      }
    }
  }

  // Se não encontrou pasta existente, criar nova
  if (!folder) {
    const mainFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const timestamp = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd_HH-mm');
    const subFolderName = (nomeColaborador || 'SemNome').replace(/[^a-zA-ZÀ-ÿ0-9 ]/g, '') + ' - ' + timestamp;
    folder = mainFolder.createFolder(subFolderName);

    // Atualizar link da pasta na planilha
    if (pastaColIndex > 0) {
      sheet.getRange(rowNumber, pastaColIndex).setValue(folder.getUrl());
    }
  }

  // Salvar o novo arquivo
  const newFileUrl = saveFileToDrive(folder, fileObj, originalFieldName);

  // Atualizar o link na planilha
  sheet.getRange(rowNumber, colIndex).setValue(newFileUrl);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', fileUrl: newFileUrl }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// SALVAR ARQUIVO NO DRIVE
// ============================================================
function saveFileToDrive(folder, fileObj, fieldName) {
  try {
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileObj.data),
      fileObj.type,
      fileObj.name
    );
    const file = folder.createFile(blob);
    file.setDescription('Campo: ' + fieldName);
    return file.getUrl();
  } catch (e) {
    Logger.log('Erro ao salvar arquivo ' + fieldName + ': ' + e.toString());
    return 'ERRO: ' + e.toString();
  }
}

// ============================================================
// SALVAR NA PLANILHA
// ============================================================
function saveToSheet(formData, fileLinks) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      'Timestamp',
      'Empresa',
      'Enviado Por',
      'Nome Completo',
      'Telefone',
      'Data de Nascimento',
      'Sexo',
      'Estado Civil',
      'Nome do Pai',
      'Nome da Mãe',
      'RG',
      'CPF',
      'Motorista',
      'PIS',
      'Email',
      'Endereço',
      'Bairro',
      'Cidade/Estado',
      'Escolaridade',
      'Conta Itaú',
      'Possui Filhos',
      'Documento Etnia',
      'Vale Transporte',
      'Declaração',
      'Link - Certificado Reservista',
      'Link - Certidão Casamento',
      'Link - CNH',
      'Link - Comprovante PIS',
      'Link - Comprovante Residência',
      'Link - Comprovante Escolaridade',
      'Link - CTPS Digital',
      'Link - Carteira Trabalho PDF',
      'Link - Foto 3x4',
      'Link - Certidão Filhos',
      'Link - Pasta Documentos',
      'Status'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  const row = [
    formData.timestamp || new Date().toLocaleString(),
    formData.empresa || '',
    formData.enviadoPor || '',
    formData.nomeCompleto || '',
    formData.telefone || '',
    formData.dataNascimento || '',
    formData.sexo || '',
    formData.estadoCivil || '',
    formData.nomePai || '',
    formData.nomeMae || '',
    formData.rg || '',
    formData.cpf || '',
    formData.motorista || '',
    formData.pis || '',
    formData.emailColaborador || '',
    formData.endereco || '',
    formData.bairro || '',
    formData.cidadeEstado || '',
    formData.escolaridade || '',
    formData.contaItau || '',
    formData.filhos || '',
    formData.documentoEtnia || '',
    formData.valeTransporte || '',
    formData.declaracao || '',
    fileLinks.certificadoReservista || '',
    fileLinks.certidaoCasamento || '',
    fileLinks.cnhDocumento || '',
    fileLinks.comprovantePis || '',
    fileLinks.comprovanteResidencia || '',
    fileLinks.comprovanteEscolaridade || '',
    fileLinks.ctpsDigital || '',
    fileLinks.pdfCarteiraTrabalho || '',
    fileLinks.foto3x4 || '',
    fileLinks.certidaoFilhos || '',
    fileLinks.pastaDocumentos || '',
    'Pendente'
  ];

  sheet.appendRow(row);
}

// ============================================================
// FUNÇÃO DE TESTE
// ============================================================
function testSetup() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('Planilha OK: ' + ss.getName());
  } catch (e) {
    Logger.log('ERRO na planilha: ' + e.toString());
  }

  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    Logger.log('Pasta Drive OK: ' + folder.getName());
  } catch (e) {
    Logger.log('ERRO na pasta Drive: ' + e.toString());
  }
}
