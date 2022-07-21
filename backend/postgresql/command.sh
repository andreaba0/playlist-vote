#!/bin/bash

if [ $1 == "start-dev" ]; then
    echo "build e avvio database..."
    docker stop vote_server
    docker rm vote_server
    docker build --tag vote_server_image .
    docker run -p 5432:5432 --name vote_server vote_server_image:latest
elif [ $1 == "start-prod" ]; then
    echo "build e avvio database..."
    docker stop vote_server
    docker rm vote_server
    docker build --tag vote_server_image .
    docker run -p $2:5432:5432 --name vote_server -d vote_server_image:latest
elif [ $1 == "stop-server" ]; then
    echo "Stopping the server..."
    docker stop vote_server
    docker rm vote_server
elif [ $1 == "schema.sql" ]; then
    echo "creazione schema"
    PGPASSWORD=password psql "sslmode=disable user=andrea dbname=vote hostaddr=127.0.0.1" -f schema.sql
elif [ $1 == "insert.sql" ]; then
    echo "inserimento data test"
    PGPASSWORD=password psql "sslmode=disable user=andrea dbname=vote hostaddr=127.0.0.1" -f insert.sql
elif [ $1 == "delete.sql" ]; then
    echo "rimozioni dati..."
    PGPASSWORD=password psql "sslmode=disable user=andrea dbname=vote hostaddr=127.0.0.1" -f delete.sql
elif [ $1 == "join" ]; then
    echo "Esecuzione query"
    PGPASSWORD=password psql "sslmode=disable user=andrea dbname=vote hostaddr=127.0.0.1"
else
    echo "Comando sconosciuto";
fi