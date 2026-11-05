#!/usr/bin/env bash
set -euo pipefail

PGHOST="${PGHOST:-db}"
PGUSER="${POSTGRES_USER:-sigc}"
PGDATABASE="${POSTGRES_DB:-sigc}"
export PGPASSWORD="${POSTGRES_PASSWORD:-sigc}"
export PGHOST PGUSER PGDATABASE

echo "[seed] Esperando a Postgres en ${PGHOST}..."
until pg_isready -q; do
  sleep 1
done
echo "[seed] Postgres listo."

SCHEMA_EXISTS="$(psql -Atqc "SELECT 1 FROM pg_namespace WHERE nspname = 'seguridad'")"
if [[ "${SCHEMA_EXISTS}" == "1" ]]; then
  if DATA_EXISTS="$(psql -Atqc "SELECT 1 FROM seguridad.rol LIMIT 1" 2>/dev/null)" \
    && [[ "${DATA_EXISTS}" == "1" ]]; then
    echo "[seed] Schema y datos ya existen; nada que hacer."
    exit 0
  fi

  echo "[seed] ERROR: existe el schema 'seguridad', pero faltan datos de seed." >&2
  echo "[seed] Elimine el volumen con 'docker compose down -v' y vuelva a iniciar." >&2
  exit 1
fi

echo "[seed] Aplicando 01_schema.sql..."
psql -v ON_ERROR_STOP=1 -1 -f /scripts/01_schema.sql

echo "[seed] Aplicando 02_data.sql..."
psql -v ON_ERROR_STOP=1 -f /scripts/02_data.sql

echo "[seed] Migración y datos de prueba aplicados."
