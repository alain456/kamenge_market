import {
  User,
  Zone,
  Place,
  Merchant,
  Contract,
  DueDateInvoice,
  Payment,
  PaymentSlip,
  Dispute,
  ReminderHistoryItem,
  AccountingAccount,
  AccountingEntry,
  CostCenter,
  DisbursementRequest,
  AuditLog,
  MarketSettings,
} from '../types/domain';

export const mockUsers: User[] = [
  {
    id: 'u-1',
    name: 'Jonson Ndayishimiye (Admin)',
    email: 'admin@kamenge-mall.bi',
    phone: '+257 79 123 456',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIF',
    lastLogin: '2026-08-26 10:15',
  },
  {
    id: 'u-2',
    name: 'Marc Nkurunziza (Agent)',
    email: 'agent@kamenge-mall.bi',
    phone: '+257 71 987 654',
    role: 'AGENT',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIF',
    lastLogin: '2026-08-26 09:30',
  },
  {
    id: 'm-3', // Note: Using the merchant ID from mockMerchants to link them
    name: 'Gérard Bizimana (Commerçant)',
    email: 'commercant@kamenge-mall.bi',
    phone: '+257 71 555 666',
    role: 'MERCHANT',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIF',
    lastLogin: '2026-08-26 10:00',
  },
];

export const mockZones: Zone[] = [
  { id: 'z-1', code: 'Z-BLOC-A', name: 'Zone Commerciale Bloc A', description: 'Boutiques principales rez-de-chaussée et étage 1', totalPlaces: 24 },
  { id: 'z-2', code: 'Z-BLOC-B', name: 'Zone Commerciale Bloc B', description: 'Zone alimentation et textiles grossistes', totalPlaces: 18 },
  { id: 'z-3', code: 'Z-PARKING', name: 'Parking & Abord', description: 'Kiosques externes et stands événementiels', totalPlaces: 12 },
  { id: 'z-4', code: 'Z-SEC', name: 'Sécurité & Services', description: 'Postes de garde et locaux techniques', totalPlaces: 6 },
  { id: 'z-5', code: 'Z-NET', name: 'Service Nettoyage', description: 'Dépôts et magasins de maintenance', totalPlaces: 4 },
  { id: 'z-6', code: 'Z-ADM', name: 'Administration', description: 'Bureaux administratifs et salles de réunion', totalPlaces: 8 },
];

