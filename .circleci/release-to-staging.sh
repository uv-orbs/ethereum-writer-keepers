#!/bin/bash

docker login -u $DOCKER_HUB_LOGIN -p $DOCKER_HUB_PASSWORD

export VERSION=$(cat .version)

docker push orbsnetworkstaging/ethereum-writer:$VERSION

if [[ $CIRCLE_BRANCH == "master" ]] ;
then
  docker tag orbsnetworkstaging/ethereum-writer:$VERSION orbsnetworkstaging/ethereum-writer:experimental
  docker push orbsnetworkstaging/ethereum-writer:experimental
fi
