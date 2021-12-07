FROM node:16-alpine

ENV NODE_ENV production

WORKDIR /opt/orbs

COPY package*.json ./
COPY .version ./version

RUN apk add --no-cache git
RUN npm install

COPY dist ./dist

CMD [ "npm", "start" ]
