#!/bin/bash

npm run build
docker build -t orbsnetwork/ethereum-writer:$(cat .version) ./boyar
