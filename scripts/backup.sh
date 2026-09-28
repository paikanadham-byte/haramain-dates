#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077
mkdir -p backups
name="backups/haramain-source-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
# Store data now lives in PostgreSQL (Neon), not on local disk. This archive
# covers source and any local .env files only; keep it private.
tar --exclude='./.git' --exclude='./node_modules' --exclude='./dist' --exclude='./backups' --exclude='./.cache' -czf "$name" .
printf 'Source and local config backup: %s\n' "$name"
printf 'For the live database, take a Neon branch/snapshot or run: pg_dump "$DATABASE_URL" > backups/db-%s.sql\n' "$(date -u +%Y%m%dT%H%M%SZ)"
printf 'The admin dashboard Backup & handover tab also exports current store data as JSON. Store all backups encrypted, off-server, under your company account.\n'
