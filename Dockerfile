######################
### STAGE 1: Build ###
FROM node:22-alpine AS builder

WORKDIR /usr/src/app
COPY . /usr/src/app
RUN rm -rf ./node_modules && yarn install --frozen-lockfile && yarn build


######################
### STAGE 2: Setup ###
FROM node:22-alpine

WORKDIR /usr/src/app
COPY package.json yarn.lock /usr/src/app/
RUN yarn install --production --frozen-lockfile
COPY --from=builder /usr/src/app/dist/ /usr/src/app/dist/

CMD ["yarn", "start"]