export const mockPlaces: Place[] = [
  // Bloc A
  { id: 'p-1', code: 'MALL-N1-A01', zoneId: 'z-1', zoneName: 'Zone Commerciale Bloc A', type: 'Boutique', surfaceM2: 35, monthlyRent: 450000, status: 'OCCUPE', currentMerchantId: 'm-1', currentMerchantName: 'Jean-Pierre Mugisha', currentContractId: 'c-1', lastDueDate: '2026-08-01', totalDue: 0 },
  { id: 'p-2', code: 'MALL-N1-A02', zoneId: 'z-1', zoneName: 'Zone Commerciale Bloc A', type: 'Boutique', surfaceM2: 28, monthlyRent: 380000, status: 'OCCUPE', currentMerchantId: 'm-2', currentMerchantName: 'Aline Irakoze', currentContractId: 'c-2', lastDueDate: '2026-08-01', totalDue: 0 },
  { id: 'p-3', code: 'MALL-N1-A03', zoneId: 'z-1', zoneName: 'Zone Commerciale Bloc A', type: 'Boutique', surfaceM2: 40, monthlyRent: 500000, status: 'IMPAYE', currentMerchantId: 'm-3', currentMerchantName: 'Gérard Bizimana', currentContractId: 'c-3', lastDueDate: '2026-06-01', totalDue: 1575000, notes: '3 mois d’arriérés + pénalités 5%' },
  { id: 'p-4', code: 'MALL-N1-A04', zoneId: 'z-1', zoneName: 'Zone Commerciale Bloc A', type: 'Boutique', surfaceM2: 30, monthlyRent: 400000, status: 'PREUVE_EN_ATTENTE', currentMerchantId: 'm-4', currentMerchantName: 'Belyse Uwimana', currentContractId: 'c-4', lastDueDate: '2026-08-01', totalDue: 400000, notes: 'Bordereau versé hier en attente de validation' },
  { id: 'p-5', code: 'MALL-N1-A05', zoneId: 'z-1', zoneName: 'Zone Commerciale Bloc A', type: 'Boutique', surfaceM2: 25, monthlyRent: 350000, status: 'LIBRE' },
  { id: 'p-6', code: 'MALL-N1-A06', zoneId: 'z-1', zoneName: 'Zone Commerciale Bloc A', type: 'Boutique', surfaceM2: 32, monthlyRent: 420000, status: 'SCELLE', currentMerchantId: 'm-5', currentMerchantName: 'Elias Ndayishimiye', currentContractId: 'c-5', lastDueDate: '2026-04-01', totalDue: 2100000, notes: 'Fermeture et scellé suite à mise en demeure infructueuse' },
  
  // Bloc B
  { id: 'p-7', code: 'MALL-N1-B01', zoneId: 'z-2', zoneName: 'Zone Commerciale Bloc B', type: 'Boutique', surfaceM2: 22, monthlyRent: 300000, status: 'OCCUPE', currentMerchantId: 'm-6', currentMerchantName: 'Clara Niyonzima', currentContractId: 'c-6', lastDueDate: '2026-08-01', totalDue: 0 },
  { id: 'p-8', code: 'MALL-N1-B02', zoneId: 'z-2', zoneName: 'Zone Commerciale Bloc B', type: 'Kiosque', surfaceM2: 12, monthlyRent: 180000, status: 'MAINTENANCE', notes: 'Rénovation électrique du kiosque en cours' },
  { id: 'p-9', code: 'MALL-N1-B03', zoneId: 'z-2', zoneName: 'Zone Commerciale Bloc B', type: 'Kiosque', surfaceM2: 15, monthlyRent: 200000, status: 'LIBRE' },
  { id: 'p-10', code: 'MALL-N1-B04', zoneId: 'z-2', zoneName: 'Zone Commerciale Bloc B', type: 'Stand', surfaceM2: 10, monthlyRent: 150000, status: 'OCCUPE', currentMerchantId: 'm-7', currentMerchantName: 'Fabrice Kwizera', currentContractId: 'c-7', lastDueDate: '2026-08-01', totalDue: 0 },
  { id: 'p-11', code: 'MALL-N1-B05', zoneId: 'z-2', zoneName: 'Zone Commerciale Bloc B', type: 'Boutique', surfaceM2: 30, monthlyRent: 390000, status: 'IMPAYE', currentMerchantId: 'm-8', currentMerchantName: 'Patrick Harerimana', currentContractId: 'c-8', lastDueDate: '2026-07-01', totalDue: 819000 },
  { id: 'p-12', code: 'MALL-N1-B06', zoneId: 'z-2', zoneName: 'Zone Commerciale Bloc B', type: 'Boutique', surfaceM2: 26, monthlyRent: 340000, status: 'LIBRE' },

  // Parking
  { id: 'p-13', code: 'MALL-PKG-K01', zoneId: 'z-3', zoneName: 'Parking & Abord', type: 'Kiosque', surfaceM2: 14, monthlyRent: 220000, status: 'OCCUPE', currentMerchantId: 'm-9', currentMerchantName: 'Désiré Nshimirimana', currentContractId: 'c-9', lastDueDate: '2026-08-01', totalDue: 0 },
  { id: 'p-14', code: 'MALL-PKG-S01', zoneId: 'z-3', zoneName: 'Parking & Abord', type: 'Stand', surfaceM2: 18, monthlyRent: 250000, status: 'LIBRE' },
];

