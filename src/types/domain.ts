export type Role = 
  | 'ADMIN' 
  | 'AGENT' 
  | 'MERCHANT';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar?: string;
  status: 'ACTIF' | 'INACTIF';
  lastLogin: string;
}

export interface Zone {
  id: string;
  code: string;
  name: string;
  description: string;
  totalPlaces: number;
}

export type PlaceType = 'Boutique' | 'Kiosque' | 'Stand';

export type PlaceStatus = 
  | 'LIBRE' 
  | 'OCCUPE' 
  | 'PREUVE_EN_ATTENTE' 
  | 'IMPAYE' 
  | 'MAINTENANCE' 
  | 'SCELLE';

export interface Place {
  id: string;
  code: string; // e.g. MALL-N1-B05
  zoneId: string;
  zoneName: string;
  type: PlaceType;
  surfaceM2: number;
  monthlyRent: number; // in BIF
  status: PlaceStatus;
  currentMerchantId?: string;
  currentMerchantName?: string;
  currentContractId?: string;
  lastDueDate?: string;
  totalDue?: number;
  notes?: string;
}

export interface Merchant {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  identityCardNumber: string;
  assignedPlaceCode?: string;
  assignedPlaceId?: string;
  status: 'ACTIF' | 'EN_LITIGE' | 'INACTIF';
  amountDue: number; // total arrears in BIF
  lastActivity: string;
  registeredAt: string;
  photoUrl?: string;
}

export type ContractStatus = 'ACTIF' | 'RESILIE' | 'EN_LITIGE';

export interface Contract {
  id: string;
  code: string;
  merchantId: string;
  merchantName: string;
  placeId: string;
  placeCode: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositMonths: number;
  depositAmount: number; // depositMonths * monthlyRent
  periodicity: 'Mensuel' | 'Trimestriel' | 'Annuel';
  status: ContractStatus;
  subleaseAllowed: boolean; // default false
  notes?: string;
}

export type InvoiceStatus = 'A_VENIR' | 'PAYEE' | 'PARTIELLEMENT_PAYEE' | 'IMPAYEE' | 'EN_RETARD';

export interface DueDateInvoice {
  id: string;
  invoiceNumber: string;
  period: string; // e.g. "Août 2026"
  merchantId: string;
  merchantName: string;
  placeCode: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  penaltyAmount: number; // 5% if overdue
  daysOverdue: number;
}

export type PaymentMethod = 'Virement' | 'Mobile Money' | 'Espèces';
export type PaymentStatus = 'EN_ATTENTE' | 'CONFIRME' | 'REJETE';

export interface Payment {
  id: string;
  date: string;
  merchantId: string;
  merchantName: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  status: PaymentStatus;
  agentName: string;
  receiptUrl?: string;
}

export type SlipStatus = 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';

export interface PaymentSlip {
  id: string;
  slipNumber: string;
  merchantId: string;
  merchantName: string;
  placeCode: string;
  submissionDate: string;
  declaredAmount: number;
  expectedAmount: number;
  method: PaymentMethod;
  fileName: string;
  fileSize: string;
  filePreviewUrl?: string;
  status: SlipStatus;
  verifiedBy?: string;
  verificationDate?: string;
  rejectionReason?: string;
  comment?: string;
}

export type DisputeRisk = 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE';

export interface Dispute {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantPhone: string;
  placeId: string;
  placeCode: string;
  unpaidMonthsCount: number;
  baseRentTotal: number;
  penaltiesTotal: number;
  totalDue: number;
  lastReminderDate: string;
  riskLevel: DisputeRisk;
  status: 'Dossier Ouvert' | 'Relance J-5' | 'Mise en demeure' | 'Procédure Scellé' | 'Régularisé';
}

export interface ReminderHistoryItem {
  id: string;
  disputeId: string;
  type: 'Rappel J-5' | 'Retard fin de mois' | 'Mise en demeure' | 'Manuel';
  channel: 'SMS' | 'Email';
  destination: string;
  status: 'Envoyé' | 'Échec';
  sentAt: string;
  content: string;
}

export interface AccountingAccount {
  id: string;
  code: string;
  name: string;
  accountClass: number; // 1 to 7
  category: string;
  balance: number;
}

export interface AccountingEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  costCenterId?: string;
  costCenterName?: string;
  comment?: string;
}

export interface AccountingEntry {
  id: string;
  entryNumber: string;
  date: string;
  documentRef: string;
  label: string;
  lines: AccountingEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  status: 'BROUILLON' | 'VALIDE' | 'EXTOURNE';
  createdBy: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  budget: number;
  spent: number;
}

export type DisbursementStatus = 
  | 'Brouillon' 
  | 'Validé' 
  | 'Confirmé' 
  | 'Approuvé' 
  | 'Écriture Générée' 
  | 'Rejeté';

export interface DisbursementRequest {
  id: string;
  requestNumber: string;
  applicantName: string;
  applicantRole: Role;
  costCenterName: string;
  amount: number;
  purpose: string;
  status: DisbursementStatus;
  createdAt: string;
  validatedBy?: string;
  confirmedBy?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  resource: string;
  oldStatus?: string;
  newStatus?: string;
  timestamp: string;
  ipAddress: string;
  details?: string;
}

export interface MarketSettings {
  name: string;
  city: string;
  currency: string;
  penaltyRatePercent: number; // e.g. 5%
  billingDayOfMonth: number; // e.g. 1st
  gracePeriodDays: number; // e.g. 5 days
  decimalPrecision: number;
  smsNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
}
