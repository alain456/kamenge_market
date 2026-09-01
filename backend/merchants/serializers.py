from rest_framework import serializers
from .models import Merchant, Contract


class MerchantSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()
    assigned_place_code = serializers.SerializerMethodField()
    assigned_place_id = serializers.SerializerMethodField()

    class Meta:
        model = Merchant
        fields = [
            'id', 'user', 'full_name', 'phone', 'email',
            'identity_card_number', 'photo_url',
            'status', 'amount_due',
            'assigned_place_code', 'assigned_place_id',
            'registered_at', 'last_activity',
        ]
        read_only_fields = ['id', 'registered_at', 'last_activity', 'amount_due']

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        return None

    def get_assigned_place_code(self, obj):
        contract = obj.contracts.filter(status=Contract.Status.ACTIF).first()
        return contract.place.code if contract else None

    def get_assigned_place_id(self, obj):
        contract = obj.contracts.filter(status=Contract.Status.ACTIF).first()
        return contract.place.id if contract else None


class MerchantCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = [
            'full_name', 'phone', 'email',
            'identity_card_number', 'photo', 'status', 'user',
        ]


class ContractSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source='merchant.full_name', read_only=True)
    place_code = serializers.CharField(source='place.code', read_only=True)

    class Meta:
        model = Contract
        fields = [
            'id', 'code',
            'merchant', 'merchant_name',
            'place', 'place_code',
            'start_date', 'end_date',
            'monthly_rent', 'deposit_months', 'deposit_amount',
            'periodicity', 'status', 'sublease_allowed',
            'notes', 'created_at',
        ]
        read_only_fields = ['id', 'code', 'deposit_amount', 'created_at']


class ContractCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contract
        fields = [
            'merchant', 'place',
            'start_date', 'end_date',
            'monthly_rent', 'deposit_months',
            'periodicity', 'sublease_allowed', 'notes',
        ]

    def validate(self, attrs):
        place = attrs.get('place')
        from core.models import Place
        if place and place.status not in (Place.Status.LIBRE,):
            raise serializers.ValidationError(
                {'place': 'Cet emplacement n\'est pas disponible (statut: %s).' % place.status}
            )
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if start and end and end <= start:
            raise serializers.ValidationError(
                {'end_date': 'La date de fin doit être postérieure à la date de début.'}
            )
        return attrs

    def create(self, validated_data):
        import datetime
        from core.models import Place

        # Auto-generate contract code
        year = datetime.date.today().year
        count = Contract.objects.filter(created_at__year=year).count() + 1
        validated_data['code'] = f'CTR-{year}-{count:03d}'
        validated_data['deposit_amount'] = (
            validated_data['deposit_months'] * validated_data['monthly_rent']
        )
        contract = super().create(validated_data)

        # Update place status → OCCUPE
        place = contract.place
        place.status = Place.Status.OCCUPE
        place.current_merchant = contract.merchant
        place.current_contract = contract
        place.save(update_fields=['status', 'current_merchant', 'current_contract'])

        return contract
