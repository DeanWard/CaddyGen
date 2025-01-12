FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
COPY .docker.env /app/.env
RUN npx vite build


# frontend
FROM nginx:alpine AS frontend
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# backend
FROM node:20-alpine AS backend
WORKDIR /backend
COPY src/backend/server.js /backend/server.js
COPY src/backend/package.json /backend/package.json
COPY .docker.env /backend/.env
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]