export const mockMerchants: Merchant[] = [
  { id: 'm-1', fullName: 'Jean-Pierre Mugisha', phone: '+257 79 111 222', email: 'jp.mugisha@gmail.com', identityCardNumber: '110/2018/BUJ', assignedPlaceCode: 'MALL-N1-A01', assignedPlaceId: 'p-1', status: 'ACTIF', amountDue: 0, lastActivity: '2026-08-05 14:30', registeredAt: '2024-01-15' },
  { id: 'm-2', fullName: 'Aline Irakoze', phone: '+257 76 333 444', email: 'aline.irakoze@yahoo.fr', identityCardNumber: '115/2019/BUJ', assignedPlaceCode: 'MALL-N1-A02', assignedPlaceId: 'p-2', status: 'ACTIF', amountDue: 0, lastActivity: '2026-08-10 11:15', registeredAt: '2024-03-01' },
  { id: 'm-3', fullName: 'Gérard Bizimana', phone: '+257 71 555 666', email: 'gerard.bizimana@outlook.com', identityCardNumber: '120/2017/BUJ', assignedPlaceCode: 'MALL-N1-A03', assignedPlaceId: 'p-3', status: 'EN_LITIGE', amountDue: 1575000, lastActivity: '2026-07-20 09:00', registeredAt: '2023-06-10' },
  { id: 'm-4', fullName: 'Belyse Uwimana', phone: '+257 75 777 888', email: 'belyse.uwimana@gmail.com', identityCardNumber: '128/2020/BUJ', assignedPlaceCode: 'MALL-N1-A04', assignedPlaceId: 'p-4', status: 'ACTIF', amountDue: 400000, lastActivity: '2026-08-25 16:45', registeredAt: '2024-05-12' },
  { id: 'm-5', fullName: 'Elias Ndayishimiye', phone: '+257 78 999 000', email: 'elias.ndayishimiye@hot.fr', identityCardNumber: '098/2015/BUJ', assignedPlaceCode: 'MALL-N1-A06', assignedPlaceId: 'p-6', status: 'EN_LITIGE', amountDue: 2100000, lastActivity: '2026-05-10 10:00', registeredAt: '2022-11-20' },
  { id: 'm-6', fullName: 'Clara Niyonzima', phone: '+257 79 444 111', email: 'clara.niyonzima@gmail.com', identityCardNumber: '133/2021/BUJ', assignedPlaceCode: 'MALL-N1-B01', assignedPlaceId: 'p-7', status: 'ACTIF', amountDue: 0, lastActivity: '2026-08-02 08:30', registeredAt: '2024-02-18' },
  { id: 'm-7', fullName: 'Fabrice Kwizera', phone: '+257 71 222 333', email: 'fabrice.kwizera@gmail.com', identityCardNumber: '140/2022/BUJ', assignedPlaceCode: 'MALL-N1-B04', assignedPlaceId: 'p-10', status: 'ACTIF', amountDue: 0, lastActivity: '2026-08-04 15:10', registeredAt: '2024-06-01' },
  { id: 'm-8', fullName: 'Patrick Harerimana', phone: '+257 76 888 999', email: 'p.harerimana@gmail.com', identityCardNumber: '105/2016/BUJ', assignedPlaceCode: 'MALL-N1-B05', assignedPlaceId: 'p-11', status: 'EN_LITIGE', amountDue: 819000, lastActivity: '2026-08-01 12:00', registeredAt: '2023-09-15' },
  { id: 'm-9', fullName: 'Désiré Nshimirimana', phone: '+257 75 111 999', email: 'desire.nsh@gmail.com', identityCardNumber: '142/2023/BUJ', assignedPlaceCode: 'MALL-PKG-K01', assignedPlaceId: 'p-13', status: 'ACTIF', amountDue: 0, lastActivity: '2026-08-03 10:20', registeredAt: '2024-04-10' },
];

