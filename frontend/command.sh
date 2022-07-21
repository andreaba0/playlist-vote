#!/bin/bash

if [ $1 == "docker-start" ]; then
    ip=$2
    echo "build e avvio server next in dev mode..."
    docker stop next_server
    docker rm next_server
    docker build --tag next_server_image .
    docker run -d \
    -e REDIS_HOST="${ip}" \
    -e REDIS_PORT='20000' \
    -e PG_USER='andrea' \
    -e PG_PASSWORD='password' \
    -e PG_HOST="${ip}" \
    -e PG_PORT='5432' \
    -e PG_DATABASE='vote' \
    -p $2:3000:3000 --name next_server next_server_image:latest
elif [ $1 == "local" ]; then
    echo "Running in local"
    npm run dev
elif [ $1 == "stop-server" ]; then
    echo "Stopping the server..."
    docker stop next_server
    docker rm next_server
else
    echo "Comando sconosciuto";
fi