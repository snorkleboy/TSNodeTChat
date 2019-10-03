#!/bin/bash
echo "start building";
echo "clearing build folder";
rm -Rf ./build

echo "building";
npx tsc ./src/index.ts  --outDir ./build
