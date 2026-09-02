"""Default staff roles — mirrors src/data/rbac-mock.ts"""


def _admin_perms():
    perms = []
    for domain in ('commerce', 'espaces', 'rh'):
        for action in ('read', 'create', 'update', 'delete', 'validate'):
            perms.append(f'{domain}.{action}')
    perms.extend([
        'finances.read', 'finances.validate',
        'infrastructures.read', 'infrastructures.validate',
        'securite.read', 'securite.validate',
        'documents.read', 'documents.update',
        'plaintes.read', 'plaintes.validate',
    ])
    return perms


STAFF_ROLES = [
    {
        'slug': 'admin',
        'name': 'Administrateur du marché',
        'description': 'Accès complet à tous les modules',
        'is_system_role': True,
        'permissions': _admin_perms(),
    },
    {
        'slug': 'secretaire',
        'name': 'Secrétaire',
        'description': 'Gestion administrative',
        'is_system_role': True,
        'permissions': [
            'commerce.read', 'commerce.create', 'commerce.update',
            'espaces.read',
            'rh.read',
            'documents.read', 'documents.create', 'documents.update',
            'plaintes.read', 'plaintes.create', 'plaintes.update',
        ],
    },
    {
        'slug': 'comptable',
        'name': 'Comptable',
        'description': 'Gestion financière globale',
        'is_system_role': True,
        'permissions': [
            'commerce.read',
            'espaces.read',
            'finances.read', 'finances.create', 'finances.update', 'finances.validate',
            'rh.read',
            'documents.read',
            'plaintes.read',
        ],
    },
    {
        'slug': 'caissier',
        'name': 'Caissier',
        'description': 'Gestion de sa propre caisse',
        'is_system_role': True,
        'permissions': [
            'commerce.read',
            'espaces.read',
            'finances.read', 'finances.create',
            'documents.read',
        ],
    },
    {
        'slug': 'agent_perception',
        'name': 'Agent de perception',
        'description': 'Perception des taxes',
        'is_system_role': True,
        'permissions': [
            'commerce.read',
            'espaces.read',
            'finances.create',
        ],
    },
    {
        'slug': 'agent_enregistrement',
        'name': "Agent d'enregistrement",
        'description': 'Enregistrement des entités',
        'is_system_role': True,
        'permissions': [
            'commerce.read', 'commerce.create', 'commerce.update',
            'espaces.read', 'espaces.create', 'espaces.update',
            'documents.read', 'documents.create',
        ],
    },
]

STAFF_USERS = [
    {
        'email': 'admin@kamenge-mall.bi',
        'name': 'Jonson Ndayishimiye',
        'role_slug': 'admin',
        'phone': '+257 79 123 456',
        'status': 'ACTIF',
    },
    {
        'email': 'agent@kamenge-mall.bi',
        'name': 'Marc Nkurunziza',
        'role_slug': 'comptable',
        'phone': '+257 71 987 654',
        'status': 'ACTIF',
        'assigned_area': 'Zone Commerciale Bloc A',
    },
    {
        'email': 'secretaire@kamenge-mall.bi',
        'name': 'Claire Niyonkuru',
        'role_slug': 'secretaire',
        'phone': '+257 79 222 333',
        'status': 'ACTIF',
    },
    {
        'email': 'caissier@kamenge-mall.bi',
        'name': 'Eric Nsengiyumva',
        'role_slug': 'caissier',
        'phone': '+257 71 444 555',
        'status': 'ACTIF',
        'assigned_area': 'Caisse Principale',
    },
    {
        'email': 'perception@kamenge-mall.bi',
        'name': 'Fabrice Irakoze',
        'role_slug': 'agent_perception',
        'phone': '+257 79 666 777',
        'status': 'ACTIF',
        'assigned_area': 'Zone Parking',
    },
    {
        'email': 'enregistrement@kamenge-mall.bi',
        'name': 'Grace Munezero',
        'role_slug': 'agent_enregistrement',
        'phone': '+257 71 888 999',
        'status': 'ACTIF',
    },
]
