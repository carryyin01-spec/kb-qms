# syntax=docker/dockerfile:1
FROM node:18-alpine AS build
WORKDIR /app
ARG REACT_APP_API_BASE=/api
ENV REACT_APP_API_BASE=${REACT_APP_API_BASE}
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install
COPY . .
RUN npm run build

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]

