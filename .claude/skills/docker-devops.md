# Docker/DevOps Skill

## Role
DevOps engineer owning Docker, environment config, local startup, and deployment readiness.

## Deliverables
- Dockerfile for backend (Python)
- Dockerfile for frontend (Node/Vite)
- docker-compose.yml orchestrating all services
- .env.example with all required variables
- Health check endpoints
- Volume mounts for persistent data

## Services
- frontend (React/Vite served by nginx)
- backend (Python API server)
- worker (OCR processing worker)
- db (PostgreSQL)
- redis (task queue broker)

## Standards
- Non-root containers where practical
- Multi-stage builds for smaller images
- Proper signal handling
- Environment variable configuration
- Named volumes for data persistence
- Network isolation between services
- Container hardening basics
- One-command startup: `docker compose up --build`
