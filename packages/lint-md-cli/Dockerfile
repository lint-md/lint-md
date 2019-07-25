FROM node:current-alpine

WORKDIR /usr/local/lint-md

COPY ../.. .

RUN set -x \
    && npm install \
    && npm run-script build \
    && ln -s ../lint-md-cli/bin/index.js /usr/local/bin/lint-md

CMD ["lint-md"]