export const mockContracts: Contract[] = [
  { id: 'c-1', code: 'CTR-2024-001', merchantId: 'm-1', merchantName: 'Jean-Pierre Mugisha', placeId: 'p-1', placeCode: 'MALL-N1-A01', startDate: '2024-01-15', endDate: '2027-01-14', monthlyRent: 450000, depositMonths: 3, depositAmount: 1350000, periodicity: 'Mensuel', status: 'ACTIF', subleaseAllowed: false, notes: 'Boutique d’habillement de marque' },
  { id: 'c-2', code: 'CTR-2024-002', merchantId: 'm-2', merchantName: 'Aline Irakoze', placeId: 'p-2', placeCode: 'MALL-N1-A02', startDate: '2024-03-01', endDate: '2026-02-28', monthlyRent: 380000, depositMonths: 2, depositAmount: 760000, periodicity: 'Mensuel', status: 'ACTIF', subleaseAllowed: false, notes: 'Salon de coiffure et cosmétiques' },
  { id: 'c-3', code: 'CTR-2023-045', merchantId: 'm-3', merchantName: 'Gérard Bizimana', placeId: 'p-3', placeCode: 'MALL-N1-A03', startDate: '2023-06-10', endDate: '2025-06-09', monthlyRent: 500000, depositMonths: 3, depositAmount: 1500000, periodicity: 'Mensuel', status: 'EN_LITIGE', subleaseAllowed: false, notes: 'Magasin d’électronique' },
  { id: 'c-4', code: 'CTR-2024-012', merchantId: 'm-4', merchantName: 'Belyse Uwimana', placeId: 'p-4', placeCode: 'MALL-N1-A04', startDate: '2024-05-12', endDate: '2027-05-11', monthlyRent: 400000, depositMonths: 3, depositAmount: 1200000, periodicity: 'Mensuel', status: 'ACTIF', subleaseAllowed: false, notes: 'Boutique de chaussures' },
  { id: 'c-5', code: 'CTR-2022-088', merchantId: 'm-5', merchantName: 'Elias Ndayishimiye', placeId: 'p-6', placeCode: 'MALL-N1-A06', startDate: '2022-11-20', endDate: '2025-11-19', monthlyRent: 420000, depositMonths: 3, depositAmount: 1260000, periodicity: 'Mensuel', status: 'EN_LITIGE', subleaseAllowed: false, notes: 'Vente de matériel informatique' },
  { id: 'c-6', code: 'CTR-2024-008', merchantId: 'm-6', merchantName: 'Clara Niyonzima', placeId: 'p-7', placeCode: 'MALL-N1-B01', startDate: '2024-02-18', endDate: '2027-02-17', monthlyRent: 300000, depositMonths: 2, depositAmount: 600000, periodicity: 'Mensuel', status: 'ACTIF', subleaseAllowed: false, notes: 'Superette alimentation générale' },
  { id: 'c-7', code: 'CTR-2024-020', merchantId: 'm-7', merchantName: 'Fabrice Kwizera', placeId: 'p-10', placeCode: 'MALL-N1-B04', startDate: '2024-06-01', endDate: '2025-05-31', monthlyRent: 150000, depositMonths: 2, depositAmount: 300000, periodicity: 'Mensuel', status: 'ACTIF', subleaseAllowed: false, notes: 'Stand accessoires téléphoniques' },
  { id: 'c-8', code: 'CTR-2023-077', merchantId: 'm-8', merchantName: 'Patrick Harerimana', placeId: 'p-11', placeCode: 'MALL-N1-B05', startDate: '2023-09-15', endDate: '2026-09-14', monthlyRent: 390000, depositMonths: 3, depositAmount: 1170000, periodicity: 'Mensuel', status: 'EN_LITIGE', subleaseAllowed: false, notes: 'Quincaillerie du marché' },
  { id: 'c-9', code: 'CTR-2024-015', merchantId: 'm-9', merchantName: 'Désiré Nshimirimana', placeId: 'p-13', placeCode: 'MALL-PKG-K01', startDate: '2024-04-10', endDate: '2026-04-09', monthlyRent: 220000, depositMonths: 2, depositAmount: 440000, periodicity: 'Mensuel', status: 'ACTIF', subleaseAllowed: false, notes: 'Kiosque transfert d’argent & Mobile Money' },
];

