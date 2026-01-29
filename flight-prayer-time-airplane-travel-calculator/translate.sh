#!/bin/bash
# Shell script that takes a json file and generates translations of the index.html file!. Json file format used is created by pasting the string from here https://codepen.io/saamerm/pen/NWVZyEm
# Run by placing this file in the same folder as the index.html and the json file using `sh translate.sh`
# Edit below JSON file containing translations
TRANSLATION_FILE="languages.json"
# Define the language codes
languageCodes=("ES" "FR" "PT" "AR" "RU" "DE" "UK" "HI" "UR" "YO" "ID" "IT" "JA" "SW" "PL" "VI" "RO" "zh-Hant" "ZH" "HR" "FA" "NL" "KO" "SV" "HU" "SQ")

# Check if translation file exists
if [ ! -f "$TRANSLATION_FILE" ]; then
    echo "Translation file '$TRANSLATION_FILE' not found."
    exit 1
fi

# Create a temporary file to store JSON data
tmp_file=$(mktemp)

# Extract translations to temporary file
jq -c ".[]" "$TRANSLATION_FILE" > "$tmp_file"

# Function to escape special characters for sed
escape_sed() {
    echo "$1" | gsed -e 's/[\/&]/\\&/g' -e 's/(/\\(/g' -e 's/)/\\)/g'
}

# Iterate through each language and perform translations
for lang in "${languageCodes[@]}"; do
    lowerCode=$(echo "$lang" | tr '[:upper:]' '[:lower:]')
    html_file=index-${lowerCode}.html
    if [ ! -f "$html_file" ]; then
        echo "HTML file '$html_file' for language '$lang' not found."
    else
        echo "Applying translations for language '$lang' to HTML file '$html_file'..."

        # Generate sed commands for current language
        sed_commands=""
        while IFS= read -r line; do
            en_value=$(echo "$line" | jq -r '.EN // empty')
            # echo $en_value #Uncomment to debug
            lang_value=$(echo "$line" | jq -r ".$lang // empty")
            # echo $lang_value #Uncomment to debug

            if [ -n "$en_value" ] && [ -n "$lang_value" ]; then
                escaped_en_value=$(escape_sed "$en_value")
                escaped_lang_value=$(escape_sed "$lang_value")
                # echo $escaped_en_value #Uncomment to debug
                # echo $escaped_lang_value #Uncomment to debug
                # Use different delimiter in sed command to avoid issues with special characters
                sed_commands+="s#${escaped_en_value}#${escaped_lang_value}#g;"
# sudo sed -i    "s/#Banner none/Banner \/etc\/sshd_banner" /etc/sshd_config OLD
# sudo sed -i ""  "s|#Banner none|Banner /etc/sshd_banner|" /etc/sshd_config MAC
            fi
        done < "$tmp_file"

        # Perform sed replacement on the HTML file
        gsed -i.bak -e "$sed_commands" "$html_file"
        echo "Translations applied for language '$lang'."
    fi
done

echo "All translations applied successfully."