# Usa a imagem base oficial do Node.js
FROM node:20-slim

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos package.json e package-lock.json
COPY package*.json ./

# Instala as dependências
RUN npm install --omit=dev

# Copia o código do Addon para o contêiner
COPY server.js .

# Expõe a porta que o Node.js está usando
EXPOSE 7000

# Define o comando para rodar a aplicação
CMD [ "npm", "start" ]
