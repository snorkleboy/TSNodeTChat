#!/bin/bash
echo "start building";
echo "clearing build folder";
rm -Rf ./build

echo "building";
npx tsc --p ./tsconfig.json
