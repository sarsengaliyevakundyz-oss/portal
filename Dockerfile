FROM 172.16.18.94:5000/ivc/base/node:20.14.0-alpine3.20 as build-env
 
WORKDIR /app
 
COPY package*.json ./
 
RUN npm config rm proxy
RUN npm config rm https-proxy
RUN npm config rm http-proxy
RUN npm config set proxy http://172.16.12.11:3128
RUN npm config set https-proxy http://172.16.12.11:3128
#RUN npm config set http-proxy http://172.16.12.11:3128
RUN npm config set registry http://registry.npmjs.org/
RUN npm install
COPY . .
RUN node --max-old-space-size=10240 ./node_modules/@angular/cli/bin/ng build --configuration development --base-href /internalportalfront/ --deploy-url /internalportalfront/
RUN ls -la /app
RUN ls -la /app/dist/
 
 
FROM 172.16.18.94:5000/nginx-1.21.3
 
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build-env /app/default.conf /etc/nginx/conf.d/
COPY --from=build-env /app/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-env /app/dist/vip/browser/ /usr/share/nginx/html
EXPOSE 80
