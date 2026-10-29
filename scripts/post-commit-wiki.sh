#!/usr/bin/env bash
# Post-commit hook: appende le info del commit in WikiDev/wealth-pillar/log.md

VAULT_LOG="/Users/ivanapiscitelli/Documents/Dev/Colloquio Edo/WikiDev/wealth-pillar/log.md"

if [ ! -f "$VAULT_LOG" ]; then
  echo "Wiki log non trovato a: $VAULT_LOG"
  exit 0
fi

DATE=$(date +"%Y-%m-%d")
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B | head -n 1)

ENTRY="- [${DATE}] commit (${COMMIT_HASH}) | ${COMMIT_MSG}"

# Verifica se il log non contiene già questa riga per evitare duplicati
if ! grep -q "${COMMIT_HASH}" "$VAULT_LOG"; then
  echo "$ENTRY" >> "$VAULT_LOG"
  echo "Obsidian Wiki Log aggiornato: $ENTRY"
fi
