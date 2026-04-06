# MVP readiness checklist — I0 SalesCore

Use this before calling the system “production ready” for a pilot or class demo.

## Security and secrets

- [ ] Set a strong `APP_JWT_SECRET` in production (never use the dev default).
- [ ] Set strong PostgreSQL credentials; restrict DB network access.
- [ ] Change the default seeded admin password (`admin` / `Admin@123`) immediately after first deploy.
- [ ] Set `APP_CORS_ALLOWED_ORIGINS` to real front-end URLs only (no `*`).
- [ ] If using CARD/MOBILE_MONEY, set `APP_PAYSTACK_SECRET_KEY` so backend verifies each Paystack reference.
- [ ] Confirm `SPRING_PROFILES_ACTIVE=prod` so stack traces are not exposed in API errors.

## Deploy and operations

- [ ] Database migrations run successfully (Flyway) on a fresh database.
- [ ] `GET /actuator/health` returns UP behind your reverse proxy / compose setup.
- [ ] Front end loads and can log in; API calls succeed (check browser network tab for `/api/v1`).

## Role smoke tests

- [ ] **CASHIER**: POS sale, receipt, refund flow, customers, refund history (as designed).
- [ ] **MANAGER**: products, inventory, suppliers, purchase orders, reports; cannot access admin-only areas.
- [ ] **ADMIN**: users, settings, backup/restore (if used), full operational access.

## Core business flows

- [ ] Create product → sell on POS → stock decreases.
- [ ] Manual inventory adjust and supplier restock appear in inventory history.
- [ ] Purchase order: create draft → approve → partial or full receive → stock increases.
- [ ] Low-stock list and “generate draft PO from low stock” (if suppliers/products configured).
- [ ] Refund (partial/full) updates stock and refund history; CSV export works.

## Data safety

- [ ] Run a JSON backup export and store it safely.
- [ ] (Recommended) Restore backup into a **test** database and verify counts and login.

## Documentation

- [ ] Operators know the admin URL, support contact, and who resets passwords.
- [ ] `docs/DEPLOYMENT.md` matches how you actually host (ports, env vars, TLS if any).

## Optional (post-MVP)

- HTTPS termination (reverse proxy or platform).
- Central logging / alerting.
- Automated integration tests in CI.