export const mockDueDates: DueDateInvoice[] = [
  { id: 'i-1', invoiceNumber: 'FAC-2026-08-001', period: 'Août 2026', merchantId: 'm-1', merchantName: 'Jean-Pierre Mugisha', placeCode: 'MALL-N1-A01', dueDate: '2026-08-05', amount: 450000, paidAmount: 450000, remainingAmount: 0, status: 'PAYEE', penaltyAmount: 0, daysOverdue: 0 },
  { id: 'i-2', invoiceNumber: 'FAC-2026-08-002', period: 'Août 2026', merchantId: 'm-2', merchantName: 'Aline Irakoze', placeCode: 'MALL-N1-A02', dueDate: '2026-08-05', amount: 380000, paidAmount: 380000, remainingAmount: 0, status: 'PAYEE', penaltyAmount: 0, daysOverdue: 0 },
  { id: 'i-3', invoiceNumber: 'FAC-2026-08-003', period: 'Août 2026', merchantId: 'm-3', merchantName: 'Gérard Bizimana', placeCode: 'MALL-N1-A03', dueDate: '2026-08-05', amount: 500000, paidAmount: 0, remainingAmount: 500000, status: 'EN_RETARD', penaltyAmount: 25000, daysOverdue: 21 },
  { id: 'i-4', invoiceNumber: 'FAC-2026-07-003', period: 'Juillet 2026', merchantId: 'm-3', merchantName: 'Gérard Bizimana', placeCode: 'MALL-N1-A03', dueDate: '2026-07-05', amount: 500000, paidAmount: 0, remainingAmount: 500000, status: 'EN_RETARD', penaltyAmount: 25000, daysOverdue: 52 },
  { id: 'i-5', invoiceNumber: 'FAC-2026-06-003', period: 'Juin 2026', merchantId: 'm-3', merchantName: 'Gérard Bizimana', placeCode: 'MALL-N1-A03', dueDate: '2026-06-05', amount: 500000, paidAmount: 0, remainingAmount: 500000, status: 'EN_RETARD', penaltyAmount: 25000, daysOverdue: 82 },
  { id: 'i-6', invoiceNumber: 'FAC-2026-08-004', period: 'Août 2026', merchantId: 'm-4', merchantName: 'Belyse Uwimana', placeCode: 'MALL-N1-A04', dueDate: '2026-08-05', amount: 400000, paidAmount: 0, remainingAmount: 400000, status: 'PARTIELLEMENT_PAYEE', penaltyAmount: 0, daysOverdue: 0 },
  { id: 'i-7', invoiceNumber: 'FAC-2026-08-008', period: 'Août 2026', merchantId: 'm-8', merchantName: 'Patrick Harerimana', placeCode: 'MALL-N1-B05', dueDate: '2026-08-05', amount: 390000, paidAmount: 0, remainingAmount: 390000, status: 'EN_RETARD', penaltyAmount: 19500, daysOverdue: 21 },
  { id: 'i-8', invoiceNumber: 'FAC-2026-07-008', period: 'Juillet 2026', merchantId: 'm-8', merchantName: 'Patrick Harerimana', placeCode: 'MALL-N1-B05', dueDate: '2026-07-05', amount: 390000, paidAmount: 0, remainingAmount: 390000, status: 'EN_RETARD', penaltyAmount: 19500, daysOverdue: 52 },
];

