######################
### STAGE 1: Build ###
FROM node:26-alpine AS builder

WORKDIR /usr/src/app
COPY . /usr/src/app
RUN rm -rf ./node_modules && npm ci && npm run build


######################
### STAGE 2: Setup ###
FROM node:26-alpine

WORKDIR /usr/src/app
COPY package.json package-lock.json /usr/src/app/
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist/ /usr/src/app/dist/

CMD ["npm", "start"]
