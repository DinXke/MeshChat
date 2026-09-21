#!/usr/bin/env bash
# Bouwt ../meshchat.html uit de losse delen in deze map. Gebruik: bash build.sh
set -e
cd "$(dirname "$0")"
cat core.js core2.js app1.js app2.js app3.js app4.js > .all.js
node --check .all.js
{
  sed -n '1,311p' design.html | sed 's#<title>MeshCore IRC</title>#<title>MeshChat</title>#'
  cat extra.css
  echo '</style>'
  echo '</head>'
  cat body.html
  echo '<script>'
  cat .all.js
  echo '</script>'
  echo '</body>'
  echo '</html>'
} > ../meshchat.html
rm -f .all.js
echo "meshchat.html: $(wc -c < ../meshchat.html) bytes"
