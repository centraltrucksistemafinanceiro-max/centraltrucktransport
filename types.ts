
export interface Admin {
  id: string;
  name: string;
  password?: string; // Mantido para migração de dados existentes
  passwordHash?: string;
  salt?: string;
}

export interface Driver {
  id: string;
  name: string;
  cnh: string;
  phone: string;
  status: 'active' | 'inactive';
  password?: string; // Mantido para migração de dados existentes
  passwordHash?: string;
  salt?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  chassi: string;
  status: 'active' | 'inactive';
}

export enum ExpenseCategory {
  TOLL = 'Pedágio',
  FOOD = 'Alimentação',
  MAINTENANCE = 'Manutenção',
  LODGING = 'Hospedagem',
  OTHER = 'Outros',
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
}

export interface Fueling {
  id: string;
  station: string;
  date: string;
  km: number;
  liters: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
}

export enum TrechoStatus {
  CARREGADO = 'Carregado',
  VAZIO = 'Vazio',
}

export interface Trecho {
  id: string;
  status: TrechoStatus;
  kmInicial: number;
  kmFinal: number;
  observacoes?: string;
}

export interface Cargo {
  id: string;
  type: string;
  weight: number; // in tons
  pricePerTon: number;
  tax?: number;
}

export enum PaymentMethod {
  CASH = 'Dinheiro',
  PIX = 'PIX',
  CARD = 'Cartão',
  TRANSFER = 'Transferência',
  CHECK = 'Cheque',
  FREIGHT_LETTER = 'Carta Frete',
}

export enum ReceivedPaymentType {
    ADVANCE = 'Adiantamento',
    BALANCE = 'Saldo',
    TOLL_VOUCHER = 'Vale Pedágio',
    OTHER = 'Outros'
}

export interface ReceivedPayment {
    id: string;
    type: ReceivedPaymentType;
    method: PaymentMethod;
    amount: number;
    date: string;
}

export enum TripStatus {
  PLANNED = 'Planejada',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Finalizada',
}

export interface Trip {
  id: string;
  driverId: string;
  vehicleId: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  startKm: number;
  endKm: number;
  status: TripStatus;
  cargo: Cargo[];
  expenses: Expense[];
  fueling: Fueling[];
  trechos: Trecho[];
  driverCommissionRate: number; // percentage
  receivedPayments: ReceivedPayment[];
  signature?: {
    date: string;
    confirmed: boolean;
  };
  monthlyTripNumber?: number;
  createdAt: string;
}

// --- Tipagens para Despesas Fixas (por Motorista) ---

export enum FixedExpenseCategory {
    TIRES = 'Pneus',
    RETREADING = 'Recauchutagem',
    CONSORTIUM = 'Consórcio',
    UNION = 'Sindicato',
    ALIGNMENT_BALANCING = 'Alinhamento/Balanceamento',
    INSURANCE = 'Seguro',
    FORNECEDOR = 'Fornecedor',
    OTHER = 'Outros',
}

export interface FixedExpensePayment {
    id: string;
    date: string;
    amount: number;
}

export interface FixedExpense {
    id: string;
    vehicleId: string;
    description: string;
    category: FixedExpenseCategory;
    totalAmount: number;
    installments: number; // número de parcelas
    firstPaymentDate: string;
    payments: FixedExpensePayment[];
    createdAt: string;
}

// --- Novas Tipagens para Despesas de Oficina (por Veículo) ---

export interface WorkshopExpense {
    id: string;
    vehicleId: string;
    description: string;
    serviceDate: string;
    firstPaymentDate: string;
    totalAmount: number;
    installments: number;
    payments: FixedExpensePayment[]; // Reutilizando a mesma estrutura de pagamento
    createdAt: string;
}
