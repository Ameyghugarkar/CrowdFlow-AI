# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM python:3.10-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --user -r requirements.txt

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM python:3.10-slim

LABEL maintainer="Ameyghugarkar <amey@crowdflow.ai>"
LABEL description="CrowdFlow AI - Account Management Microservice"
LABEL version="1.0.0"

# Create non-root user for security
RUN groupadd -r crowdflow && useradd -r -g crowdflow crowdflow

WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /root/.local /home/crowdflow/.local

# Copy application source
COPY service/ ./service/

# Set environment variables
ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    PORT=8080

# Switch to non-root user
USER crowdflow

# Expose application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')" || exit 1

# Run the application
CMD ["python", "-m", "gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--threads", "2", "service.app:app"]
