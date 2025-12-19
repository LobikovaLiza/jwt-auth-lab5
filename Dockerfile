FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

COPY wait-for-it.sh ./
RUN chmod +x wait-for-it.sh

EXPOSE 8080
CMD ["./wait-for-it.sh", "db", "--", "node", "server.js"]