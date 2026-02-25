import { FieldDefinition, FieldGroup } from './types';

// Helper to create simple options array from map keys
const getKeys = (map: Record<string, string>) => Object.keys(map).map(k => `${k} - ${map[k]}`);

// --- VALUE MAPPINGS (Based on user provided data) ---

const STATUS_OPTIONS = [
  'Completar e encerrar', 'Completar em TTO', 'Cura', 'Cura/vincular',
  'Interrupção pop rua', 'Interrupçõa/abandono', 'Óbito Outras', 'Óbito TB', 'Transferido'
];

const MES_OPTIONS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const TP_NOT_MAP = { '1': 'Negativa', '2': 'Individual' };
const ID_AGRAVO_MAP = {
  'A150': 'TB pulmonar, conf. bact. e hist.',
  'A151': 'TB pulmonar, conf. cultura',
  'A152': 'TB pulmonar, conf. histológica',
  'A153': 'TB pulmonar, sem conf. bact/hist.',
  'A160': 'TB pulmonar, exames neg.',
  'A161': 'TB pulmonar, sem exames',
  'A162': 'TB pulmonar, sem menção conf.',
  'A167': 'TB primária respiratória',
  'A168': 'Outras formas TB resp.',
  'A169': 'TB respiratória NE'
};

const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const SEXO_MAP = { 'M': 'Masculino', 'F': 'Feminino', 'I': 'Ignorado' };
const GESTANT_MAP = {
  '1': '1º Trimestre', '2': '2º Trimestre', '3': '3º Trimestre', 
  '4': 'IG Ignorada', '5': 'Não', '6': 'Não se aplica', '9': 'Ignorado'
};
const RACA_MAP = { '1': 'Branca', '2': 'Preta', '3': 'Amarela', '4': 'Parda', '5': 'Indígena', '9': 'Ignorado' };
const ESCOLARIDADE_MAP = {
  '0': 'Analfabeto', '1': '1ª-4ª série inc. EF', '2': '4ª série comp. EF',
  '3': '5ª-8ª série inc. EF', '4': 'Fund. completo', '5': 'Médio incompleto',
  '6': 'Médio completo', '7': 'Sup. incompleto', '8': 'Sup. completo',
  '9': 'Ignorado', '10': 'Não se aplica'
};
const ZONA_MAP = { '1': 'Urbana', '2': 'Rural', '3': 'Periurbana', '9': 'Ignorado' };
const BINARY_MAP = { '1': 'Sim', '2': 'Não', '9': 'Ignorado' };
const BINARY_01_MAP = { '0': 'Não', '1': 'Sim' };

const TRATAMENTO_MAP = {
  '1': 'Caso Novo', '2': 'Recidiva', '3': 'Reingresso abandono',
  '4': 'Não Sabe', '5': 'Transferência', '6': 'Pós-óbito'
};

const INSTITUCIO_MAP = {
  '1': 'Prisão', '2': 'Abrigo', '3': 'Orfanato', '4': 'Asilo',
  '5': 'Hosp. Psiquiátrico', '6': 'Outros', '9': 'Ignorado'
};

const RAIOX_MAP = { '1': 'Suspeito', '2': 'Normal', '3': 'Outra patologia', '4': 'Não realizado' };
const FORMA_MAP = { '1': 'Pulmonar', '2': 'Extrapulmonar', '3': 'Pulm + Extra' };
const EXTRAPUL_MAP = {
  '1': 'Pleural', '2': 'Gang. periférica', '3': 'Geniturinária', '4': 'Óssea',
  '5': 'Ocular', '6': 'Miliar', '7': 'Meníngea', '8': 'Cutânea', '9': 'Outra', '10': 'Laringea'
};

