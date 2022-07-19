#!/bin/bash

if [ $1 == "start-dev" ]; then
    echo "build e avvio database..."
    docker stop redis_server
    docker rm redis_server
    docker build --tag redis_server_image .
    docker run -p 20000:6379 --name redis_server redis_server_image:latest
else
    echo "Comando sconosciuto";
fi