"""
Utility used by all apps to write audit log entries.
Import: from audit.utils import log_action
"""
from .models import AuditLog


# Actions that are considered security-sensitive → CRITIQUE level
_CRITIQUE_KEYWORDS = {'scellé', 'seal', 'supprimé', 'delete', 'rejeté'}
_ALERTE_KEYWORDS = {'mise en demeure', 'litige', 'impayé', 'rejeté', 'résilié'}


def _infer_level(action: str) -> str:
    action_lower = action.lower()
    if any(k in action_lower for k in _CRITIQUE_KEYWORDS):
        return AuditLog.Level.CRITIQUE
    if any(k in action_lower for k in _ALERTE_KEYWORDS):
        return AuditLog.Level.ALERTE
    return AuditLog.Level.INFO


def _get_client_ip(request) -> str | None:
    if request is None:
        return None
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_action(
    user,
    action: str,
    resource: str,
    old_status: str | None = None,
    new_status: str | None = None,
    details: str | None = None,
    request=None,
) -> AuditLog:
    """
    Create an AuditLog entry.

    Parameters
    ----------
    user      : User instance (the actor)
    action    : Human-readable description of what happened
    resource  : The object affected (e.g. 'Emplacement MALL-N1-A03')
    old_status: Previous status value (optional)
    new_status: New status value (optional)
    details   : Extra context string (optional)
    request   : DRF/Django request object for IP extraction (optional)
    """
    return AuditLog.objects.create(
        user=user,
        user_name=user.name if user else '',
        user_role=user.role if user else '',
        action=action,
        resource=resource,
        old_status=old_status or '',
        new_status=new_status or '',
        details=details or '',
        level=_infer_level(action),
        ip_address=_get_client_ip(request),
    )
