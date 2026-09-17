const CONFIG = {
  RESPONSE_SHEET: 'Respostas ao formulário 1',
  OPERATION_SHEET: 'Operação',
  INITIAL_STATUS: 'Recebido',

  TEMPLATE_DOC_ID: '1SvNl2cxadb5PAELqEfZ2PwTEwX4NJWIUj50Bto97_3I',
  OUTPUT_FOLDER_ID: '1M7nVBZQz5mVyG0AGemcSDTSXMGZMLYUU'
};

/**
 * Teste manual.
 *
 * Lê a resposta mais recente do Google Forms e cria
 * o registro correspondente na aba "Operação".
 *
 * Não cria ainda Ordem de Serviço.
 */
function testProcessLatestResponse() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  const responseSheet = spreadsheet.getSheetByName(CONFIG.RESPONSE_SHEET);
  const operationSheet = spreadsheet.getSheetByName(CONFIG.OPERATION_SHEET);

  if (!responseSheet) {
    throw new Error(
      `Aba "${CONFIG.RESPONSE_SHEET}" não encontrada.`
    );
  }

  if (!operationSheet) {
    throw new Error(
      `Aba "${CONFIG.OPERATION_SHEET}" não encontrada.`
    );
  }

  const lastRow = responseSheet.getLastRow();

  if (lastRow < 2) {
    throw new Error(
      'Não há respostas no formulário para processar.'
    );
  }

  // Colunas da aba de respostas:
  // 1 Data/hora
  // 2 Cliente
  // 3 Telefone
  // 4 Email
  // 5 Empresa
  // 6 Tipo de Serviço
  // 7 Descrição
  // 8 Prioridade
  // 9 Prazo
  const response = responseSheet
    .getRange(lastRow, 1, 1, 9)
    .getValues()[0];

  const [
    timestamp,
    client,
    phone,
    email,
    company,
    serviceType,
    description,
    priority,
    dueDate
  ] = response;

  const requestId = getNextRequestId_(operationSheet);

  const operationRow = [
    requestId,             // A ID
    timestamp,             // B Data/hora
    client,                // C Cliente
    phone,                 // D Telefone
    email,                 // E Email
    company,               // F Empresa
    serviceType,           // G Tipo de Serviço
    description,           // H Descrição
    priority,              // I Prioridade
    '',                    // J Responsável
    CONFIG.INITIAL_STATUS, // K Status
    dueDate,               // L Prazo
    '',                    // M Link da OS
    ''                     // N Concluído em
  ];

  operationSheet.appendRow(operationRow);

  Logger.log(`Solicitação ${requestId} criada com sucesso.`);
}


/**
 * Gera o próximo identificador SR-0001, SR-0002...
 *
 * O maior ID existente na aba Operação determina
 * o próximo número.
 */
