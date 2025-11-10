# Docker Setup for SFX Library Manager

This project includes Docker configurations for both production and development environments.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### Production Mode

Build and run the application in production mode:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The frontend will be available at `http://localhost:3000`

### Development Mode

Run with hot-reload for development:

```bash
# Build and start development services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

The development server will be available at `http://localhost:8080`

## Configuration

### Backend Setup

The `docker-compose.yml` includes a basic Flask backend setup. You'll need to:

1. **Adjust the backend service** to match your actual Flask application structure
2. **Update the volumes** to point to your backend code location:
   ```yaml
   volumes:
     - ./your-backend-path:/app
     - /your/audio/files/path:/data/VA_Videos:ro
   ```

3. **Modify the command** to match your Flask app startup requirements

### Audio Files

Mount your audio files directory in the backend service:

```yaml
volumes:
  - /path/to/your/audio/files:/data/VA_Videos:ro
```

The `:ro` flag mounts the directory as read-only for safety.

### Environment Variables

Create a `.env` file in the project root to customize:

```env
# Frontend
VITE_API_URL=http://fox.home:5000

# Backend
FLASK_ENV=production
DATABASE_PATH=/app/sfx_database.db
AUDIO_FILES_PATH=/data/VA_Videos
```

## Docker Commands

### Rebuild after changes
```bash
docker-compose build
docker-compose up -d
```

### View logs for specific service
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Execute commands in containers
```bash
# Frontend container
docker-compose exec frontend sh

# Backend container
docker-compose exec backend bash
```

### Remove all containers and volumes
```bash
docker-compose down -v
```

## Network Architecture

The services communicate through a Docker bridge network (`sfx-network`):

- Frontend: nginx serving static files on port 80 (mapped to 3000)
- Backend: Flask API on port 5000
- nginx proxies `/api/` and `/health` requests to the backend

## Production Deployment

For production deployment:

1. **Set proper environment variables**
2. **Configure SSL/TLS** (add certificates to nginx config)
3. **Set resource limits** in docker-compose.yml
4. **Use secrets** for sensitive data
5. **Enable logging drivers** for centralized logging

Example with resource limits:

```yaml
services:
  frontend:
    # ... other config
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Troubleshooting

### Frontend can't connect to backend
- Check that both services are on the same network
- Verify backend is healthy: `docker-compose exec backend curl localhost:5000/health`
- Check nginx proxy configuration in `nginx.conf`

### Permission issues with audio files
- Ensure the mounted volume path is correct
- Check file permissions: `ls -la /data/VA_Videos`
- Consider using a named user in the Dockerfile

### Build failures
- Clear Docker cache: `docker-compose build --no-cache`
- Remove old images: `docker system prune -a`

## Performance Optimization

- Enable gzip compression (already configured in nginx.conf)
- Use multi-stage builds (already implemented)
- Minimize layer count in Dockerfiles
- Use `.dockerignore` to exclude unnecessary files