const BACILOSCOPIA_MAP = { '1': 'Positiva', '2': 'Negativa', '3': 'Não realizada', '4': 'Não se aplica' };
const HIV_MAP = { '1': 'Positivo', '2': 'Negativo', '3': 'Em andamento', '4': 'Não realizado', '9': 'Ignorado' };
const HISTOPATOL_MAP = { '1': 'Sugestivo TB', '2': 'Não sugestivo', '3': 'Inconclusivo', '4': 'Não realizado', '9': 'Ignorado' };
const TRAT_SUPER_MAP = { '1': 'Sim (TDO)', '2': 'Não', '9': 'Ignorado' };
const SITUA_ENCERRAMENTO_MAP = {
  '1': 'Cura', '2': 'Abandono', '3': 'Óbito TB', '4': 'Óbito Outras',
  '5': 'Transferência', '6': 'Mudança Esquema', '7': 'TB DR',
  '8': 'Erro Diag', '9': 'Ignorado', '10': 'Mudança Diag'
};

const TEST_MOLEC_MAP = {
  '1': 'Det. Sensível Rif.', '2': 'Det. Resistente Rif.', '3': 'Não Detectável',
  '4': 'Inconclusivo', '5': 'Não realizado'
};

const TEST_SENSI_MAP = {
  '1': 'Sensível', '2': 'Res. Isoniazida', '3': 'Res. Rifampicina',
  '4': 'Res. Iso+Rifa', '5': 'Res. outras 1ª linha', '6': 'Não realizado', '9': 'Ignorado'
};


// --- FIELD DEFINITIONS ---

