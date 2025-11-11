#!/bin/bash

# This script generates TypeScript interfaces from Python with the pydantic_to_typescript library

# Install pydantic-to-typescript if not already installed
if ! python3 -c "import pydantic" 2>/dev/null; then
    echo "pydantic-to-typescript not found, installing..."
    pip install pydantic-to-typescript --break-system-packages
fi
    
# All types defined in api/types.py are converted to TypeScript and saved in src/types.ts
pydantic2ts --module ./api/api_types.py --output ./ui/src/types.ts 