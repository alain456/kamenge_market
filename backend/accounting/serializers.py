from rest_framework import serializers
from .models import (
    AccountingAccount, CostCenter,
    AccountingEntry, AccountingEntryLine,
    DisbursementRequest,
)


class AccountingAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountingAccount
        fields = ['id', 'code', 'name', 'account_class', 'category', 'balance']


class CostCenterSerializer(serializers.ModelSerializer):
    remaining_budget = serializers.ReadOnlyField()

    class Meta:
        model = CostCenter
        fields = ['id', 'code', 'name', 'budget', 'spent', 'remaining_budget']


class AccountingEntryLineSerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    cost_center_name = serializers.CharField(source='cost_center.name', read_only=True, default=None)

    class Meta:
        model = AccountingEntryLine
        fields = [
            'id', 'account', 'account_code', 'account_name',
            'cost_center', 'cost_center_name',
            'debit', 'credit', 'comment',
        ]


class AccountingEntryLineCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountingEntryLine
        fields = ['account', 'cost_center', 'debit', 'credit', 'comment']


class AccountingEntrySerializer(serializers.ModelSerializer):
    lines = AccountingEntryLineSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True, default=None)

    class Meta:
        model = AccountingEntry
        fields = [
            'id', 'entry_number', 'date', 'document_ref', 'label',
            'lines', 'total_debit', 'total_credit', 'is_balanced',
            'status', 'created_by', 'created_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'entry_number', 'is_balanced', 'created_at']


class AccountingEntryCreateSerializer(serializers.Serializer):
    """Handles entry + lines creation together."""
    date = serializers.DateField()
    document_ref = serializers.CharField(required=False, allow_blank=True, default='')
    label = serializers.CharField()
    lines = AccountingEntryLineCreateSerializer(many=True, min_length=2)

    def validate(self, attrs):
        lines = attrs.get('lines', [])
        total_debit = sum(l['debit'] for l in lines)
        total_credit = sum(l['credit'] for l in lines)
        if total_debit != total_credit:
            diff = abs(total_debit - total_credit)
            raise serializers.ValidationError(
                f'Écriture non équilibrée: écart de {diff:,} BIF. '
                'La règle de la partie double exige Total Débit === Total Crédit.'
            )
        attrs['total_debit'] = total_debit
        attrs['total_credit'] = total_credit
        return attrs

    def create(self, validated_data):
        import datetime
        lines_data = validated_data.pop('lines')
        year = datetime.date.today().year
        count = AccountingEntry.objects.filter(created_at__year=year).count() + 1
        entry = AccountingEntry.objects.create(
            entry_number=f'ECR-{year}-{count:05d}',
            total_debit=validated_data.pop('total_debit'),
            total_credit=validated_data.pop('total_credit'),
            is_balanced=True,
            status=AccountingEntry.Status.VALIDE,
            created_by=self.context['request'].user,
            **validated_data,
        )
        for line_data in lines_data:
            AccountingEntryLine.objects.create(entry=entry, **line_data)
        return entry


class DisbursementRequestSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(source='applicant.name', read_only=True)
    applicant_role = serializers.CharField(source='applicant.role', read_only=True)
    cost_center_name = serializers.CharField(source='cost_center.name', read_only=True, default=None)
    validated_by_name = serializers.CharField(source='validated_by.name', read_only=True, default=None)
    confirmed_by_name = serializers.CharField(source='confirmed_by.name', read_only=True, default=None)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True, default=None)

    class Meta:
        model = DisbursementRequest
        fields = [
            'id', 'request_number',
            'applicant', 'applicant_name', 'applicant_role',
            'cost_center', 'cost_center_name',
            'amount', 'purpose', 'status',
            'validated_by', 'validated_by_name',
            'confirmed_by', 'confirmed_by_name',
            'approved_by', 'approved_by_name',
            'rejection_reason', 'linked_entry',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'request_number',
            'validated_by', 'confirmed_by', 'approved_by',
            'linked_entry', 'created_at', 'updated_at',
        ]


class DisbursementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisbursementRequest
        fields = ['cost_center', 'amount', 'purpose']

    def create(self, validated_data):
        import datetime
        year = datetime.date.today().year
        count = DisbursementRequest.objects.filter(created_at__year=year).count() + 1
        validated_data['applicant'] = self.context['request'].user
        validated_data['request_number'] = f'DEC-{year}-{count:05d}'
        validated_data['status'] = DisbursementRequest.Status.BROUILLON
        return super().create(validated_data)


class DisbursementStatusUpdateSerializer(serializers.Serializer):
    """Body for POST /api/disbursements/<pk>/advance/"""
    rejection_reason = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        # rejection_reason is only required when rejecting
        # The view decides the next status; validation of reason happens there
        return attrs
