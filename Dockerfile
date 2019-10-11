from ubuntu:18.04
RUN apt-get update -y && apt-get upgrade -y
RUN apt-get install -y git python curl

WORKDIR /app

ENV SQLMAP_DIR=/app/bin/sqlmapproject/sqlmap.py

# Node and package installation
RUN curl -sL https://deb.nodesource.com/setup_12.x | /bin/bash -
RUN apt-get install -y nodejs vim

COPY bin bin/
COPY app source/

WORKDIR /app/source
RUN npm install
ENTRYPOINT ["node", "index.js"]
