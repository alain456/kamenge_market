import apiClient from '../lib/api-client';
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
  AccountingAccount,
  AccountingEntry,
  DisbursementRequest,
  AuditLog,
} from '../types/domain';
import { Role } from '../types/rbac';

/** Unwrap DRF paginated responses ({ results: [...] }) or plain arrays */
function unwrapList<T>(data: T[] | { results: T[] }): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'results' in data) {
    return (data as { results: T[] }).results;
  }
  return [];
}

/** Map API user payload to frontend User type */
export function mapApiUser(raw: Record<string, unknown>): User {
  const status = raw.status === 'ACTIF' || raw.status === 'active' ? 'active' : 'inactive';
  return {
    id: String(raw.id),
    fullName: String(raw.fullName ?? raw.full_name ?? raw.name ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    roleId: String(raw.roleId ?? raw.role_id ?? ''),
    avatar: (raw.avatarUrl ?? raw.avatar_url) as string | undefined,
    status,
    assignedArea: (raw.assignedArea ?? raw.assigned_area) as string | undefined,
    lastLogin: (raw.lastLogin ?? raw.last_login_at) as string | undefined,
    createdAt: String(raw.dateJoined ?? raw.date_joined ?? new Date().toISOString()),
  };
}

export function mapApiRole(raw: Record<string, unknown>): Role {
  return {
    id: String(raw.id ?? raw.slug),
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    isSystemRole: Boolean(raw.isSystemRole),
    permissions: Array.isArray(raw.permissions) ? raw.permissions.map(String) : [],
  };
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  phone?: string;
  roleId: string;
  assignedArea?: string;
  password: string;
  status?: 'ACTIF' | 'INACTIF';
}

export interface UpdateUserPayload {
  fullName?: string;
  phone?: string;
  roleId?: string;
  assignedArea?: string;
  status?: 'ACTIF' | 'INACTIF';
  password?: string;
}

export interface UserTask {
  id: string;
  title: string;
  description: string;
  link: string;
  priority: 'high' | 'medium' | 'low';
  meta?: string;
}

export interface MyTasksResponse {
  role: string;
  roleName: string;
  assignedArea?: string;
  tasks: UserTask[];
  stats: {
    pendingSlips?: number;
    openDisputes?: number;
    librePlaces?: number;
    merchantsWithDebt?: number;
  };
}

export interface DashboardStats {
  places: {
    total: number;
    occupied: number;
    libre: number;
    impaye: number;
    scelle: number;
    maintenance: number;
    preuveEnAttente: number;
    occupancyRatePercent: number;
  };
  financials: {
    totalArrearsBif: number;
    monthlyRevenueBif: number;
  };
  merchants: {
    total: number;
    active: number;
  };
  contracts: {
    active: number;
    terminated: number;
  };
  staff: {
    total: number;
  };
  pendingSlipsCount: number;
  approvedSlipsCount: number;
  openDisputesCount: number;
  priorityUnpaid: Array<{
    id: number;
    fullName: string;
    amountDue: number;
    status: string;
    placeCode?: string;
    unpaidMonthsCount?: number;
  }>;
  pendingSlips: Array<{
    id: number;
    slipNumber: string;
    merchantFullName: string;
    placeCode: string;
    declaredAmount: number;
    expectedAmount: number;
    submissionDate: string;
    method?: string;
  }>;
}

export interface RevenueReport {
  year: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  revenueByPlaceType: Array<{ type: string; revenue: number }>;
  collectionRatePercent: number;
  totalInvoicedBif: number;
  totalCollectedBif: number;
}

export class ApiService {
  // Users
  static async getUsers(): Promise<User[]> {
    const res = await apiClient.get('users/');
    return unwrapList(res.data).map((u) => mapApiUser(u as Record<string, unknown>));
  }

  static async createUser(payload: CreateUserPayload): Promise<User> {
    const res = await apiClient.post('users/', payload);
    return mapApiUser(res.data as Record<string, unknown>);
  }

  static async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const res = await apiClient.patch(`users/${id}/`, payload);
    return mapApiUser(res.data as Record<string, unknown>);
  }

  static async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`users/${id}/`);
  }

  // Staff roles
  static async getRoles(): Promise<Role[]> {
    const res = await apiClient.get('roles/');
    return unwrapList(res.data).map((r) => mapApiRole(r as Record<string, unknown>));
  }

  static async createRole(payload: { id: string; name: string; description?: string; permissions?: string[] }): Promise<Role> {
    const res = await apiClient.post('roles/', payload);
    return mapApiRole(res.data as Record<string, unknown>);
  }

  static async updateRole(slug: string, payload: { name?: string; description?: string; permissions?: string[] }): Promise<Role> {
    const res = await apiClient.patch(`roles/${slug}/`, payload);
    return mapApiRole(res.data as Record<string, unknown>);
  }

  static async deleteRole(slug: string): Promise<void> {
    await apiClient.delete(`roles/${slug}/`);
  }

  // Zones
  static async getZones(): Promise<Zone[]> {
    const res = await apiClient.get('zones/');
    return unwrapList(res.data);
  }

  // Places
  static async getPlaces(): Promise<Place[]> {
    const res = await apiClient.get('places/');
    return unwrapList(res.data);
  }

  static async updatePlaceStatus(id: string, status: Place['status'], notes?: string): Promise<Place> {
    const res = await apiClient.post(`places/${id}/status/`, { status, notes });
    return res.data;
  }

  // Merchants
  static async getMerchants(): Promise<Merchant[]> {
    const res = await apiClient.get('merchants/');
    return unwrapList(res.data);
  }

  static async getMerchantById(id: string): Promise<Merchant> {
    const res = await apiClient.get(`merchants/${id}/`);
    return res.data;
  }

  static async getMerchantContracts(merchantId: string): Promise<Contract[]> {
    const res = await apiClient.get(`merchants/${merchantId}/contracts/`);
    return unwrapList(res.data);
  }

  static async createMerchant(merchant: Partial<Merchant>): Promise<Merchant> {
    const res = await apiClient.post('merchants/', merchant);
    return res.data;
  }

  // Contracts
  static async getContracts(): Promise<Contract[]> {
    const res = await apiClient.get('contracts/');
    return unwrapList(res.data);
  }

  static async createContract(contract: Partial<Contract>): Promise<Contract> {
    const res = await apiClient.post('contracts/', contract);
    return res.data;
  }

  // Due Dates & Invoices
  static async getDueDates(): Promise<DueDateInvoice[]> {
    const res = await apiClient.get('due-dates/');
    return unwrapList(res.data);
  }

  static async generateMonthlyDueDates(period: string): Promise<number> {
    const res = await apiClient.post('due-dates/generate/', { period });
    return res.data.createdCount || 0;
  }

  // Payments
  static async getPayments(): Promise<Payment[]> {
    const res = await apiClient.get('payments/');
    return unwrapList(res.data);
  }

  // Payment Slips Verification Workflow
  static async getPaymentSlips(): Promise<PaymentSlip[]> {
    const res = await apiClient.get('payment-slips/');
    return unwrapList(res.data);
  }

  static async verifyPaymentSlip(id: string, decision: 'APPROUVE' | 'REJETE', verifiedBy: string, comment?: string, rejectionReason?: string): Promise<PaymentSlip> {
    const payload: Record<string, string> = { decision, verifiedBy, comment: comment || '' };
    if (decision === 'REJETE') payload.rejectionReason = rejectionReason || '';

    const res = await apiClient.post(`payment-slips/${id}/verify/`, payload);
    return res.data;
  }

  // Disputes & Seal Procedure
  static async getDisputes(): Promise<Dispute[]> {
    const res = await apiClient.get('disputes/');
    return unwrapList(res.data);
  }

  static async triggerSealProcedure(disputeId: string, placeId: string, adminNotes: string): Promise<void> {
    await apiClient.post(`disputes/${disputeId}/seal/`, { placeId, adminNotes });
  }

  // Accounting & Entries
  static async getAccounts(): Promise<AccountingAccount[]> {
    const res = await apiClient.get('accounting/accounts/');
    return unwrapList(res.data);
  }

  static async getEntries(): Promise<AccountingEntry[]> {
    const res = await apiClient.get('accounting/entries/');
    return unwrapList(res.data);
  }

  static async createAccountingEntry(entry: Partial<AccountingEntry>): Promise<AccountingEntry> {
    const res = await apiClient.post('accounting/entries/create/', entry);
    return res.data;
  }

  // Disbursements Workflow
  static async getDisbursements(): Promise<DisbursementRequest[]> {
    const res = await apiClient.get('disbursements/');
    return unwrapList(res.data);
  }

  static async createDisbursement(data: { amount: number; purpose: string; costCenter?: string }): Promise<DisbursementRequest> {
    const res = await apiClient.post('disbursements/', data);
    return res.data;
  }

  static async updateDisbursementStatus(id: string, newStatus: DisbursementRequest['status'], user: User, rejectionReason?: string): Promise<DisbursementRequest> {
    if (newStatus === 'Rejeté') {
      const res = await apiClient.post(`disbursements/${id}/reject/`, { reason: rejectionReason, user: user.id });
      return res.data;
    }
    const res = await apiClient.post(`disbursements/${id}/advance/`, { newStatus, user: user.id });
    return res.data;
  }

  // Reports & Dashboard
  static async getDashboardStats(): Promise<DashboardStats> {
    const res = await apiClient.get('reports/dashboard/');
    return res.data;
  }

  static async getRevenueReport(year?: number): Promise<RevenueReport> {
    const res = await apiClient.get('reports/revenue/', { params: year ? { year } : undefined });
    return res.data;
  }

  static async getMyTasks(): Promise<MyTasksResponse> {
    const res = await apiClient.get('reports/my-tasks/');
    return res.data;
  }

  // Audit Log
  static async getAuditLogs(): Promise<AuditLog[]> {
    const res = await apiClient.get('audit-logs/');
    return unwrapList(res.data);
  }
}
