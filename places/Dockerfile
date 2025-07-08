# Simple Dockerfile for Next.js app
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build

CMD ["npm", "run", "start"]
