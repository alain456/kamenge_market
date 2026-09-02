from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class StaffRole(models.Model):
    """Dynamic staff role with domain-based permissions."""

    slug = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list)
    is_system_role = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Rôle du personnel'
        verbose_name_plural = 'Rôles du personnel'
        ordering = ['name']

    def __str__(self):
        return self.name


class Role(models.TextChoices):
    """Legacy enum kept for backward compatibility with existing data."""

    ADMIN = 'ADMIN', 'Administrateur'
    AGENT = 'AGENT', 'Agent du marché'
    MERCHANT = 'MERCHANT', 'Commerçant'


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse e-mail est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', Role.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('status', 'ACTIF')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Status(models.TextChoices):
        ACTIF = 'ACTIF', 'Actif'
        INACTIF = 'INACTIF', 'Inactif'

    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.AGENT)
    staff_role = models.ForeignKey(
        StaffRole,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='users',
    )
    assigned_area = models.CharField(max_length=150, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIF)
    last_login_at = models.DateTimeField(null=True, blank=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    objects = UserManager()

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.effective_role_slug})'

    @property
    def effective_role_slug(self):
        if self.staff_role_id:
            return self.staff_role.slug
        return self.role.lower() if self.role else ''

    @property
    def is_admin(self):
        if self.staff_role_id:
            return self.staff_role.slug == 'admin'
        return self.role == Role.ADMIN

    @property
    def is_agent(self):
        if self.staff_role_id:
            return self.staff_role.slug != 'admin'
        return self.role == Role.AGENT

    @property
    def is_merchant(self):
        return self.role == Role.MERCHANT and not self.staff_role_id

    def get_permissions(self):
        if self.staff_role_id:
            return self.staff_role.permissions or []
        return []
