#!/usr/bin/env bash

set -euo pipefail

TRANSLATIONS_FILE="translations.json"

languageCodes=("ES" "FR" "PT" "AR" "RU" "DE" "UK" "HI" "UR" "YO" "ID" "IT" "JA" "SW" "PL" "VI" "RO" "zh-Hant" "ZH" "HR" "FA" "NL" "KO" "SV" "HU" "SQ")

for LANG in "${languageCodes[@]}"; do
  LANG_LOWER=$(echo "$LANG" | tr '[:upper:]' '[:lower:]')
  TARGET_FILE="index-${LANG_LOWER}.html"

  if [[ ! -f "$TARGET_FILE" ]]; then
    echo "⚠️  Skipping $TARGET_FILE (file not found)"
    continue
  fi

  echo "🌍 Translating $TARGET_FILE"

  jq -r --arg lang "$LANG" '
    .[] | select(.EN and .[$lang]) | [.EN, .[$lang]] | @tsv
  ' "$TRANSLATIONS_FILE" | while IFS=$'\t' read -r EN_TEXT LANG_TEXT; do

    # Escape for sed
    EN_ESCAPED=$(printf '%s\n' "$EN_TEXT" | sed -e 's/[\/&]/\\&/g')
    LANG_ESCAPED=$(printf '%s\n' "$LANG_TEXT" | sed -e 's/[\/&]/\\&/g')

    sed -i '' "s/${EN_ESCAPED}/${LANG_ESCAPED}/g" "$TARGET_FILE"
  done
done

echo "✅ Translation complete"