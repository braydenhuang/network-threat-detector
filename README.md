# Network Threat Detector

Detects suspicious behavior in *.pcap* files with Machine Learning. Trained on the CSE-CIC-IDS2018 dataset.

Fully containerized architecture utilizes Redis pipeline with S3 (implemented here with Minio). Scalable across different regions.

## Production Deployment

*(For single-node deployments)*

1.) Install Docker and Docker Compose

2.) **Run:**
```bash
docker compose up
```

## Development Deployment

*(For single-node deployments)*

1.) Install Docker and Docker Compose

2.) **Run:**
```bash
docker-compose -f dev-docker-compose.yml up
```

3.) Compose volumes allow Flask (backend) and Vite (frontend) debuggers to refresh upon live changes to the code.