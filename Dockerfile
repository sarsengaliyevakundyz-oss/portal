FROM 172.16.18.94:5000/ivc/base/node:20.14.0-alpine3.20 as build-env

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN node --max-old-space-size=10240 ./node_modules/@angular/cli/bin/ng build --configuration development --base-href /internalportalfront/ --deploy-url /internalportalfront/

FROM 172.16.18.94:5000/nginx-1.21.3

# Удаляем дефолтный конфиг и старые файлы
RUN rm -rf /etc/nginx/conf.d/default.conf && \
    rm -rf /usr/share/nginx/html/*

# Копируем конфигурационные файлы
COPY --from=build-env /app/default.conf /etc/nginx/conf.d/
COPY --from=build-env /app/nginx.conf /etc/nginx/nginx.conf

# Создаем структуру папок и копируем приложение
RUN mkdir -p /usr/share/nginx/html/internalportalfront
COPY --from=build-env /app/dist/vip/browser/ /usr/share/nginx/html/internalportalfront/

EXPOSE 80