export const mockPayments: Payment[] = [
  { id: 'pay-1', date: '2026-08-02 10:15', merchantId: 'm-1', merchantName: 'Jean-Pierre Mugisha', invoiceId: 'i-1', invoiceNumber: 'FAC-2026-08-001', amount: 450000, method: 'Virement', reference: 'VIR-BCB-987410', status: 'CONFIRME', agentName: 'Marie Nsabimana' },
  { id: 'pay-2', date: '2026-08-04 14:00', merchantId: 'm-2', merchantName: 'Aline Irakoze', invoiceId: 'i-2', invoiceNumber: 'FAC-2026-08-002', amount: 380000, method: 'Mobile Money', reference: 'LUMICASH-554210', status: 'CONFIRME', agentName: 'Marc Nkurunziza' },
  { id: 'pay-3', date: '2026-08-03 09:30', merchantId: 'm-6', merchantName: 'Clara Niyonzima', invoiceId: 'i-9', invoiceNumber: 'FAC-2026-08-006', amount: 300000, method: 'Espèces', reference: 'REC-MK-00245', status: 'CONFIRME', agentName: 'Marc Nkurunziza' },
  { id: 'pay-4', date: '2026-08-05 11:20', merchantId: 'm-7', merchantName: 'Fabrice Kwizera', invoiceId: 'i-10', invoiceNumber: 'FAC-2026-08-007', amount: 150000, method: 'Mobile Money', reference: 'ECOCASH-887412', status: 'CONFIRME', agentName: 'Marie Nsabimana' },
];

export const mockPaymentSlips: PaymentSlip[] = [
  {
    id: 'slip-1',
    slipNumber: 'BOR-2026-08-014',
    merchantId: 'm-4',
    merchantName: 'Belyse Uwimana',
    placeCode: 'MALL-N1-A04',
    submissionDate: '2026-08-25 15:30',
    declaredAmount: 400000,
    expectedAmount: 400000,
    method: 'Virement',
    fileName: 'Bordereau_Virement_Interbank_Belyse.pdf',
    fileSize: '1.2 MB',
    filePreviewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    status: 'EN_ATTENTE',
    comment: 'Paiement effectué au guichet Interbank Bujumbura',
  },
  {
    id: 'slip-2',
    slipNumber: 'BOR-2026-08-011',
    merchantId: 'm-9',
    merchantName: 'Désiré Nshimirimana',
    placeCode: 'MALL-PKG-K01',
    submissionDate: '2026-08-24 10:15',
    declaredAmount: 220000,
    expectedAmount: 220000,
    method: 'Mobile Money',
    fileName: 'Capture_Ecocash_Desire.png',
    fileSize: '450 KB',
    filePreviewUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
    status: 'APPROUVE',
    verifiedBy: 'Marie Nsabimana',
    verificationDate: '2026-08-24 11:00',
    comment: 'Numéro de transaction Ecocash vérifié avec le relevé bancaire',
  },
  {
    id: 'slip-3',
    slipNumber: 'BOR-2026-08-005',
    merchantId: 'm-3',
    merchantName: 'Gérard Bizimana',
    placeCode: 'MALL-N1-A03',
    submissionDate: '2026-08-20 16:00',
    declaredAmount: 300000,
    expectedAmount: 1575000,
    method: 'Virement',
    fileName: 'Recu_Banque_Incomplet.pdf',
    fileSize: '890 KB',
    filePreviewUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=80',
    status: 'REJETE',
    verifiedBy: 'Egide Hakizimana',
    verificationDate: '2026-08-21 09:30',
    rejectionReason: 'Montant versé partiel non conforme au décompte des arriérés d’échéances et de pénalités de retard',
  },
];

