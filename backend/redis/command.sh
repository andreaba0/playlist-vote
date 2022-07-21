#!/bin/bash

if [ $1 == "start-dev" ]; then
    echo "build e avvio database..."
    docker stop redis_server
    docker rm redis_server
    docker build --tag redis_server_image .
    docker run -p 20000:6379 --name redis_server redis_server_image:latest
elif [ $1 == "stop-server" ]; then
    echo "Stopping the server..."
    docker stop redis_server
    docker rm redis_server
elif [ $1 == "start-prod" ]; then
    echo "build e avvio database..."
    docker stop redis_server
    docker rm redis_server
    docker build --tag redis_server_image .
    docker run -p $2:20000:6379 --name redis_server -d redis_server_image:latest
else
    echo "Comando sconosciuto";
fi