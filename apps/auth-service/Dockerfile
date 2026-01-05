# Image de base Node.js 20 Alpine (légère)
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier package files
COPY package.json pnpm-lock.yaml* ./

# Installer pnpm
RUN npm install -g pnpm

# Installer dépendances
RUN pnpm install

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 3001

# Commande de démarrage (dev)
CMD ["pnpm", "dev"]
