# I0 SalesCore

POS, inventory, suppliers, purchase orders, refunds, and reporting — Spring Boot + React (Vite).

## Quick start

- **Local dev**: see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (PostgreSQL + `./mvnw spring-boot:run` + `npm run dev`).
- **Docker**: copy [.env.example](.env.example) to `.env`, set secrets, then `docker compose up --build`.

## Docs

- [Deployment runbook](docs/DEPLOYMENT.md)
- [MVP checklist](docs/MVP_CHECKLIST.md)

## Default admin (development seed)

After migrations: username `admin`, password `Admin@123` — **change in production**.

## API health

`GET /actuator/health`
