#!/bin/sh
# La base Postgres locale d'Au crible 2027, pour le développement et les tests : un conteneur Docker sur le port 5447,
# avec deux bases, « aucrible » (pnpm dev) et « aucrible_test » (les tests de bout en bout). En ligne, c'est la base
# Postgres du projet Vercel (Neon) qui sert, par la variable DATABASE_URL.
set -e
if ! docker container inspect aucrible-db >/dev/null 2>&1; then
  docker run -d --name aucrible-db -p 127.0.0.1:5447:5432 \
    -e POSTGRES_USER=aucrible -e POSTGRES_PASSWORD=aucrible -e POSTGRES_DB=aucrible \
    -v aucrible-db:/var/lib/postgresql/data postgres:17-alpine >/dev/null
fi
docker start aucrible-db >/dev/null
until docker exec aucrible-db pg_isready -U aucrible -q; do sleep 1; done
docker exec aucrible-db psql -U aucrible -tc "SELECT 1 FROM pg_database WHERE datname = 'aucrible_test'" | grep -q 1 \
  || docker exec aucrible-db psql -U aucrible -qc "CREATE DATABASE aucrible_test"
echo "Postgres prêt : postgres://aucrible:aucrible@127.0.0.1:5447/aucrible (et aucrible_test)"
