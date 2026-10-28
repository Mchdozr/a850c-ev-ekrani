#!/usr/bin/env bash
set -eu
script_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
remote_test_dir="$(mktemp -d)"
trap 'rm -rf "$remote_test_dir"' EXIT
javac -d "$remote_test_dir" \
  "$script_dir/../app/src/main/java/dev/evekrani/a850c/remote/LocalRemoteServer.java" \
  "$script_dir/../app/src/test/java/dev/evekrani/a850c/remote/LocalRemoteServerTest.java"
java -cp "$remote_test_dir" dev.evekrani.a850c.remote.LocalRemoteServerTest
