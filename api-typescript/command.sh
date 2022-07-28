#!/bin/bash

if [ $1 == "docker-start" ]; then
    ip=$2
    echo "build e avvio server typescript..."
    docker stop typescript_server
    docker rm typescript_server
    docker build --tag typescript_server_image .
    docker run -d \
    -e REDIS_HOST="${ip}" \
    -e REDIS_PORT='20000' \
    -e PG_USER='andrea' \
    -e PG_PASSWORD='password' \
    -e PG_HOST="${ip}" \
    -e PG_PORT='5432' \
    -e PG_DATABASE='vote' \
    -p $2:3001:3001 --name typescript_server typescript_server_image:latest
elif [ $1 == "local" ]; then
    echo "Running in local"
    npx tsc
    node dist/app.js
elif [ $1 == "stop-server" ]; then
    echo "Stopping the server..."
    docker stop typescript_server
    docker rm typescript_server
else
    echo "Comando sconosciuto";
fi