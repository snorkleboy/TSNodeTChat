#!/bin/bash
echo "building client";
npx tsc tcpClient/client.ts  --outDir ./build/tcpClient
echo "building server";
npx tsc server/index.ts  --outDir ./build/server
