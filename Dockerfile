FROM node:14-alpine

ENV NODE_ENV production

WORKDIR /opt/orbs

COPY package*.json ./

RUN apk add --no-cache git
RUN npm install

COPY dist ./dist

CMD [ "npm", "start" ]