export const SINAN_DICTIONARY: Record<string, FieldDefinition> = {
  // Custom Control Fields
  'Status': { id: 'Status', label: 'Status de Gestão', type: 'select', options: STATUS_OPTIONS, description: 'Status interno para gestão do paciente.' },
  'Mês': { id: 'Mês', label: 'Mês Referência', type: 'select', options: MES_OPTIONS, description: 'Mês de referência da gestão.' },
  'Observações': { id: 'Observações', label: 'Observações', type: 'textarea', description: 'Anotações gerais sobre o caso.' },

  // Identificação
  'NU_NOTIFIC': { id: 'NU_NOTIFIC', label: 'Número da Notificação', type: 'text', description: 'Número único da notificação SINAN.' },
  'TP_NOT': { id: 'TP_NOT', label: 'Tipo Notificação', type: 'select', optionsMap: TP_NOT_MAP, options: getKeys(TP_NOT_MAP), description: 'Tipo da notificação.' },
  'ID_AGRAVO': { id: 'ID_AGRAVO', label: 'Agravo (CID)', type: 'select', optionsMap: ID_AGRAVO_MAP, options: getKeys(ID_AGRAVO_MAP), description: 'Código do agravo (Doença).' },
  'DT_NOTIFIC': { id: 'DT_NOTIFIC', label: 'Data Notificação', type: 'date', description: 'Data da notificação.' },
  'NU_ANO': { id: 'NU_ANO', label: 'Ano', type: 'text', description: 'Ano da notificação.' },
  'SG_UF_NOT': { id: 'SG_UF_NOT', label: 'UF Notificação', type: 'select', options: UF_LIST, description: 'Estado da unidade notificadora.' },
  'ID_MUNICIP': { id: 'ID_MUNICIP', label: 'Município Notif.', type: 'text', description: 'Código IBGE do município.' },
  'ID_UNIDADE': { id: 'ID_UNIDADE', label: 'Unidade Saúde', type: 'text', description: 'Código CNES da unidade.' },
  
  // Paciente
  'NM_PACIENT': { id: 'NM_PACIENT', label: 'Nome Paciente', type: 'text', description: 'Nome completo.' },
  'DT_NASC': { id: 'DT_NASC', label: 'Data Nascimento', type: 'date', description: 'Data de nascimento.' },
  'NU_IDADE_N': { id: 'NU_IDADE_N', label: 'Idade', type: 'text', description: 'Idade codificada.' },
  'CS_SEXO': { id: 'CS_SEXO', label: 'Sexo', type: 'select', optionsMap: SEXO_MAP, options: getKeys(SEXO_MAP), description: 'Sexo do paciente.' },
  'CS_GESTANT': { id: 'CS_GESTANT', label: 'Gestante', type: 'select', optionsMap: GESTANT_MAP, options: getKeys(GESTANT_MAP), description: 'Idade gestacional.' },
  'CS_RACA': { id: 'CS_RACA', label: 'Raça/Cor', type: 'select', optionsMap: RACA_MAP, options: getKeys(RACA_MAP), description: 'Raça/Cor autodeclarada.' },
  'CS_ESCOL_N': { id: 'CS_ESCOL_N', label: 'Escolaridade', type: 'select', optionsMap: ESCOLARIDADE_MAP, options: getKeys(ESCOLARIDADE_MAP), description: 'Nível de instrução.' },
  'ID_CNS_SUS': { id: 'ID_CNS_SUS', label: 'Cartão SUS', type: 'text', description: 'Número do cartão SUS.' },
  'NM_MAE_PAC': { id: 'NM_MAE_PAC', label: 'Nome da Mãe', type: 'text', description: 'Nome da mãe.' },

  // Endereço
  'SG_UF': { id: 'SG_UF', label: 'UF Residência', type: 'select', options: UF_LIST, description: 'UF de residência.' },
  'ID_MN_RESI': { id: 'ID_MN_RESI', label: 'Município Res.', type: 'text', description: 'Município de residência.' },
  'NM_BAIRRO': { id: 'NM_BAIRRO', label: 'Bairro', type: 'text', description: 'Bairro de residência.' },
  'NM_LOGRADO': { id: 'NM_LOGRADO', label: 'Logradouro', type: 'text', description: 'Endereço (Rua/Av).' },
  'NU_NUMERO': { id: 'NU_NUMERO', label: 'Número', type: 'text', description: 'Número do imóvel.' },
  'NM_COMPLEM': { id: 'NM_COMPLEM', label: 'Complemento', type: 'text', description: 'Complemento do endereço.' },
  'NU_CEP': { id: 'NU_CEP', label: 'CEP', type: 'text', description: 'Código de Endereçamento Postal.' },
  'NU_TELEFON': { id: 'NU_TELEFON', label: 'Telefone', type: 'text', description: 'Telefone de contato.' },
  'CS_ZONA': { id: 'CS_ZONA', label: 'Zona', type: 'select', optionsMap: ZONA_MAP, options: getKeys(ZONA_MAP), description: 'Zona de residência.' },
  'ID_PAIS': { id: 'ID_PAIS', label: 'País', type: 'text', description: 'País de residência.' },

  // Flags Administrativas
  'NDUPLIC_N': { id: 'NDUPLIC_N', label: 'Duplicidade', type: 'select', optionsMap: BINARY_01_MAP, options: getKeys(BINARY_01_MAP), description: 'Notificação duplicada?' },
  'IN_VINCULA': { id: 'IN_VINCULA', label: 'Vínculo', type: 'select', optionsMap: BINARY_01_MAP, options: getKeys(BINARY_01_MAP), description: 'Possui vínculo?' },
  'FLXRECEBI': { id: 'FLXRECEBI', label: 'Fluxo Recebido', type: 'select', optionsMap: BINARY_01_MAP, options: getKeys(BINARY_01_MAP), description: 'Fluxo recebido?' },
  'MIGRADO_W': { id: 'MIGRADO_W', label: 'Migrado Windows', type: 'select', optionsMap: BINARY_01_MAP, options: getKeys(BINARY_01_MAP), description: 'Dado migrado?' },

  // Dados Clínicos
  'DT_DIAG': { id: 'DT_DIAG', label: 'Data Diagnóstico', type: 'date', description: 'Data do diagnóstico.' },
  'NU_PRONTUA': { id: 'NU_PRONTUA', label: 'Prontuário', type: 'text', description: 'Número do prontuário.' },
  'TRATAMENTO': { id: 'TRATAMENTO', label: 'Tipo Entrada', type: 'select', optionsMap: TRATAMENTO_MAP, options: getKeys(TRATAMENTO_MAP), description: 'Tipo de entrada.' },
  'INSTITUCIO': { id: 'INSTITUCIO', label: 'Institucionalizado', type: 'select', optionsMap: INSTITUCIO_MAP, options: getKeys(INSTITUCIO_MAP), description: 'Paciente institucionalizado?' },
  'RAIOX_TORA': { id: 'RAIOX_TORA', label: 'Raio-X Tórax', type: 'select', optionsMap: RAIOX_MAP, options: getKeys(RAIOX_MAP), description: 'Resultado Raio-X.' },
  'TESTE_TUBE': { id: 'TESTE_TUBE', label: 'Teste Tuberculínico', type: 'text', description: 'Resultado PPD.' },
  'FORMA': { id: 'FORMA', label: 'Forma Clínica', type: 'select', optionsMap: FORMA_MAP, options: getKeys(FORMA_MAP), description: 'Forma da doença.' },
  
  // Extrapulmonar
  'EXTRAPU1_N': { id: 'EXTRAPU1_N', label: 'Extrapulmonar 1', type: 'select', optionsMap: EXTRAPUL_MAP, options: getKeys(EXTRAPUL_MAP), description: 'Localização extrapulmonar 1.' },
  'EXTRAPU2_N': { id: 'EXTRAPU2_N', label: 'Extrapulmonar 2', type: 'select', optionsMap: EXTRAPUL_MAP, options: getKeys(EXTRAPUL_MAP), description: 'Localização extrapulmonar 2.' },

  // Comorbidades
  'AGRAVAIDS': { id: 'AGRAVAIDS', label: 'AIDS', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'Tem AIDS?' },
  'AGRAVALCOO': { id: 'AGRAVALCOO', label: 'Alcoolismo', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'Tem Alcoolismo?' },
  'AGRAVDIABE': { id: 'AGRAVDIABE', label: 'Diabetes', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'Tem Diabetes?' },
  'AGRAVDOENC': { id: 'AGRAVDOENC', label: 'Doença Mental', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'Tem Doença Mental?' },
  'AGRAVDROGA': { id: 'AGRAVDROGA', label: 'Uso Drogas', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'Usa Drogas?' },
  'AGRAVTABAC': { id: 'AGRAVTABAC', label: 'Tabagismo', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'Fuma?' },

  // Exames
  'BACILOSC_E': { id: 'BACILOSC_E', label: 'Baciloscopia 1', type: 'select', optionsMap: BACILOSCOPIA_MAP, options: getKeys(BACILOSCOPIA_MAP), description: 'Baciloscopia Diagnóstico.' },
  'BACILOS_E2': { id: 'BACILOS_E2', label: 'Baciloscopia 2', type: 'select', optionsMap: BACILOSCOPIA_MAP, options: getKeys(BACILOSCOPIA_MAP), description: 'Baciloscopia Diagnóstico 2.' },
  'CULTURA_ES': { id: 'CULTURA_ES', label: 'Cultura Escarro', type: 'select', optionsMap: BACILOSCOPIA_MAP, options: getKeys(BACILOSCOPIA_MAP), description: 'Cultura de escarro.' },
  'HIV': { id: 'HIV', label: 'HIV', type: 'select', optionsMap: HIV_MAP, options: getKeys(HIV_MAP), description: 'Resultado HIV.' },
  'HISTOPATOL': { id: 'HISTOPATOL', label: 'Histopatológico', type: 'select', optionsMap: HISTOPATOL_MAP, options: getKeys(HISTOPATOL_MAP), description: 'Resultado biópsia.' },
  'TEST_MOLEC': { id: 'TEST_MOLEC', label: 'Teste Molecular', type: 'select', optionsMap: TEST_MOLEC_MAP, options: getKeys(TEST_MOLEC_MAP), description: 'TRM-TB.' },
  'TEST_SENSI': { id: 'TEST_SENSI', label: 'Teste Sensibilidade', type: 'select', optionsMap: TEST_SENSI_MAP, options: getKeys(TEST_SENSI_MAP), description: 'Teste de sensibilidade.' },

  // Tratamento
  'DT_INIC_TR': { id: 'DT_INIC_TR', label: 'Início Tratamento', type: 'date', description: 'Data início tratamento.' },
  'RIFAMPICIN': { id: 'RIFAMPICIN', label: 'Rifampicina', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'Usa Rifampicina?' },
  'ISONIAZIDA': { id: 'ISONIAZIDA', label: 'Isoniazida', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'Usa Isoniazida?' },
  'ETAMBUTOL': { id: 'ETAMBUTOL', label: 'Etambutol', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'Usa Etambutol?' },
  'PIRAZINAMI': { id: 'PIRAZINAMI', label: 'Pirazinamida', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'Usa Pirazinamida?' },
  'TRAT_SUPER': { id: 'TRAT_SUPER', label: 'TDO', type: 'select', optionsMap: TRAT_SUPER_MAP, options: getKeys(TRAT_SUPER_MAP), description: 'Tratamento Supervisionado?' },

  // Acompanhamento
  'BACILOSC_1': { id: 'BACILOSC_1', label: 'Bac. 1º Mês', type: 'select', optionsMap: BACILOSCOPIA_MAP, options: getKeys(BACILOSCOPIA_MAP), description: 'Controle mês 1.' },
  'BACILOSC_2': { id: 'BACILOSC_2', label: 'Bac. 2º Mês', type: 'select', optionsMap: BACILOSCOPIA_MAP, options: getKeys(BACILOSCOPIA_MAP), description: 'Controle mês 2.' },
  'BACILOSC_3': { id: 'BACILOSC_3', label: 'Bac. 3º Mês', type: 'select', optionsMap: BACILOSCOPIA_MAP, options: getKeys(BACILOSCOPIA_MAP), description: 'Controle mês 3.' },
  'BACILOSC_4': { id: 'BACILOSC_4', label: 'Bac. 4º Mês', type: 'select', optionsMap: BACILOSCOPIA_MAP, options: getKeys(BACILOSCOPIA_MAP), description: 'Controle mês 4.' },
  'BACILOSC_5': { id: 'BACILOSC_5', label: 'Bac. 5º Mês', type: 'select', optionsMap: BACILOSCOPIA_MAP, options: getKeys(BACILOSCOPIA_MAP), description: 'Controle mês 5.' },
  'BACILOSC_6': { id: 'BACILOSC_6', label: 'Bac. 6º Mês', type: 'select', optionsMap: BACILOSCOPIA_MAP, options: getKeys(BACILOSCOPIA_MAP), description: 'Controle mês 6+.' },

  // Encerramento
  'SITUA_ENCE': { id: 'SITUA_ENCE', label: 'Situação Encerramento', type: 'select', optionsMap: SITUA_ENCERRAMENTO_MAP, options: getKeys(SITUA_ENCERRAMENTO_MAP), description: 'Desfecho do caso.' },
  'DT_ENCERRA': { id: 'DT_ENCERRA', label: 'Data Encerramento', type: 'date', description: 'Data do desfecho.' },
  'SITUA_9_M': { id: 'SITUA_9_M', label: 'Situação 9 Meses', type: 'select', optionsMap: SITUA_ENCERRAMENTO_MAP, options: getKeys(SITUA_ENCERRAMENTO_MAP), description: 'Situação aos 9 meses.' },
  'SITUA_12_M': { id: 'SITUA_12_M', label: 'Situação 12 Meses', type: 'select', optionsMap: SITUA_ENCERRAMENTO_MAP, options: getKeys(SITUA_ENCERRAMENTO_MAP), description: 'Situação aos 12 meses.' },

  // Populações Especiais
  'POP_LIBER': { id: 'POP_LIBER', label: 'Priv. Liberdade', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'População privada de liberdade.' },
  'POP_RUA': { id: 'POP_RUA', label: 'Pop. Rua', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'População em situação de rua.' },
  'POP_SAUDE': { id: 'POP_SAUDE', label: 'Prof. Saúde', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'Profissional de saúde.' },
  'POP_IMIG': { id: 'POP_IMIG', label: 'Imigrante', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'População imigrante.' },
  'BENEF_GOV': { id: 'BENEF_GOV', label: 'Benefício Gov.', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'Recebe benefício governamental.' },
  'ANT_RETRO': { id: 'ANT_RETRO', label: 'TARV', type: 'select', optionsMap: BINARY_MAP, options: getKeys(BINARY_MAP), description: 'Terapia Antirretroviral?' },
};

