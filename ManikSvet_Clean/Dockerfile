# 1. Build Frontend dist
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2. Python Backend
FROM python:3.11-slim
WORKDIR /app

# Copy requirements and install
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app
COPY backend/ /app/backend/

# Copy built frontend assets to frontend/dist
COPY --from=frontend-builder /frontend/dist /app/frontend/dist

ENV PYTHONPATH=/app/backend

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
