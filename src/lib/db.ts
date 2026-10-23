import fs from 'node:fs';
import path from 'node:path';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  institution: string;
  park_size: string;
  message?: string;
  status: 'novo' | 'em_contato' | 'agendado' | 'convertido' | 'arquivado';
  createdAt: string;
}

// Diretório e arquivo de dados persistentes locais
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'leads.json');

// Leads iniciais de demonstração (seed inicial para o painel não ficar vazio)
const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-001',
    name: 'Dr. Roberto Silveira',
    email: 'roberto.silveira@hospitalalvorada.com.br',
    phone: '(11) 99876-5432',
    institution: 'Hospital Geral Alvorada',
    park_size: '501-1500',
    message: 'Precisamos reestruturar o parque para a auditoria ONA Nível 3 que ocorrerá no próximo trimestre.',
    status: 'agendado',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 horas atrás
  },
  {
    id: 'lead-002',
    name: 'Eng. Amanda Duarte',
    email: 'amanda.duarte@clinicadiagnos.med.br',
    phone: '(21) 98765-1122',
    institution: 'Clínica Diagnos Imagem & UTI',
    park_size: '101-500',
    message: 'Buscamos solução para controle de ordens de serviço com QR Code e calibração com rastreabilidade RBC.',
    status: 'novo',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 minutos atrás
  },
  {
    id: 'lead-003',
    name: 'Carlos Eduardo Mendes',
    email: 'carlos.mendes@redesantavida.com.br',
    phone: '(31) 97654-9988',
    institution: 'Complexo Hospitalar Santa Vida (3 Unidades)',
    park_size: 'acima-1500',
    message: 'Interesse no plano Network para unificar a Engenharia Clínica de três hospitais da rede.',
    status: 'em_contato',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
  },
];

function ensureDbFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_LEADS, null, 2), 'utf-8');
  }
}

/**
 * Retorna todos os leads cadastrados
 */
export async function getLeads(): Promise<Lead[]> {
  ensureDbFile();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const leads: Lead[] = JSON.parse(content);
    return leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Erro ao ler base de leads:', err);
    return INITIAL_LEADS;
  }
}

/**
 * Cria um novo lead na base de dados
 */
export async function createLead(data: Omit<Lead, 'id' | 'status' | 'createdAt'>): Promise<Lead> {
  ensureDbFile();
  const leads = await getLeads();

  const newLead: Lead = {
    id: `lead-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    name: data.name,
    email: data.email,
    phone: data.phone,
    institution: data.institution,
    park_size: data.park_size,
    message: data.message || '',
    status: 'novo',
    createdAt: new Date().toISOString(),
  };

  leads.unshift(newLead);
  fs.writeFileSync(DB_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  return newLead;
}

/**
 * Atualiza o status de um lead
 */
export async function updateLeadStatus(id: string, status: Lead['status']): Promise<Lead | null> {
  ensureDbFile();
  const leads = await getLeads();
  const lead = leads.find((l) => l.id === id);

  if (!lead) return null;

  lead.status = status;
  fs.writeFileSync(DB_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  return lead;
}

/**
 * Exclui um lead
 */
export async function deleteLead(id: string): Promise<boolean> {
  ensureDbFile();
  const leads = await getLeads();
  const filtered = leads.filter((l) => l.id !== id);

  if (filtered.length === leads.length) return false;

  fs.writeFileSync(DB_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}

/**
 * Exclui todos os leads da base
 */
export async function clearAllLeads(): Promise<boolean> {
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf-8');
  return true;
}

/**
 * Restaura os leads para a lista padrão de demonstração
 */
export async function resetToDemoLeads(): Promise<Lead[]> {
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_LEADS, null, 2), 'utf-8');
  return INITIAL_LEADS;
}
