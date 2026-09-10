#!/bin/bash

# Define the language codes
languageCodes=("EN" "ES" "FR" "PT" "AR" "RU" "DE" "UK" "HI" "UR" "YO" "ID" "IT" "JA" "SW" "PL" "VI" "RO" "zh-hant" "zh" "HR" "FA" "NL" "KO" "SV" "HU" "SQ")

# Backup the original sitemap.xml
cp sitemap.xml sitemap.xml.bak

# Remove the closing </urlset> tag
sed -i '$d' sitemap.xml

# Get the current date in the correct format
currentDate=$(date +"%Y-%m-%dT%H:%M:%S+00:00")

# Append new entries to the sitemap.xml
for code in "${languageCodes[@]}"
do
    lowerCode=$(echo "$code" | tr '[:upper:]' '[:lower:]')
    echo "  <url>" >> sitemap.xml
    echo "    <loc>https://thefirstprototype.com/flight-prayer-time-airplane-travel-calculator/index-${lowerCode}.html</loc>" >> sitemap.xml
    echo "    <lastmod>${currentDate}</lastmod>" >> sitemap.xml
    echo "    <priority>0.80</priority>" >> sitemap.xml
    echo "  </url>" >> sitemap.xml
done

# Add the closing </urlset> tag back
echo "</urlset>" >> sitemap.xml

echo "sitemap.xml has been updated."
