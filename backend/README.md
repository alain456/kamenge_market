# Mall Kamenge – Backend (Django REST Framework)

Full REST API backend for the Mall Kamenge market management system.  
Mirrors every workflow that was previously handled by the TypeScript mock API.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Django 5.1 + Django REST Framework 3.15 |
| Auth | JWT via `djangorestframework-simplejwt` |
| Database | SQLite (dev) — swap to PostgreSQL for production |
| CORS | `django-cors-headers` |
| Filtering | `django-filter` |
| File uploads | Pillow (avatars, payment slip proofs, receipts) |

---

## Quick start

```bash
# 1. Create and activate virtualenv
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment (copy and edit as needed)
cp .env .env.local                # already has safe defaults for dev

# 4. Run migrations
python manage.py migrate

# 5. Seed demo data  (same data as the frontend mock)
python manage.py seed

# 6. Start the dev server
python manage.py runserver
```

The API is now live at **http://127.0.0.1:8000/api/**

---

## Demo accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@kamenge-mall.bi | kamenge2026 |
| Agent | agent@kamenge-mall.bi | kamenge2026 |
| Merchant | commercant@kamenge-mall.bi | kamenge2026 |

---

## API endpoints reference

### Auth
| Method | URL | Description |
|---|---|---|
| POST | `/api/auth/login/` | Obtain JWT access + refresh tokens |
| POST | `/api/auth/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET | `/api/auth/me/` | Current user profile |
| POST | `/api/auth/change-password/` | Change own password |

### Users *(Admin only)*
| Method | URL | Description |
|---|---|---|
| GET/POST | `/api/users/` | List / create users |
| GET/PUT/PATCH/DELETE | `/api/users/<id>/` | Retrieve / update / delete user |

### Zones & Places
| Method | URL | Description |
|---|---|---|
| GET/POST | `/api/zones/` | List / create zones |
| GET/PUT/PATCH | `/api/zones/<id>/` | Zone detail |
| GET/POST | `/api/places/` | List / create places — filter: `?status=&type=&zone=` |
| GET/PUT/PATCH | `/api/places/<id>/` | Place detail |
| POST | `/api/places/<id>/status/` | Change place status — body: `{status, notes}` |

### Merchants & Contracts
| Method | URL | Description |
|---|---|---|
| GET/POST | `/api/merchants/` | List / create merchants |
| GET/PUT/PATCH | `/api/merchants/<id>/` | Merchant detail |
| GET | `/api/merchants/<id>/contracts/` | All contracts for one merchant |
| GET/POST | `/api/contracts/` | List / create contracts |
| GET/PUT/PATCH | `/api/contracts/<id>/` | Contract detail |
| POST | `/api/contracts/<id>/terminate/` | Terminate contract → frees the place |

### Invoicing / Due Dates
| Method | URL | Description |
|---|---|---|
| GET | `/api/due-dates/` | List invoices — filter: `?status=&period=&merchant=` |
| GET/PATCH | `/api/due-dates/<id>/` | Invoice detail |
| POST | `/api/due-dates/generate/` | Generate monthly invoices for all occupied places — body: `{period, due_date}` |

### Payments
| Method | URL | Description |
|---|---|---|
| GET/POST | `/api/payments/` | List / record payments |
| POST | `/api/payments/<id>/confirm/` | Confirm payment → updates invoice |

### Payment Slips
| Method | URL | Description |
|---|---|---|
| GET/POST | `/api/payment-slips/` | List / submit slips (multipart file upload) |
| GET | `/api/payment-slips/<id>/` | Slip detail |
| POST | `/api/payment-slips/<id>/verify/` | Approve or reject — body: `{decision, comment, rejection_reason}` |

### Disputes & Recovery
| Method | URL | Description |
|---|---|---|
| GET/POST | `/api/disputes/` | List / create dispute cases |
| GET/PATCH | `/api/disputes/<id>/` | Dispute detail |
| POST | `/api/disputes/<id>/seal/` | Trigger seal procedure — body: `{admin_notes}` |
| POST | `/api/disputes/<id>/reminders/` | Add reminder — body: `{type, channel, destination, content}` |
| POST | `/api/disputes/<id>/regularize/` | Mark as regularized → restores merchant + place |

### Accounting
| Method | URL | Description |
|---|---|---|
| GET/POST | `/api/accounting/accounts/` | Chart of accounts |
| GET/PUT/PATCH | `/api/accounting/accounts/<id>/` | Account detail |
| GET/POST | `/api/accounting/cost-centers/` | Cost centers |
| GET | `/api/accounting/entries/` | Journal entries |
| POST | `/api/accounting/entries/create/` | Create balanced double-entry — validates `totalDebit == totalCredit` |
| GET/POST | `/api/disbursements/` | List / create disbursement requests |
| GET | `/api/disbursements/<id>/` | Disbursement detail |
| POST | `/api/disbursements/<id>/advance/` | Advance to next workflow step |
| POST | `/api/disbursements/<id>/reject/` | Reject — body: `{rejection_reason}` |

### Reports
| Method | URL | Description |
|---|---|---|
| GET | `/api/reports/dashboard/` | KPI summary: place stats, arrears, pending slips |
| GET | `/api/reports/revenue/?year=2026` | Monthly revenue + by-type breakdown + collection rate |

### Audit Log *(Admin only)*
| Method | URL | Description |
|---|---|---|
| GET | `/api/audit-logs/` | Full immutable audit trail — filter: `?level=&user_role=` |

### Market Settings
| Method | URL | Description |
|---|---|---|
| GET | `/api/settings/` | Retrieve current settings |
| PUT/PATCH | `/api/settings/` | Update settings *(Admin only)* |

---

## Authentication

All endpoints except `/api/auth/login/` require a JWT Bearer token:

```
Authorization: Bearer <access_token>
```

Access tokens expire after **8 hours**. Use `/api/auth/refresh/` with the refresh token to obtain a new one.

---

## Role permissions summary

| Feature | ADMIN | AGENT | MERCHANT |
|---|---|---|---|
| Manage users | ✅ | ❌ | ❌ |
| Manage places | ✅ | ❌ | ❌ |
| Manage merchants | ✅ | ✅ | ❌ |
| Create contracts | ✅ | ❌ | ❌ |
| Verify slips | ✅ | ✅ | ❌ |
| Trigger seal | ✅ | ❌ | ❌ |
| Accounting | ✅ | ❌ | ❌ |
| Reports | ✅ | ✅ | ❌ |
| Own data only | — | — | ✅ |

---

## Project structure

```
backend/
├── kamenge_backend/     # Django project config, main urls.py, reports views
├── users/               # Custom User model + JWT auth
├── core/                # Zone + Place models
├── merchants/           # Merchant + Contract models
├── invoicing/           # DueDateInvoice + Payment + PaymentSlip
├── disputes/            # Dispute + ReminderHistoryItem
├── accounting/          # AccountingAccount + CostCenter + AccountingEntry + DisbursementRequest
├── audit/               # AuditLog + log_action() utility
├── market_settings/     # Singleton MarketSettings model
├── core/management/
│   └── commands/seed.py # python manage.py seed
├── media/               # Uploaded files (avatars, slips, receipts)
├── manage.py
├── requirements.txt
└── .env
```

---

## Seeding & re-seeding

```bash
# First time (or after a fresh migrate)
python manage.py seed

# Wipe everything and re-seed from scratch
python manage.py seed --flush
```

---

## Connecting the React frontend

Update `src/services/mock-api.ts` (or create a real `api.ts`) to point to this backend.  
A minimal axios setup:

```ts
import axios from 'axios';

const api = axios.create({ baseURL: 'http://127.0.0.1:8000/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

---

## Production checklist

- Change `SECRET_KEY` in `.env`
- Set `DEBUG=False`
- Switch `DATABASES` to PostgreSQL
- Set `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` to your domain
- Run `python manage.py collectstatic`
- Serve media files via nginx or a CDN
