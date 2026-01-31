# DORA Compliance Checker

DORA (Digital Operational Resilience Act, EU 2022/2554) Article 30 ICT contract compliance assessment platform for financial institutions.

## Overview

This application helps financial institutions evaluate their ICT service contracts against the 37 requirements of DORA Article 30. It provides two assessment modes:

1. **Questionnaire Assessment** — Interactive checklist covering all DORA Art. 30 requirements with weighted scoring, maturity analysis, and auto-generated contract clauses
2. **AI-Powered Contract Analysis** — Upload a PDF/DOCX contract and get an automated defensibility analysis against all 37 DORA requirements using Claude AI

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Browser    │────▶│    Caddy     │────▶│   Angular    │     │            │
│              │     │  (SSL/TLS)  │     │  Frontend    │────▶│  Spring    │
└─────────────┘     └─────────────┘     └──────────────┘     │  Boot API  │
                                                              │            │
                                                              │  ┌──────┐  │
                                                              │  │Claude│  │
                                                              │  │ API  │  │
                                                              │  └──────┘  │
                                                              └─────┬──────┘
                                                                    │
                                                              ┌─────▼──────┐
                                                              │ PostgreSQL │
                                                              └────────────┘
```

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | Angular 19, TypeScript 5.7, Tailwind CSS |
| Backend        | Spring Boot 3.2, Java 21            |
| Database       | PostgreSQL 16                       |
| AI Engine      | Anthropic Claude API                |
| PDF Processing | iText 7, Apache POI                 |
| Reverse Proxy  | Caddy 2 (automatic HTTPS)           |
| Containers     | Docker, Docker Compose              |

## Features

- 37 DORA Article 30 compliance questions with weighted scoring
- 5-level maturity model per compliance category (15 categories)
- Penalty risk estimation algorithm
- AI-powered contract document analysis (PDF/DOCX)
- Defensibility score with evidence mapping
- Auto-generated contract clause templates in Estonian
- PDF report generation for both assessment modes
- Assessment history, comparison, and analytics dashboard
- Digital compliance certificates
- Bilingual interface (Estonian / English)
- Responsive design with dark theme

## Prerequisites

- Docker & Docker Compose
- Anthropic API key (for contract analysis feature)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dora-compliance-checker
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and set your values:
   #   ANTHROPIC_API_KEY=sk-ant-...
   #   POSTGRES_PASSWORD=your_secure_password
   ```

3. **Start all services**
   ```bash
   docker compose up -d
   ```

4. **Access the application**
   - Frontend: https://localhost (or your configured domain)
   - API docs: https://localhost/swagger-ui.html

## Local Development

### Backend

```bash
cd backend

# Start PostgreSQL locally (or use Docker)
docker run -d --name dora-pg -p 5432:5432 \
  -e POSTGRES_DB=doradb -e POSTGRES_USER=dora -e POSTGRES_PASSWORD=dora_secret \
  postgres:16-alpine

# Run the application
./mvnw spring-boot:run

# Run tests
./mvnw test
```

### Frontend

```bash
cd frontend
npm install
ng serve
# Open http://localhost:4200
```

## API Endpoints

| Method | Endpoint                              | Description                      |
|--------|---------------------------------------|----------------------------------|
| GET    | `/api/questions`                      | Get all 37 DORA questions        |
| POST   | `/api/assessments`                    | Submit compliance assessment     |
| GET    | `/api/assessments/{id}`               | Get assessment result            |
| GET    | `/api/assessments/{id}/report`        | Download PDF report              |
| POST   | `/api/contract-analysis`              | Upload & analyze contract        |
| GET    | `/api/contract-analysis/{id}`         | Get contract analysis result     |
| GET    | `/api/contract-analysis/{id}/report`  | Download analysis PDF report     |
| GET    | `/api/contract-analysis/sample/{level}` | Download sample contract (good/medium/weak) |

## Compliance Scoring

### Assessment Scoring
- **Weighted Score**: Each question has a weight (1-3) and severity (CRITICAL/HIGH/MEDIUM)
- **Compliance Levels**: GREEN (≥80%), YELLOW (50-79%), RED (<50%)
- **Maturity Model**: 5 levels per category — Initial, Repeatable, Defined, Managed, Optimized

### Contract Defensibility Score
- Each requirement evaluated as COVERED (1.0), WEAK (0.4), or MISSING (0.0)
- Weighted by question importance and severity multiplier (CRITICAL=3x, HIGH=2x, MEDIUM=1x)
- Score range: 0-100%

## Project Structure

```
dora-compliance-checker/
├── backend/
│   ├── src/main/java/com/dorachecker/
│   │   ├── controller/          # REST API controllers
│   │   ├── model/               # JPA entities, records, DTOs
│   │   └── service/             # Business logic & integrations
│   ├── src/test/                # Unit & integration tests
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/app/
│   │   ├── pages/               # Feature components (9 pages)
│   │   ├── api.service.ts       # HTTP client
│   │   ├── lang.service.ts      # i18n (ET/EN)
│   │   └── models.ts            # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── Caddyfile
└── README.md
```

## Testing

```bash
# Backend unit & integration tests
cd backend
./mvnw test

# Frontend tests
cd frontend
ng test
```

## Environment Variables

| Variable            | Description                    | Default               |
|---------------------|--------------------------------|-----------------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude   | —                     |
| `POSTGRES_PASSWORD` | PostgreSQL database password   | `dora_secret`         |
| `DATABASE_URL`      | JDBC connection URL            | `jdbc:postgresql://localhost:5432/doradb` |
| `CORS_ORIGINS`      | Allowed CORS origins           | `http://localhost:4200,http://localhost:80` |

## License

Proprietary. All rights reserved.
