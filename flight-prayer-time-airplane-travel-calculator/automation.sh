#!/bin/bash

# Define the language codes
languageCodes=("EN" "ES" "FR" "PT" "AR" "RU" "DE" "UK" "HI" "UR" "YO" "ID" "IT" "JA" "SW" "PL" "VI" "RO" "zh-Hant" "ZH" "HR" "FA" "NL" "KO" "SV" "HU" "SQ")

# Loop through each language code, convert to lowercase, and copy the file
for code in "${languageCodes[@]}"
do
    lowerCode=$(echo "$code" | tr '[:upper:]' '[:lower:]')
    cp index.html "index-${lowerCode}.html"
done

echo "Files have been copied."
