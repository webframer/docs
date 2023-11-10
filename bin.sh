#!/usr/bin/env bash

# Get directory path of this file because it will be symlinked
SOURCE=${BASH_SOURCE[0]}
while [ -L "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR=$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )
  SOURCE=$(readlink "$SOURCE")
  [[ $SOURCE != /* ]] && SOURCE=$DIR/$SOURCE # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR=$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )

# Use locally installed babel-node to avoid asking users for global install
$DIR/node_modules/.bin/babel-node --inspect $DIR/cli.js "$@"
# 👆https://onpointplugins.com/node-as-a-cli/#using-the-babel-node-command-utility
# We need babel-node for dynamic import of components files that import json files
