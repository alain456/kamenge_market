import { Role } from '../types/domain';

export interface PermissionConfig {
  isMerchant: boolean;
  canManageUsers: boolean;
  canManagePlaces: boolean;
  canManageMerchants: boolean;
  canCreateContract: boolean;
  canVerifySlips: boolean;
  canRejectSlips: boolean;
  canTriggerSeal: boolean;
  canCreateAccountingEntries: boolean;
  canApproveDisbursements: boolean;
  canAccessAccounting: boolean;
  canEditSettings: boolean;
  canViewReports: boolean;
  canViewDisputes: boolean;
}

export function getRolePermissions(role: Role): PermissionConfig {
  switch (role) {
    case 'ADMIN':
      return {
        isMerchant: false,
        canManageUsers: true,
        canManagePlaces: true,
        canManageMerchants: true,
        canCreateContract: true,
        canVerifySlips: true,
        canRejectSlips: true,
        canTriggerSeal: true,
        canCreateAccountingEntries: true,
        canApproveDisbursements: true,
        canAccessAccounting: true,
        canEditSettings: true,
        canViewReports: true,
        canViewDisputes: true,
      };
    case 'AGENT':
      return {
        isMerchant: false,
        canManageUsers: false,
        canManagePlaces: false,
        canManageMerchants: true,
        canCreateContract: false,
        canVerifySlips: true,
        canRejectSlips: true,
        canTriggerSeal: false,
        canCreateAccountingEntries: false,
        canApproveDisbursements: false,
        canAccessAccounting: false,
        canEditSettings: false,
        canViewReports: false,
        canViewDisputes: true,
      };
    case 'MERCHANT':
      return {
        isMerchant: true,
        canManageUsers: false,
        canManagePlaces: false,
        canManageMerchants: false,
        canCreateContract: false,
        canVerifySlips: false,
        canRejectSlips: false,
        canTriggerSeal: false,
        canCreateAccountingEntries: false,
        canApproveDisbursements: false,
        canAccessAccounting: false,
        canEditSettings: false,
        canViewReports: false,
        canViewDisputes: false,
      };
    default:
      return {
        isMerchant: false,
        canManageUsers: false,
        canManagePlaces: false,
        canManageMerchants: false,
        canCreateContract: false,
        canVerifySlips: false,
        canRejectSlips: false,
        canTriggerSeal: false,
        canCreateAccountingEntries: false,
        canApproveDisbursements: false,
        canAccessAccounting: false,
        canEditSettings: false,
        canViewReports: false,
        canViewDisputes: false,
      };
  }
}

export function getRoleLabel(role: Role): string {
  switch (role) {
    case 'ADMIN': return 'Administrateur';
    case 'AGENT': return 'Agent du marché';
    case 'MERCHANT': return 'Commerçant';
  }
}
