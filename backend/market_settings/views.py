from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit.utils import log_action
from users.permissions import IsAdmin
from .models import MarketSettings
from .serializers import MarketSettingsSerializer


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def settings_view(request):
    """
    GET  /api/settings/  — retrieve current settings (all authenticated users)
    PUT  /api/settings/  — full update (ADMIN only)
    PATCH /api/settings/ — partial update (ADMIN only)
    """
    instance = MarketSettings.get_solo()

    if request.method == 'GET':
        serializer = MarketSettingsSerializer(instance)
        return Response(serializer.data)

    # Write operations require ADMIN role
    if not request.user.role == 'ADMIN':
        return Response(
            {'detail': 'Seul un administrateur peut modifier les paramètres.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    partial = request.method == 'PATCH'
    serializer = MarketSettingsSerializer(instance, data=request.data, partial=partial)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    log_action(
        user=request.user,
        action='Paramètres du marché mis à jour',
        resource='MarketSettings',
        details=str(request.data)[:200],
        request=request,
    )
    return Response(serializer.data)
