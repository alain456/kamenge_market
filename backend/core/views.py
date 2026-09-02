from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from audit.utils import log_action
from users.permissions import IsAdmin, IsAdminOrAgent
from .models import Zone, Place
from .serializers import ZoneSerializer, PlaceSerializer, PlaceStatusUpdateSerializer


# ── Zones ────────────────────────────────────────────────────────────────────

class ZoneListCreateView(generics.ListCreateAPIView):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer
    permission_classes = [IsAuthenticated]


class ZoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer
    permission_classes = [IsAdmin]


# ── Places ───────────────────────────────────────────────────────────────────

class PlaceListCreateView(generics.ListCreateAPIView):
    queryset = Place.objects.select_related('zone', 'current_merchant').all()
    serializer_class = PlaceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'type', 'zone']
    search_fields = ['code', 'notes', 'current_merchant__full_name']


class PlaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Place.objects.select_related('zone', 'current_merchant').all()
    permission_classes = [IsAdminOrAgent]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return PlaceStatusUpdateSerializer
        return PlaceSerializer

    def perform_update(self, serializer):
        place = self.get_object()
        old_status = place.status
        updated = serializer.save()
        # Clear occupant info when explicitly released
        if updated.status == Place.Status.LIBRE:
            updated.current_merchant = None
            updated.current_contract = None
            updated.total_due = 0
            updated.save(update_fields=['current_merchant', 'current_contract', 'total_due'])
        log_action(
            user=self.request.user,
            action='Mise à jour statut emplacement',
            resource=f'Emplacement {updated.code}',
            old_status=old_status,
            new_status=updated.status,
            details=updated.notes or None,
            request=self.request,
        )


@api_view(['POST'])
@permission_classes([IsAdmin])
def place_change_status(request, pk):
    """
    PATCH /api/places/<pk>/status/
    Body: { "status": "SCELLE", "notes": "..." }
    """
    try:
        place = Place.objects.get(pk=pk)
    except Place.DoesNotExist:
        return Response({'detail': 'Emplacement introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    notes = request.data.get('notes', '')

    if new_status not in Place.Status.values:
        return Response(
            {'detail': f'Statut invalide. Valeurs acceptées: {Place.Status.values}'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    old_status = place.status
    place.status = new_status
    if notes:
        place.notes = notes
    if new_status == Place.Status.LIBRE:
        place.current_merchant = None
        place.current_contract = None
        place.total_due = 0

    place.save()
    log_action(
        user=request.user,
        action='Action Administrateur – Changement statut',
        resource=f'Emplacement {place.code}',
        old_status=old_status,
        new_status=new_status,
        details=notes or None,
        request=request,
    )
    return Response(PlaceSerializer(place).data)
