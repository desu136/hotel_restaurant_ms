#!/usr/bin/env python3
"""Insert named dfoodie.et / www.dfoodie.et vhosts into hulesport nginx.

Adds server blocks only. Does not change hulesport.com, agent, or cashbox vhosts.
Writes in-place (same inode) so `nginx -s reload` picks it up. Never recreates nginx.
"""
from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

MARKER = "  # --- default: raw IP / local dev (path-based /agent/) ---"
BEGIN = "  # --- DFoodie (RMS) ---"
END = "  # --- end DFoodie (RMS) ---"

HTTP_BLOCK = """
  # --- DFoodie (RMS) ---
  server {
    listen 80;
    server_name dfoodie.et www.dfoodie.et;

    location ^~ /.well-known/acme-challenge/ {
      root /var/www/certbot;
      default_type "text/plain";
    }

    location = / {
      return 302 /rms;
    }

    location ^~ /rms {
      resolver 127.0.0.11 ipv6=off valid=10s;
      set $rms_upstream http://rms-frontend:3000;
      proxy_pass $rms_upstream;
      proxy_http_version 1.1;
      proxy_set_header Host $http_host;
      proxy_set_header X-Forwarded-Host $http_host;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
      proxy_read_timeout 60s;
      client_max_body_size 20m;
    }

    location / {
      return 302 /rms;
    }
  }
"""

HTTPS_BLOCK = """
  server {
    listen 443 ssl;
    http2 on;
    server_name dfoodie.et www.dfoodie.et;

    ssl_certificate     /etc/letsencrypt/live/dfoodie.et/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dfoodie.et/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    location ^~ /.well-known/acme-challenge/ {
      root /var/www/certbot;
      default_type "text/plain";
    }

    location = / {
      return 302 /rms;
    }

    location ^~ /rms {
      resolver 127.0.0.11 ipv6=off valid=10s;
      set $rms_upstream http://rms-frontend:3000;
      proxy_pass $rms_upstream;
      proxy_http_version 1.1;
      proxy_set_header Host $http_host;
      proxy_set_header X-Forwarded-Host $http_host;
      proxy_set_header X-Forwarded-Proto https;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection $connection_upgrade;
      proxy_read_timeout 60s;
      client_max_body_size 20m;
    }

    location / {
      return 302 /rms;
    }
  }
  # --- end DFoodie (RMS) ---
"""


def dfoodie_block(include_https: bool) -> str:
    body = HTTP_BLOCK.rstrip()
    if include_https:
        body += "\n" + HTTPS_BLOCK.rstrip()
    else:
        body += "\n  # --- end DFoodie (RMS) ---"
    return body + "\n\n"


def strip_existing(text: str) -> str:
    start = text.find(BEGIN)
    if start < 0:
        return text
    end = text.find(END)
    if end < 0:
        raise SystemExit("found DFoodie begin marker without end marker")
    end = end + len(END)
    while end < len(text) and text[end] == "\n":
        end += 1
    return text[:start] + text[end:]


def patch_text(text: str, include_https: bool) -> str:
    text = strip_existing(text)
    idx = text.find(MARKER)
    if idx < 0:
        raise SystemExit(f"marker not found: {MARKER!r}")
    return text[:idx] + dfoodie_block(include_https) + text[idx:]


def write_inplace(path: Path, content: str) -> None:
    data = content.encode()
    fd = os.open(str(path), os.O_WRONLY | os.O_TRUNC)
    try:
        os.write(fd, data)
    finally:
        os.close(fd)


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: install-dfoodie-vhost.py <nginx.conf> [--https]")
    path = Path(sys.argv[1])
    include_https = "--https" in sys.argv[2:]
    original = path.read_text()
    bak = path.with_suffix(path.suffix + ".bak.dfoodie")
    if not bak.exists():
        shutil.copy2(path, bak)
        print(f"backup {bak}")
    patched = patch_text(original, include_https)
    write_inplace(path, patched)
    print(f"wrote {path} https={include_https} bytes={len(patched)}")


if __name__ == "__main__":
    main()
