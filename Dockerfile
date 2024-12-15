FROM node:18-alpine AS build
 
WORKDIR /app
 
COPY package*.json ./
 
RUN npm config set proxy=http://172.16.12.11:3128
RUN npm config set https-proxy=http://172.16.12.11:3128
 
RUN npm install
 
COPY . .
 
# RUN ng build --prod
RUN npm run build -- --configuration production --base-href /srzhfcatfront-new/ --deploy-url /srzhfcatfront-new/
 
# RUN npm run build --configuration production
 
FROM nginx:alpine
 
COPY --from=build /app/dist/srzhf-catalog-new-front/browser /usr/share/nginx/html
 
# RUN ls -l /usr/share/nginx/html
 
COPY nginx.conf /etc/nginx/conf.d/default.conf
 
EXPOSE 80
