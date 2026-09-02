from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter

from audit.utils import log_action
from users.permissions import IsAdmin, IsAdminOrAgent
from .models import Merchant, Contract
from .serializers import (
    MerchantSerializer, MerchantCreateSerializer,
    ContractSerializer, ContractCreateSerializer,
)


# ── Merchants ─────────────────────────────────────────────────────────────────

class MerchantListCreateView(generics.ListCreateAPIView):
    queryset = Merchant.objects.prefetch_related('contracts__place').all()
    permission_classes = [IsAdminOrAgent]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status']
    search_fields = ['full_name', 'phone', 'email', 'identity_card_number']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MerchantCreateSerializer
        return MerchantSerializer

    def perform_create(self, serializer):
        merchant = serializer.save()
        log_action(
            user=self.request.user,
            action='Nouveau Commerçant Créé',
            resource=f'Commerçant {merchant.full_name}',
            old_status='-',
            new_status='ACTIF',
            request=self.request,
        )


class MerchantDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Merchant.objects.prefetch_related('contracts__place').all()
    permission_classes = [IsAdminOrAgent]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return MerchantCreateSerializer
        return MerchantSerializer

    def perform_update(self, serializer):
        old_status = self.get_object().status
        merchant = serializer.save()
        if old_status != merchant.status:
            log_action(
                user=self.request.user,
                action='Statut commerçant modifié',
                resource=f'Commerçant {merchant.full_name}',
                old_status=old_status,
                new_status=merchant.status,
                request=self.request,
            )


# ── Merchant detail sub-resources ─────────────────────────────────────────────

class MerchantContractsView(generics.ListAPIView):
    """GET /api/merchants/<pk>/contracts/ — all contracts for one merchant."""
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        merchant_id = self.kwargs['pk']
        user = self.request.user
        qs = Contract.objects.filter(merchant_id=merchant_id).select_related('merchant', 'place')
        # Merchants can only see their own contracts
        if user.is_merchant:
            if hasattr(user, 'merchant_profile') and user.merchant_profile.id == int(merchant_id):
                return qs
            return Contract.objects.none()
        return qs


# ── Contracts ─────────────────────────────────────────────────────────────────

class ContractListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'merchant', 'place']
    search_fields = ['code', 'merchant__full_name', 'place__code']

    def get_queryset(self):
        qs = Contract.objects.select_related('merchant', 'place').all()
        user = self.request.user
        if user.is_merchant and hasattr(user, 'merchant_profile'):
            qs = qs.filter(merchant=user.merchant_profile)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ContractCreateSerializer
        return ContractSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        contract = serializer.save()
        log_action(
            user=self.request.user,
            action='Nouveau Contrat Signé',
            resource=f'Contrat {contract.code}',
            old_status='LIBRE',
            new_status='OCCUPE',
            details=f'Place {contract.place.code}',
            request=self.request,
        )


class ContractDetailView(generics.RetrieveUpdateAPIView):
    queryset = Contract.objects.select_related('merchant', 'place').all()
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ContractCreateSerializer
        return ContractSerializer

    def perform_update(self, serializer):
        old_status = self.get_object().status
        contract = serializer.save()
        if old_status != contract.status:
            log_action(
                user=self.request.user,
                action='Statut contrat modifié',
                resource=f'Contrat {contract.code}',
                old_status=old_status,
                new_status=contract.status,
                request=self.request,
            )


@api_view(['POST'])
@permission_classes([IsAdmin])
def terminate_contract(request, pk):
    """
    POST /api/contracts/<pk>/terminate/
    Terminates a contract and releases the place.
    """
    try:
        contract = Contract.objects.select_related('place', 'merchant').get(pk=pk)
    except Contract.DoesNotExist:
        return Response({'detail': 'Contrat introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    if contract.status == Contract.Status.RESILIE:
        return Response({'detail': 'Ce contrat est déjà résilié.'}, status=status.HTTP_400_BAD_REQUEST)

    from core.models import Place
    old_status = contract.status
    contract.status = Contract.Status.RESILIE
    contract.save(update_fields=['status'])

    place = contract.place
    place.status = Place.Status.LIBRE
    place.current_merchant = None
    place.current_contract = None
    place.total_due = 0
    place.save(update_fields=['status', 'current_merchant', 'current_contract', 'total_due'])

    log_action(
        user=request.user,
        action='Contrat Résilié',
        resource=f'Contrat {contract.code}',
        old_status=old_status,
        new_status=Contract.Status.RESILIE,
        details=request.data.get('notes', ''),
        request=request,
    )
    return Response(ContractSerializer(contract).data)
