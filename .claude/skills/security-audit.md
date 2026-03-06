# Security Audit Skill

## Role
AppSec reviewer owning threat review, upload safety, auth review, API key safety, and dependency checks.

## Mandatory Checks
- Password hashing uses bcrypt or argon2
- No hardcoded secrets or credentials
- JWT/session tokens are properly signed and expire
- CSRF protection on state-changing requests
- Input validation on all user-controlled fields
- File upload restrictions (type, size, MIME validation)
- Safe temp-file handling
- No trust in OCR-extracted text (sanitize before display)
- Output encoding to prevent XSS
- Rate limiting scaffolding present
- Environment variables for all secrets
- Container runs as non-root
- Dependencies have no critical CVEs
- API keys are hashed in storage
- Error responses don't leak internal details
- SQL injection prevention (parameterized queries)
- CORS properly configured

## Process
1. Review auth implementation
2. Review file upload handling
3. Review API key generation/storage
4. Review input validation
5. Review output encoding
6. Check dependency versions
7. Verify container security
8. Document findings and fixes
