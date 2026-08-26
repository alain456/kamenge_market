import {
  User,
  Place,
  Merchant,
  Contract,
  DueDateInvoice,
  Payment,
  PaymentSlip,
  Dispute,
  AccountingAccount,
  AccountingEntry,
  DisbursementRequest,
  AuditLog,
  MarketSettings,
  Role,
} from '../types/domain';
import {
  mockUsers,
  mockZones,
  mockPlaces,
  mockMerchants,
  mockContracts,
  mockDueDates,
  mockPayments,
  mockPaymentSlips,
  mockDisputes,
  mockAccounts,
  mockEntries,
  mockDisbursements,
  mockAuditLogs,
  mockSettings,
  mockReminders,
} from '../data/mock-data';

// Helper to simulate network latency
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockApiService {
  // Users
  static async getUsers(): Promise<User[]> {
    await delay();
    return [...mockUsers];
  }

  static async getPayments(): Promise<Payment[]> {
    await delay();
    return [...mockPayments];
  }

  // Places
  static async getPlaces(): Promise<Place[]> {
    await delay();
    return [...mockPlaces];
  }

  static async updatePlaceStatus(id: string, newStatus: Place['status'], notes?: string): Promise<Place> {
    await delay();
    const place = mockPlaces.find((p) => p.id === id);
    if (!place) throw new Error('Place introuvable');
    const oldStatus = place.status;
    place.status = newStatus;
    if (notes) place.notes = notes;
    if (newStatus === 'LIBRE') {
      place.currentMerchantId = undefined;
      place.currentMerchantName = undefined;
      place.currentContractId = undefined;
      place.totalDue = 0;
    }
    
    // Log audit
    this.addAuditLog('Action Administrateur', `Emplacement ${place.code}`, oldStatus, newStatus, notes);
    return { ...place };
  }

  // Merchants
  static async getMerchants(): Promise<Merchant[]> {
    await delay();
    return [...mockMerchants];
  }

  static async getMerchantById(id: string): Promise<Merchant | undefined> {
    await delay();
    return mockMerchants.find((m) => m.id === id);
  }

  static async createMerchant(merchant: Omit<Merchant, 'id' | 'registeredAt' | 'lastActivity'>): Promise<Merchant> {
    await delay();
    const newMerchant: Merchant = {
      ...merchant,
      id: `m-${Date.now()}`,
      registeredAt: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toLocaleString('fr-FR'),
    };
    mockMerchants.unshift(newMerchant);
    this.addAuditLog('Nouveau Commerçant Créé', `Commerçant ${newMerchant.fullName}`, '-', 'ACTIF');
    return newMerchant;
  }

  // Contracts
  static async getContracts(): Promise<Contract[]> {
    await delay();
    return [...mockContracts];
  }

  static async createContract(contract: Omit<Contract, 'id' | 'code'>): Promise<Contract> {
    await delay();
    const newContract: Contract = {
      ...contract,
      id: `c-${Date.now()}`,
      code: `CTR-2026-${Math.floor(100 + Math.random() * 900)}`,
    };
    mockContracts.unshift(newContract);
    
    // Update target place to OCCUPE
    const place = mockPlaces.find((p) => p.id === contract.placeId);
    if (place) {
      place.status = 'OCCUPE';
      place.currentMerchantId = contract.merchantId;
      place.currentMerchantName = contract.merchantName;
      place.currentContractId = newContract.id;
    }

    this.addAuditLog('Nouveau Contrat Signé', `Contrat ${newContract.code}`, 'LIBRE', 'OCCUPE', `Place ${contract.placeCode}`);
    return newContract;
  }

  // Due Dates & Invoices
  static async getDueDates(): Promise<DueDateInvoice[]> {
    await delay();
    return [...mockDueDates];
  }

  static async generateMonthlyDueDates(period: string): Promise<number> {
    await delay(600);
    // Simulates generating due dates for all occupied places
    let createdCount = 0;
    const occupiedPlaces = mockPlaces.filter((p) => p.status === 'OCCUPE' && p.currentMerchantId);
    
    for (const place of occupiedPlaces) {
      const invoiceNum = `FAC-2026-${Math.floor(100 + Math.random() * 900)}`;
      const newInvoice: DueDateInvoice = {
        id: `i-${Date.now()}-${Math.random()}`,
        invoiceNumber: invoiceNum,
        period,
        merchantId: place.currentMerchantId!,
        merchantName: place.currentMerchantName!,
        placeCode: place.code,
        dueDate: '2026-09-05',
        amount: place.monthlyRent,
        paidAmount: 0,
        remainingAmount: place.monthlyRent,
        status: 'A_VENIR',
        penaltyAmount: 0,
        daysOverdue: 0,
      };
      mockDueDates.unshift(newInvoice);
      createdCount++;
    }

    this.addAuditLog('Génération Échéances Loyer', `Période ${period}`, '-', `${createdCount} factures créées`);
    return createdCount;
  }

  // Payment Slips Verification Workflow
  static async getPaymentSlips(): Promise<PaymentSlip[]> {
    await delay();
    return [...mockPaymentSlips];
  }

  static async verifyPaymentSlip(id: string, decision: 'APPROUVE' | 'REJETE', verifiedBy: string, comment?: string, rejectionReason?: string): Promise<PaymentSlip> {
    await delay();
    const slip = mockPaymentSlips.find((s) => s.id === id);
    if (!slip) throw new Error('Bordereau introuvable');

    slip.status = decision;
    slip.verifiedBy = verifiedBy;
    slip.verificationDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    slip.comment = comment;
    if (decision === 'REJETE') {
      if (!rejectionReason) throw new Error('Un motif de rejet est obligatoire');
      slip.rejectionReason = rejectionReason;
    } else {
      // If approved, update place status from PREUVE_EN_ATTENTE to OCCUPE
      const place = mockPlaces.find((p) => p.code === slip.placeCode);
      if (place && place.status === 'PREUVE_EN_ATTENTE') {
        place.status = 'OCCUPE';
      }
    }

    this.addAuditLog(`Bordereau ${decision === 'APPROUVE' ? 'Approuvé' : 'Rejeté'}`, `Bordereau ${slip.slipNumber}`, 'EN_ATTENTE', decision, comment || rejectionReason);
    return { ...slip };
  }

  // Disputes & Seal Procedure
  static async getDisputes(): Promise<Dispute[]> {
    await delay();
    return [...mockDisputes];
  }

  static async triggerSealProcedure(disputeId: string, placeId: string, adminNotes: string): Promise<void> {
    await delay();
    const dispute = mockDisputes.find((d) => d.id === disputeId);
    if (dispute) {
      dispute.status = 'Procédure Scellé';
    }
    const place = mockPlaces.find((p) => p.id === placeId);
    if (place) {
      place.status = 'SCELLE';
      place.notes = `SCELLE: ${adminNotes}`;
    }

    this.addAuditLog('Procédure de Scellé Déclenchée', `Emplacement ${place?.code || disputeId}`, 'IMPAYE', 'SCELLE', adminNotes);
  }

  // Accounting & Entries
  static async getAccounts(): Promise<AccountingAccount[]> {
    await delay();
    return [...mockAccounts];
  }

  static async getEntries(): Promise<AccountingEntry[]> {
    await delay();
    return [...mockEntries];
  }

  static async createAccountingEntry(entry: Omit<AccountingEntry, 'id' | 'isBalanced' | 'status'>): Promise<AccountingEntry> {
    await delay();
    if (entry.totalDebit !== entry.totalCredit) {
      throw new Error(`Écriture non équilibrée: Écart de ${Math.abs(entry.totalDebit - entry.totalCredit)} BIF. La règle de partie double exige Total Débit === Total Crédit.`);
    }

    const newEntry: AccountingEntry = {
      ...entry,
      id: `ent-${Date.now()}`,
      isBalanced: true,
      status: 'VALIDE',
    };
    mockEntries.unshift(newEntry);
    this.addAuditLog('Pièce Comptable Validée', `Pièce ${newEntry.entryNumber}`, 'BROUILLON', 'VALIDE', entry.label);
    return newEntry;
  }

  // Disbursements Workflow
  static async getDisbursements(): Promise<DisbursementRequest[]> {
    await delay();
    return [...mockDisbursements];
  }

  static async updateDisbursementStatus(id: string, newStatus: DisbursementRequest['status'], user: User, rejectionReason?: string): Promise<DisbursementRequest> {
    await delay();
    const disb = mockDisbursements.find((d) => d.id === id);
    if (!disb) throw new Error('Demande introuvable');

    const oldStatus = disb.status;
    disb.status = newStatus;

    if (newStatus === 'Validé') disb.validatedBy = user.name;
    if (newStatus === 'Confirmé') disb.confirmedBy = user.name;
    if (newStatus === 'Approuvé') disb.approvedBy = user.name;
    if (newStatus === 'Rejeté') {
      if (!rejectionReason) throw new Error('Un motif est obligatoire pour rejeter une demande de décaissement');
      disb.rejectionReason = rejectionReason;
    }

    this.addAuditLog(`Décaissement ${newStatus}`, `Demande ${disb.requestNumber}`, oldStatus, newStatus);
    return { ...disb };
  }

  // Audit Log
  static async getAuditLogs(): Promise<AuditLog[]> {
    await delay();
    return [...mockAuditLogs];
  }

  private static addAuditLog(action: string, resource: string, oldStatus?: string, newStatus?: string, details?: string) {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: 'u-1',
      userName: 'Jonson Ndayishimiye',
      userRole: 'ADMIN',
      action,
      resource,
      oldStatus,
      newStatus,
      timestamp: new Date().toLocaleString('fr-FR'),
      ipAddress: '197.239.12.44',
      details,
    };
    mockAuditLogs.unshift(newLog);
  }
}