export const mockDisputes: Dispute[] = [
  {
    id: 'dis-1',
    merchantId: 'm-5',
    merchantName: 'Elias Ndayishimiye',
    merchantPhone: '+257 78 999 000',
    placeId: 'p-6',
    placeCode: 'MALL-N1-A06',
    unpaidMonthsCount: 5,
    baseRentTotal: 2000000,
    penaltiesTotal: 100000,
    totalDue: 2100000,
    lastReminderDate: '2026-08-15',
    riskLevel: 'CRITIQUE',
    status: 'Procédure Scellé',
  },
  {
    id: 'dis-2',
    merchantId: 'm-3',
    merchantName: 'Gérard Bizimana',
    merchantPhone: '+257 71 555 666',
    placeId: 'p-3',
    placeCode: 'MALL-N1-A03',
    unpaidMonthsCount: 3,
    baseRentTotal: 1500000,
    penaltiesTotal: 75000,
    totalDue: 1575000,
    lastReminderDate: '2026-08-22',
    riskLevel: 'ELEVE',
    status: 'Mise en demeure',
  },
  {
    id: 'dis-3',
    merchantId: 'm-8',
    merchantName: 'Patrick Harerimana',
    merchantPhone: '+257 76 888 999',
    placeId: 'p-11',
    placeCode: 'MALL-N1-B05',
    unpaidMonthsCount: 2,
    baseRentTotal: 780000,
    penaltiesTotal: 39000,
    totalDue: 819000,
    lastReminderDate: '2026-08-20',
    riskLevel: 'MOYEN',
    status: 'Relance J-5',
  },
];

export const mockReminders: ReminderHistoryItem[] = [
  {
    id: 'rem-1',
    disputeId: 'dis-2',
    type: 'Rappel J-5',
    channel: 'SMS',
    destination: '+257 71 555 666',
    status: 'Envoyé',
    sentAt: '2026-08-10 09:00',
    content: 'Mall Kamenge: Votre loyer du mois de Juillet 2026 d’un montant de 500 000 BIF est à payer avant le 15. Merci de régulariser.',
  },
  {
    id: 'rem-2',
    disputeId: 'dis-2',
    type: 'Retard fin de mois',
    channel: 'Email',
    destination: 'gerard.bizimana@outlook.com',
    status: 'Envoyé',
    sentAt: '2026-08-18 14:20',
    content: 'AVIS DE RETARD: Votre facture concernant l’emplacement MALL-N1-A03 présente un impayé cumulé. Une pénalité de 5% a été appliquée.',
  },
  {
    id: 'rem-3',
    disputeId: 'dis-2',
    type: 'Mise en demeure',
    channel: 'SMS',
    destination: '+257 71 555 666',
    status: 'Envoyé',
    sentAt: '2026-08-22 10:00',
    content: 'MISE EN DEMEURE ULTIME: Veuillez solder 1 575 000 BIF sous 48h au guichet du Mall Kamenge sous peine de fermeture immédiate et scellé de la boutique.',
  },
];

export const mockAccounts: AccountingAccount[] = [
  { id: 'acc-1', code: '101000', name: 'Capital social Mall Kamenge', accountClass: 1, category: 'Capitaux', balance: 500000000 },
  { id: 'acc-2', code: '411100', name: 'Clients - Commerçants Locataires', accountClass: 4, category: 'Tiers', balance: 4494000 },
  { id: 'acc-3', code: '512100', name: 'Banque Commerciale du Burundi (BCB)', accountClass: 5, category: 'Trésorerie', balance: 148500000 },
  { id: 'acc-4', code: '512200', name: 'Banque Interbank Burundi (IBB)', accountClass: 5, category: 'Trésorerie', balance: 89000000 },
  { id: 'acc-5', code: '531100', name: 'Caisse Principale Mall', accountClass: 5, category: 'Trésorerie', balance: 12400000 },
  { id: 'acc-6', code: '706100', name: 'Produits des Loyers - Boutiques Bloc A', accountClass: 7, category: 'Produits', balance: 38400000 },
  { id: 'acc-7', code: '706200', name: 'Produits des Loyers - Kiosques & Stands', accountClass: 7, category: 'Produits', balance: 14200000 },
  { id: 'acc-8', code: '707100', name: 'Produits des Pénalités de Retard', accountClass: 7, category: 'Produits', balance: 1250000 },
];

