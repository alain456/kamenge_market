from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, StaffRole, Role


class StaffRoleSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='slug', read_only=True)
    is_system_role = serializers.BooleanField(read_only=True)

    class Meta:
        model = StaffRole
        fields = ['id', 'slug', 'name', 'description', 'permissions', 'is_system_role']
        read_only_fields = ['slug', 'is_system_role']


class StaffRoleCreateSerializer(serializers.ModelSerializer):
    id = serializers.SlugField(source='slug', max_length=50)

    class Meta:
        model = StaffRole
        fields = ['id', 'name', 'description', 'permissions']

    def validate_id(self, value):
        if StaffRole.objects.filter(slug=value).exists():
            raise serializers.ValidationError('Un rôle avec cet identifiant existe déjà.')
        return value


class StaffRoleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffRole
        fields = ['name', 'description', 'permissions']


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    full_name = serializers.CharField(source='name', read_only=True)
    role_id = serializers.SerializerMethodField()
    role_name = serializers.SerializerMethodField()
    assigned_area = serializers.CharField(read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'name', 'full_name', 'email', 'phone', 'role', 'role_id', 'role_name',
            'assigned_area', 'permissions',
            'avatar_url', 'status', 'last_login_at', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login_at', 'role']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None

    def get_role_id(self, obj):
        return obj.effective_role_slug

    def get_role_name(self, obj):
        if obj.staff_role_id:
            return obj.staff_role.name
        return obj.get_role_display()

    def get_permissions(self, obj):
        return obj.get_permissions()


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(source='name')
    role_id = serializers.SlugField(write_only=True)

    class Meta:
        model = User
        fields = ['full_name', 'email', 'phone', 'role_id', 'assigned_area', 'password', 'status']

    def validate_role_id(self, value):
        if value == 'merchant':
            raise serializers.ValidationError('Utilisez un rôle du personnel.')
        if not StaffRole.objects.filter(slug=value).exists():
            raise serializers.ValidationError('Rôle invalide.')
        return value

    def create(self, validated_data):
        role_slug = validated_data.pop('role_id')
        password = validated_data.pop('password')
        status = validated_data.get('status', User.Status.ACTIF)
        staff_role = StaffRole.objects.get(slug=role_slug)
        legacy_role = Role.ADMIN if role_slug == 'admin' else Role.AGENT
        user = User(
            **validated_data,
            staff_role=staff_role,
            role=legacy_role,
            is_active=(status == User.Status.ACTIF),
        )
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='name', required=False)
    role_id = serializers.SlugField(required=False, write_only=True)
    password = serializers.CharField(write_only=True, required=False, min_length=6)

    class Meta:
        model = User
        fields = ['full_name', 'phone', 'role_id', 'assigned_area', 'status', 'password']

    def validate_role_id(self, value):
        if not StaffRole.objects.filter(slug=value).exists():
            raise serializers.ValidationError('Rôle invalide.')
        return value

    def update(self, instance, validated_data):
        role_slug = validated_data.pop('role_id', None)
        password = validated_data.pop('password', None)
        status = validated_data.get('status')
        if role_slug:
            staff_role = StaffRole.objects.get(slug=role_slug)
            instance.staff_role = staff_role
            instance.role = Role.ADMIN if role_slug == 'admin' else Role.AGENT
        if status is not None:
            instance.is_active = status == User.Status.ACTIF
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Mot de passe actuel incorrect.')
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds user info into the token response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if user.status == User.Status.INACTIF or not user.is_active:
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed('Ce compte est désactivé. Contactez l\'administrateur.', code='account_disabled')
        if not user.staff_role_id:
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed('Accès réservé au personnel du marché.', code='no_staff_role')
        from django.utils import timezone
        user.last_login_at = timezone.now()
        user.save(update_fields=['last_login_at'])
        data['user'] = UserSerializer(user, context=self.context).data
        return data
