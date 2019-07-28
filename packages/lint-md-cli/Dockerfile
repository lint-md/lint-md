FROM node:current-alpine

WORKDIR /usr/local/lint-md

COPY . .

RUN set -x \
    && yarn install --production \
    && ln -s ./bin/index.js /usr/local/bin/lint-md

ENTRYPOINT ["lint-md"]
