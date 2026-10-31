# ---- Etapa 1: Construcción del Frontend ----
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ---- Etapa 2: Servidor Node y Backend ----
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY app.js ./
COPY config/ ./config/
COPY controllers/ ./controllers/
COPY middleware/ ./middleware/
COPY models/ ./models/
COPY routes/ ./routes/
COPY utils/ ./utils/
COPY views/ ./views/
COPY public/ ./public/
COPY crear_admin.js ./
COPY seed_datos.js ./

# Copiar el build del frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "app.js"]
