#!/bin/bash
echo "start building";
echo "clearing build folder";
rm -Rf ./build

echo "building backend";
npx tsc --p ./tsconfig.json
echo "building frontend";
npx webpack