function getNextRequestId_(operationSheet) {
  const lastRow = operationSheet.getLastRow();

  if (lastRow < 2) {
    return 'SR-0001';
  }

  const ids = operationSheet
    .getRange(2, 1, lastRow - 1, 1)
    .getValues()
    .flat();

  let highestNumber = 0;

  ids.forEach(id => {
    const match = String(id).match(/^SR-(\d+)$/);

    if (match) {
      highestNumber = Math.max(
        highestNumber,
        Number(match[1])
      );
    }
  });

  const nextNumber = highestNumber + 1;

  return `SR-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Teste manual.
 *
 * Gera uma Ordem de Serviço para o registro mais recente
 * da aba "Operação".
 *
 * Fluxo:
 * Operação → cópia do template → substituição dos campos
 * → salvamento no Drive → link em "Operação".
 */
function testGenerateLatestWorkOrder() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const operationSheet = spreadsheet.getSheetByName(
    CONFIG.OPERATION_SHEET
  );

  if (!operationSheet) {
    throw new Error(
      `Aba "${CONFIG.OPERATION_SHEET}" não encontrada.`
    );
  }

  const lastRow = operationSheet.getLastRow();

  if (lastRow < 2) {
    throw new Error(
      'Não há solicitações na aba Operação.'
    );
  }

  const row = operationSheet
    .getRange(lastRow, 1, 1, 14)
    .getDisplayValues()[0];

  const [
    requestId,
    timestamp,
    client,
    phone,
    email,
    company,
    serviceType,
    description,
    priority,
    owner,
    status,
    dueDate,
    workOrderUrl,
    completedAt
  ] = row;

  if (!requestId) {
    throw new Error(
      'A solicitação não possui ID.'
    );
  }

  const outputFolder = DriveApp.getFolderById(
    CONFIG.OUTPUT_FOLDER_ID
  );

  // 1. Se a planilha já tiver URL, não gera outra OS.
  if (workOrderUrl) {
    Logger.log(
      `A solicitação ${requestId} já possui OS registrada: ${workOrderUrl}`
    );
    return;
  }

  // 2. Procura uma OS já existente na pasta.
  const existingFile = findExistingWorkOrder_(
    outputFolder,
    requestId
  );

  if (existingFile) {
    operationSheet
      .getRange(lastRow, 13)
      .setValue(existingFile.getUrl());

    Logger.log(
      `OS existente encontrada para ${requestId}. Link restaurado.`
    );

    return;
  }

  // 3. Só cria nova OS se não houver nenhuma existente.
  const templateFile = DriveApp.getFileById(
    CONFIG.TEMPLATE_DOC_ID
  );

  const fileName = `OS - ${requestId} - ${client}`;

  const workOrderFile = templateFile.makeCopy(
    fileName,
    outputFolder
  );

  const document = DocumentApp.openById(
    workOrderFile.getId()
  );

  const body = document.getBody();

  replacePlaceholder_(body, 'ID', requestId);
  replacePlaceholder_(body, 'DATA', timestamp);
  replacePlaceholder_(body, 'CLIENTE', client);
  replacePlaceholder_(body, 'TELEFONE', phone);
  replacePlaceholder_(body, 'EMAIL', email);
  replacePlaceholder_(body, 'EMPRESA', company);
  replacePlaceholder_(body, 'TIPO_SERVICO', serviceType);
  replacePlaceholder_(body, 'DESCRICAO', description);
  replacePlaceholder_(body, 'PRIORIDADE', priority);
  replacePlaceholder_(body, 'PRAZO', dueDate);
  replacePlaceholder_(body, 'RESPONSAVEL', owner);
  replacePlaceholder_(body, 'STATUS', status);

  document.saveAndClose();

  // 4. Registra a URL somente depois que o documento foi concluído.
  operationSheet
    .getRange(lastRow, 13)
    .setValue(workOrderFile.getUrl());

  Logger.log(
    `OS criada para ${requestId}: ${workOrderFile.getUrl()}`
  );
}


/**
 * Procura na pasta uma OS associada ao requestId.
 *
 * Retorna o primeiro arquivo encontrado ou null.
 */
function findExistingWorkOrder_(folder, requestId) {
  const files = folder.getFiles();

  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();

    if (name.includes(requestId)) {
      return file;
    }
  }

  return null;
}

function main() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  const responseSheet = spreadsheet.getSheetByName(
    CONFIG.RESPONSE_SHEET
  );

  const operationSheet = spreadsheet.getSheetByName(
    CONFIG.OPERATION_SHEET
  );

  if (!responseSheet || !operationSheet) {
    throw new Error(
      'Não foi possível localizar as abas de resposta ou operação.'
    );
  }

  const rowNumber = responseSheet.getLastRow();

  if (rowNumber < 2) {
    throw new Error(
      'Não há respostas para processar.'
    );
  }

  processResponseRow_(
    responseSheet,
    operationSheet,
    rowNumber
  );
}

function onFormSubmitHandler(e) {
  const responseSheet = e.range.getSheet();

  if (
    responseSheet.getName() !==
    CONFIG.RESPONSE_SHEET
  ) {
    return;
  }

  const spreadsheet = e.source;

  const operationSheet =
    spreadsheet.getSheetByName(
      CONFIG.OPERATION_SHEET
    );

  if (!operationSheet) {
    throw new Error(
      `Aba "${CONFIG.OPERATION_SHEET}" não encontrada.`
    );
  }

  const responseRowNumber =
    e.range.getRow();

  processResponseRow_(
    responseSheet,
    operationSheet,
    responseRowNumber
  );
}

function processResponseRow_(
  responseSheet,
  operationSheet,
  responseRowNumber
) {
  const response = responseSheet
    .getRange(responseRowNumber, 1, 1, 9)
    .getDisplayValues()[0];

  const [
    timestamp,
    client,
    phone,
    email,
    company,
    serviceType,
    description,
    priority,
    dueDate
  ] = response;

  const requestId = getNextRequestId_(
    operationSheet
  );

  const operationRow = [
    requestId,
    timestamp,
    client,
    phone,
    email,
    company,
    serviceType,
    description,
    priority,
    '',
    CONFIG.INITIAL_STATUS,
    dueDate,
    '',
    ''
  ];

  operationSheet.appendRow(operationRow);

  const operationRowNumber =
    operationSheet.getLastRow();

  generateWorkOrder_(
    operationSheet,
    operationRowNumber
  );

  Logger.log(
    `Solicitação ${requestId} processada com sucesso.`
  );
}

function generateWorkOrder_(
  operationSheet,
  rowNumber
) {
  const row = operationSheet
    .getRange(rowNumber, 1, 1, 14)
    .getDisplayValues()[0];

  const [
    requestId,
    timestamp,
    client,
    phone,
    email,
    company,
    serviceType,
    description,
    priority,
    owner,
    status,
    dueDate,
    workOrderUrl,
    completedAt
  ] = row;

  if (!requestId) {
    throw new Error(
      'A solicitação não possui ID.'
    );
  }

  const outputFolder =
    DriveApp.getFolderById(
      CONFIG.OUTPUT_FOLDER_ID
    );

  if (workOrderUrl) {
    Logger.log(
      `${requestId} já possui OS registrada.`
    );
    return;
  }

  const existingFile =
    findExistingWorkOrder_(
      outputFolder,
      requestId
    );

  if (existingFile) {
    operationSheet
      .getRange(rowNumber, 13)
      .setValue(existingFile.getUrl());

    Logger.log(
      `OS existente recuperada para ${requestId}.`
    );

    return;
  }

  const templateFile =
    DriveApp.getFileById(
      CONFIG.TEMPLATE_DOC_ID
    );

  const fileName =
    `OS - ${requestId} - ${client}`;

  const workOrderFile =
    templateFile.makeCopy(
      fileName,
      outputFolder
    );

  const document =
    DocumentApp.openById(
      workOrderFile.getId()
    );

  const body = document.getBody();

  replacePlaceholder_(body, 'ID', requestId);
  replacePlaceholder_(body, 'DATA', timestamp);
  replacePlaceholder_(body, 'CLIENTE', client);
  replacePlaceholder_(body, 'TELEFONE', phone);
  replacePlaceholder_(body, 'EMAIL', email);
  replacePlaceholder_(body, 'EMPRESA', company);
  replacePlaceholder_(body, 'TIPO_SERVICO', serviceType);
  replacePlaceholder_(body, 'DESCRICAO', description);
  replacePlaceholder_(body, 'PRIORIDADE', priority);
  replacePlaceholder_(body, 'PRAZO', dueDate);
  replacePlaceholder_(body, 'RESPONSAVEL', owner);
  replacePlaceholder_(body, 'STATUS', status);

  document.saveAndClose();

  operationSheet
    .getRange(rowNumber, 13)
    .setValue(workOrderFile.getUrl());
}

function replacePlaceholder_(body, placeholder, value) {
  const pattern = `\\{\\{${placeholder}\\}\\}`;

  body.replaceText(
    pattern,
    value == null ? '' : String(value)
  );
}

function getProcessedTimestamps_(operationSheet) {
  const lastRow = operationSheet.getLastRow();

  if (lastRow < 2) {
    return new Set();
  }

  // Coluna B = Data/hora
  const values = operationSheet
    .getRange(2, 2, lastRow - 1, 1)
    .getDisplayValues()
    .flat();

  return new Set(
    values
      .map(value => String(value).trim())
      .filter(Boolean)
  );
}

function onEdit(e) {
  const sheet = e.range.getSheet();

  if (sheet.getName() !== CONFIG.OPERATION_SHEET) {
    return;
  }

  // Coluna K = Status
  if (e.range.getColumn() !== 11) {
    return;
  }

  if (e.range.getRow() === 1) {
    return;
  }

  const completedCell =
    sheet.getRange(e.range.getRow(), 14);

  if (e.value === 'Concluído') {
    completedCell.setValue(new Date());
  } else if (e.oldValue === 'Concluído') {
    completedCell.clearContent();
  }
}
