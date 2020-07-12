#!/bin/bash

docker login -u $DOCKER_HUB_LOGIN -p $DOCKER_HUB_PASSWORD

./create-version-file.sh
export VERSION=$(cat .version)

docker tag orbsnetwork/ethereum-writer:$VERSION orbsnetworkstaging/ethereum-writer:$VERSION
docker push orbsnetworkstaging/ethereum-writer:$VERSION
