#!/bin/bash

# Update all axios imports and calls to use the new api service
cd client/src

# Find all files with axios imports
files=$(find . -name "*.tsx" -o -name "*.ts" | xargs grep -l "import axios")

for file in $files; do
  echo "Updating $file..."
  
  # Replace axios import with api import
  sed -i '' 's/import axios from '\''axios'\'';/import api from '\''..\/services\/api'\'';/g' "$file"
  
  # Replace axios.get with api.get
  sed -i '' 's/axios\.get/api.get/g' "$file"
  
  # Replace axios.post with api.post
  sed -i '' 's/axios\.post/api.post/g' "$file"
  
  # Replace axios.put with api.put
  sed -i '' 's/axios\.put/api.put/g' "$file"
  
  # Replace axios.delete with api.delete
  sed -i '' 's/axios\.delete/api.delete/g' "$file"
done

echo "All files updated!"
