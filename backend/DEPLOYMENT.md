# Deployment Guide

## Environment Variables

### Required
| Variable | Description | Default |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |

### Optional

#### Server
| Variable | Description | Default |
|---|---|---|
| `SERVER_HOST` | Bind address | `0.0.0.0` |
| `SERVER_PORT` | HTTP port | `8000` |
| `SERVER_MODE` | `development` or `production` | `development` |

#### CORS
| Variable | Description | Default |
|---|---|---|
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,...` |

#### Logging
| Variable | Description | Default |
|---|---|---|
| `LOG_LEVEL` | Python log level | `INFO` |

#### Upload
| Variable | Description | Default |
|---|---|---|
| `MAX_UPLOAD_SIZE_MB` | Max file size in MB | `500` |
| `REQUEST_TIMEOUT_SECONDS` | Request timeout | `300` |
| `UPLOAD_DIR` | Upload directory path | `uploads` |

#### Cache
| Variable | Description | Default |
|---|---|---|
| `DATASET_CACHE_SIZE` | Max cached datasets | `3` |
| `DATASET_CACHE_TTL_SECONDS` | Cache TTL | `3600` |
| `DATASET_CACHE_MAX_MEMORY_MB` | Max cache memory | `1024` |

#### AI
| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key | *(empty)* |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.0-flash` |

#### Cleanup
| Variable | Description | Default |
|---|---|---|
| `UPLOAD_RETENTION_DAYS` | File retention period | `90` |
| `MAX_STORAGE_GB` | Max storage limit | `10` |
| `CLEANUP_ENABLED` | Enable cleanup endpoints | `false` |
| `CLEANUP_DRY_RUN` | Dry-run by default | `true` |

---

## Docker Usage

### Build
```bash
cd backend
docker build -t automl-backend .
```

### Run
```bash
docker run -d \
  --name automl-backend \
  -p 8000:8000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017 \
  -e GEMINI_API_KEY=your_key_here \
  -e SERVER_MODE=production \
  -v "$(pwd)/uploads:/app/uploads" \
  automl-backend
```

### With docker-compose (example)
```yaml
version: "3"
services:
  mongodb:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      MONGODB_URI: mongodb://mongodb:27017
      SERVER_MODE: production
      GEMINI_API_KEY: your_key_here
    volumes:
      - uploads:/app/uploads
    depends_on:
      - mongodb

volumes:
  mongo_data:
  uploads:
```

---

## Production Setup

### 1. Environment file
Create a `.env` file in `backend/` with production values. Never commit secrets.

### 2. Upload directory
Ensure the `UPLOAD_DIR` path exists and is writable by the application user.

### 3. Reverse proxy (recommended)
Place behind nginx or Caddy for TLS termination:

```nginx
server {
    listen 443 ssl;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
    }
}
```

### 4. Health checks
- `GET /` — simple health
- `GET /health` — full service status
- `GET /health/memory` — memory usage
- `GET /health/storage` — storage stats
- `GET /health/cache` — cache stats
- `GET /metrics` — platform metrics

### 5. Storage cleanup (manual)
```bash
# Generate report (dry-run, always safe)
curl -X POST http://localhost:8000/cleanup/report

# Delete orphaned files (must be enabled)
curl -X POST "http://localhost:8000/cleanup/execute?dry_run=false"
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Server won't start | MongoDB unreachable | Verify `MONGODB_URI` and that MongoDB is running |
| Upload fails with "exceeds maximum size" | File too large | Increase `MAX_UPLOAD_SIZE_MB` |
| AI recommendations return fallback | `GEMINI_API_KEY` missing or invalid | Set a valid Gemini API key |
| CORS errors in browser | Origin not in `CORS_ALLOWED_ORIGINS` | Add the origin to the comma-separated list |
| Slow dataset loads | Cache miss on large file | Increase `DATASET_CACHE_MAX_MEMORY_MB` |
| "Dataset file not found" | File deleted or upload dir missing | Check `UPLOAD_DIR` and run `cleanup/report` |

---

## Monitoring endpoints
All monitoring endpoints are under prefix-less routes:
- `GET /health` — service status
- `GET /health/memory` — memory usage
- `GET /health/storage` — storage details
- `GET /health/cache` — cache statistics
- `GET /metrics` — aggregated platform metrics
- `POST /cleanup/report` — cleanup report (dry-run)
- `POST /cleanup/execute` — cleanup execution (requires `dry_run=false`)