export const SINAN_GROUPS: FieldGroup[] = [
  {
    title: 'Identificação',
    fields: ['NU_NOTIFIC', 'TP_NOT', 'ID_AGRAVO', 'DT_NOTIFIC', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_UNIDADE', 'NM_PACIENT', 'DT_NASC', 'NU_IDADE_N', 'CS_SEXO', 'CS_RACA', 'CS_GESTANT', 'NM_MAE_PAC', 'CS_ESCOL_N', 'ID_CNS_SUS']
  },
  {
    title: 'Endereço',
    fields: ['SG_UF', 'ID_MN_RESI', 'ID_DISTRIT', 'ID_BAIRRO', 'NM_BAIRRO', 'ID_LOGRADO', 'NM_LOGRADO', 'NU_NUMERO', 'NM_COMPLEM', 'NU_CEP', 'NU_TELEFON', 'CS_ZONA', 'ID_PAIS']
  },
  {
    title: 'Dados Clínicos',
    fields: ['DT_DIAG', 'TRATAMENTO', 'INSTITUCIO', 'NU_PRONTUA', 'FORMA', 'RAIOX_TORA', 'TESTE_TUBE', 'EXTRAPU1_N', 'EXTRAPU2_N', 'EXTRAPUL_O']
  },
  {
    title: 'Comorbidades & Pop.',
    fields: ['AGRAVAIDS', 'AGRAVALCOO', 'AGRAVDIABE', 'AGRAVDOENC', 'AGRAVOUTRA', 'AGRAVDROGA', 'AGRAVTABAC', 'POP_LIBER', 'POP_RUA', 'POP_SAUDE', 'POP_IMIG', 'BENEF_GOV']
  },
  {
    title: 'Exames',
    fields: ['BACILOSC_E', 'BACILOS_E2', 'BACILOSC_O', 'CULTURA_ES', 'CULTURA_OU', 'TEST_MOLEC', 'TEST_SENSI', 'HIV', 'HISTOPATOL']
  },
  {
    title: 'Tratamento',
    fields: ['DT_INIC_TR', 'RIFAMPICIN', 'ISONIAZIDA', 'ETAMBUTOL', 'ESTREPTOMI', 'PIRAZINAMI', 'ETIONAMIDA', 'OUTRAS', 'TRAT_SUPER', 'DOENCA_TRA', 'DT_MUDANCA']
  },
  {
    title: 'Acompanhamento',
    fields: ['BACILOSC_1', 'BACILOSC_2', 'BACILOSC_3', 'BACILOSC_4', 'BACILOSC_5', 'BACILOSC_6', 'BAC_APOS_6', 'TRATSUP_AT', 'ANT_RETRO', 'NU_PRONT_A']
  },
  {
    title: 'Encerramento',
    fields: ['SITUA_ENCE', 'DT_ENCERRA', 'SITUA_9_M', 'SITUA_12_M', 'TRANSF', 'UF_TRANSF', 'MUN_TRANSF']
  }
];

// Helper to provide default for unknown fields
export const DEFAULT_SINAN_FIELD: FieldDefinition = {
  id: 'unknown',
  label: 'Campo',
  type: 'text',
  description: 'Campo original do CSV.'
};