export const mockEntries: AccountingEntry[] = [
  {
    id: 'ent-1',
    entryNumber: 'ECR-2026-08-001',
    date: '2026-08-01',
    documentRef: 'LOYERS-AUG-2026',
    label: 'Génération automatique des échéances de loyers août 2026',
    lines: [
      { id: 'l-1', accountId: 'acc-2', accountCode: '411100', accountName: 'Clients - Commerçants Locataires', debit: 4494000, credit: 0, comment: 'Échéances août' },
      { id: 'l-2', accountId: 'acc-6', accountCode: '706100', accountName: 'Produits des Loyers - Boutiques Bloc A', debit: 0, credit: 3270000, comment: 'Loyers boutiques' },
      { id: 'l-3', accountId: 'acc-7', accountCode: '707100', accountName: 'Produits des Loyers - Kiosques & Stands', debit: 0, credit: 1224000, comment: 'Loyers kiosques' },
    ],
    totalDebit: 4494000,
    totalCredit: 4494000,
    isBalanced: true,
    status: 'VALIDE',
    createdBy: 'Marie Nsabimana',
  },
];

export const mockCostCenters: CostCenter[] = [
  { id: 'cc-1', code: 'CC-ADM', name: 'Administration Générale', budget: 15000000, spent: 4200000 },
  { id: 'cc-2', code: 'CC-SEC', name: 'Sécurité & Gardiennage', budget: 8000000, spent: 3100000 },
  { id: 'cc-3', code: 'CC-NET', name: 'Salubrité & Nettoyage', budget: 6000000, spent: 2400000 },
  { id: 'cc-4', code: 'CC-MAINT', name: 'Maintenance & Électricité', budget: 12000000, spent: 6800000 },
];

export const mockDisbursements: DisbursementRequest[] = [
  {
    id: 'disb-1',
    requestNumber: 'DEC-2026-08-005',
    applicantName: 'Marc Nkurunziza',
    applicantRole: 'AGENT',
    costCenterName: 'Maintenance & Électricité',
    amount: 850000,
    purpose: 'Achat d’un disjoncteur général et câblage armoire électrique Bloc B',
    status: 'Confirmé',
    createdAt: '2026-08-24 11:30',
    validatedBy: 'Marie Nsabimana',
    confirmedBy: 'Egide Hakizimana',
  },
  {
    id: 'disb-2',
    requestNumber: 'DEC-2026-08-002',
    applicantName: 'Jonson Ndayishimiye',
    applicantRole: 'ADMIN',
    costCenterName: 'Salubrité & Nettoyage',
    amount: 1400000,
    purpose: 'Fourniture mensuelle de produits désinfectants et contenants à déchets',
    status: 'Écriture Générée',
    createdAt: '2026-08-15 09:00',
    validatedBy: 'Marie Nsabimana',
    confirmedBy: 'Egide Hakizimana',
    approvedBy: 'Alain Gatoni',
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    userId: 'u-1',
    userName: 'Jonson Ndayishimiye',
    userRole: 'ADMIN',
    action: 'Procédure Scellé Déclenchée',
    resource: 'Emplacement MALL-N1-A06',
    oldStatus: 'IMPAYE',
    newStatus: 'SCELLE',
    timestamp: '2026-08-25 14:30',
    ipAddress: '197.239.12.44',
    details: 'Impayé supérieur à 5 mois (2 100 000 BIF). Ordre de mission généré.',
  },
  {
    id: 'log-2',
    userId: 'u-3',
    userName: 'Marc Nkurunziza',
    userRole: 'AGENT',
    action: 'Bordereau Approuvé',
    resource: 'Bordereau BOR-2026-08-011',
    oldStatus: 'EN_ATTENTE',
    newStatus: 'APPROUVE',
    timestamp: '2026-08-24 11:00',
    ipAddress: '197.239.12.18',
    details: 'Attestation de virement vérifiée avec le compte bancaire IBB.',
  },
];

export const mockSettings: MarketSettings = {
  name: 'Mall Kamenge',
  city: 'Bujumbura, Burundi',
  currency: 'BIF',
  penaltyRatePercent: 5,
  billingDayOfMonth: 1,
  gracePeriodDays: 5,
  decimalPrecision: 0,
  smsNotificationsEnabled: true,
  emailNotificationsEnabled: true,
};
