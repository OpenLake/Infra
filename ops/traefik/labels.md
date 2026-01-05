# Traefik Label Contract (MANDATORY)

Every service exposed via Traefik MUST use this pattern.

## Required labels

- traefik.enable=true
- traefik.http.routers.<service>.rule=Host(`<service>.<BASE_DOMAIN>`)
- traefik.http.routers.<service>.entrypoints=websecure
- traefik.http.routers.<service>.tls=true

## Optional (common)

- traefik.http.services.<service>.loadbalancer.server.port=<internal_port>

## Middlewares

- redirect-https (HTTP → HTTPS)
- auth-basic (dashboards/internal tools)

## Notes

- No service may expose ports directly to host.
- Traefik is the ONLY ingress.
