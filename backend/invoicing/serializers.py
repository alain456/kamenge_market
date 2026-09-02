from rest_framework import serializers
from .models import DueDateInvoice, Payment, PaymentSlip


class DueDateInvoiceSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source='merchant.full_name', read_only=True)
    place_code = serializers.CharField(source='place.code', read_only=True)

    class Meta:
        model = DueDateInvoice
        fields = [
            'id', 'invoice_number', 'period',
            'merchant', 'merchant_name',
            'contract', 'place', 'place_code',
            'due_date', 'amount', 'paid_amount',
            'remaining_amount', 'status',
            'penalty_amount', 'days_overdue',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'invoice_number', 'remaining_amount',
            'created_at', 'updated_at',
        ]


class PaymentSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source='merchant.full_name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True, default=None)
    agent_name = serializers.CharField(source='recorded_by.name', read_only=True, default=None)
    receipt_url = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'merchant', 'merchant_name',
            'invoice', 'invoice_number',
            'date', 'amount', 'method',
            'reference', 'status',
            'recorded_by', 'agent_name',
            'receipt_url', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_receipt_url(self, obj):
        request = self.context.get('request')
        if obj.receipt and request:
            return request.build_absolute_uri(obj.receipt.url)
        return None


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['merchant', 'invoice', 'date', 'amount', 'method', 'reference', 'receipt', 'notes']

    def create(self, validated_data):
        validated_data['recorded_by'] = self.context['request'].user
        validated_data.setdefault('status', Payment.Status.EN_ATTENTE)
        return super().create(validated_data)


class PaymentSlipSerializer(serializers.ModelSerializer):
    merchant_name = serializers.CharField(source='merchant.full_name', read_only=True)
    place_code = serializers.CharField(source='place.code', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.name', read_only=True, default=None)
    file_preview_url = serializers.SerializerMethodField()

    class Meta:
        model = PaymentSlip
        fields = [
            'id', 'slip_number',
            'merchant', 'merchant_name',
            'place', 'place_code', 'invoice',
            'submission_date', 'declared_amount', 'expected_amount',
            'method', 'file', 'file_name', 'file_size',
            'file_preview_url', 'status',
            'verified_by', 'verified_by_name',
            'verification_date', 'rejection_reason', 'comment',
        ]
        read_only_fields = [
            'id', 'slip_number', 'submission_date',
            'verified_by', 'verification_date',
        ]

    def get_file_preview_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class PaymentSlipCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentSlip
        fields = ['merchant', 'place', 'invoice', 'declared_amount', 'expected_amount', 'method', 'file', 'comment']

    def create(self, validated_data):
        import datetime
        year = datetime.date.today().year
        count = PaymentSlip.objects.filter(submission_date__year=year).count() + 1
        validated_data['slip_number'] = f'BOR-{year}-{count:05d}'
        if validated_data.get('file'):
            f = validated_data['file']
            validated_data['file_name'] = f.name
            validated_data['file_size'] = f'{round(f.size / 1024, 1)} KB'
        return super().create(validated_data)


class SlipVerifySerializer(serializers.Serializer):
    """Body for POST /api/payment-slips/<pk>/verify/"""
    decision = serializers.ChoiceField(choices=['APPROUVE', 'REJETE'])
    comment = serializers.CharField(required=False, allow_blank=True, default='')
    rejection_reason = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        if attrs['decision'] == 'REJETE' and not attrs.get('rejection_reason'):
            raise serializers.ValidationError(
                {'rejection_reason': 'Un motif de rejet est obligatoire.'}
            )
        return attrs


class GenerateDueDatesSerializer(serializers.Serializer):
    """Body for POST /api/due-dates/generate/"""
    period = serializers.CharField(help_text='Ex: Septembre 2026')
    due_date = serializers.DateField(help_text='Date d\'échéance ex: 2026-09-05')
