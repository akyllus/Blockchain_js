FROM node:18-alpine

#Create app directory
WORKDIR /app

# Install app dependencies
# Copying package.json before copying the entire source to benefit from docker cache at npm install layer
# So now basically only when package.json is modified, npm install will run again otherwise it will use from cache which is correct.
# Reference https://docs.docker.com/build/guide/layers/
COPY package.json .
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]