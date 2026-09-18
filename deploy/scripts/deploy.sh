#!/usr/bin/env bash
# RMS-only deploy. Never exec, restart, reload, or edit hulesport/betting.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE="$ROOT/deploy/docker/docker-compose.yml"
ENV_FILE="$ROOT/.env"
CERT_DIR="$ROOT/deploy/docker/certs"
HTTPS_URL="https://134.122.73.65:8443/rms"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "▶ creating $ENV_FILE"
  JWT="$(openssl rand -hex 32)"
  DBPASS="$(openssl rand -hex 16)"
  cat > "$ENV_FILE" <<EOF
POSTGRES_USER=rms
POSTGRES_PASSWORD=$DBPASS
POSTGRES_DB=rms
JWT_SECRET=$JWT
FRONTEND_URL=$HTTPS_URL
NEXT_PUBLIC_BASE_PATH=/rms
COOKIE_SECURE=true
SEED_DEMO=true
BACKEND_URL=http://backend:4000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EOF
  chmod 600 "$ENV_FILE"
else
  echo "▶ using existing $ENV_FILE (HTTPS URL/cookie only)"
  python3 - "$ENV_FILE" "$HTTPS_URL" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
https_url = sys.argv[2]
replacements = {
    "FRONTEND_URL": https_url,
    "COOKIE_SECURE": "true",
}
lines = []
seen = set()
for line in path.read_text().splitlines():
    raw = line.strip()
    if raw and not raw.startswith("#") and "=" in line:
        key = line.split("=", 1)[0]
        if key in replacements:
            lines.append(f"{key}={replacements[key]}")
            seen.add(key)
            continue
    lines.append(line)
for key, value in replacements.items():
    if key not in seen:
        lines.append(f"{key}={value}")
path.write_text("\n".join(lines) + "\n")
PY
fi

mkdir -p "$CERT_DIR"
if [[ ! -f "$CERT_DIR/fullchain.pem" || ! -f "$CERT_DIR/privkey.pem" ]]; then
  echo "▶ generating RMS TLS cert (IP SAN, self-signed)"
  openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
    -keyout "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem" \
    -subj "/CN=134.122.73.65" \
    -addext "subjectAltName=IP:134.122.73.65"
  chmod 600 "$CERT_DIR/privkey.pem"
fi

echo "▶ docker compose build/up (project name rms only — betting is never referenced)"
docker compose -p rms -f "$COMPOSE" --env-file "$ENV_FILE" up -d --build

echo "▶ wait for RMS proxy"
for i in $(seq 1 40); do
  if curl -skf "https://127.0.0.1:8443/rms/login" >/dev/null 2>&1; then
    echo "RMS https is up"
    break
  fi
  sleep 3
done

echo "▶ public check"
curl -skI "https://127.0.0.1:8443/rms/login" | head -20
echo
echo "RMS: $HTTPS_URL"
echo "Login: admin@hospitalityhub.com / admin123"
