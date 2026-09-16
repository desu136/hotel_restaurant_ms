#!/usr/bin/env python3
"""Point nginx default_server (raw IP) at RMS. Keep hulesport.com vhosts unchanged.
Writes in-place (same inode) so a reload picks up the bind mount. Never recreates nginx.
"""
from __future__ import annotations

import os
import re
import shutil
import sys
from pathlib import Path

RMS_BLOCK = re.compile(
    r"\n    # --- RMS \(hotel restaurant\) ---.*?"
    r"proxy_read_timeout 60s;\n    \}",
    re.S,
)

DEFAULT_MARK = "  # --- default: raw IP"

NEW_DEFAULT = """
  # --- default: raw IP is RMS. hulesport.com / agent / cashbox vhosts are unchanged. ---
  server {
    listen 80 default_server;
    server_name _;

    location ^~ /.well-known/acme-challenge/ {
      root /var/www/certbot;
      default_type "text/plain";
    }

    location / {
      return 301 https://$host$request_uri;
    }
  }

  server {
    listen 443 ssl default_server;
    http2 on;
    server_name _;

    ssl_certificate     /etc/letsencrypt/rms-ip/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/rms-ip/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

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
    }

    location / {
      return 302 /rms;
    }
  }
"""


def patch_text(text: str, path: str) -> str:
    text, n = RMS_BLOCK.subn("\n", text)
    print(f"{path}: removed {n} RMS location block(s) from named vhosts")
    start = text.find(DEFAULT_MARK)
    if start < 0:
        start = text.find("  # --- default: raw IP is RMS.")
    if start < 0:
        raise SystemExit(f"default_server marker not found in {path}")
    return text[:start].rstrip() + "\n" + NEW_DEFAULT.rstrip() + "\n}\n"


def write_inplace(path: Path, content: str) -> None:
    data = content.encode()
    fd = os.open(str(path), os.O_WRONLY | os.O_TRUNC)
    try:
        os.write(fd, data)
    finally:
        os.close(fd)


def main() -> None:
    files = sys.argv[1:]
    if not files:
        raise SystemExit("usage: bind-ip-default-to-rms.py <nginx files>")
    for raw in files:
        path = Path(raw)
        original = path.read_text()
        bak = path.with_suffix(path.suffix + ".bak.ip-rms")
        if not bak.exists():
            shutil.copy2(path, bak)
            print(f"backup {bak}")
        patched = patch_text(original, str(path))
        write_inplace(path, patched)
        print(f"wrote {path} inode-in-place bytes={len(patched)}")


if __name__ == "__main__":
    main()
