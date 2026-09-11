# SharePad K3s Deployment Guide

This directory contains the Kubernetes manifests for deploying the SharePad backend to your K3s cluster.

---

## 1. Apply Your Secrets (Postgres & R2)

Create the secret directly on your VM:
```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: sharepad-secrets
  namespace: sharepad
type: Opaque
stringData:
  DB_URL: "jdbc:postgresql://<YOUR_DB_HOST>/<YOUR_DB_NAME>?sslmode=require"
  DB_USERNAME: "<YOUR_DB_USERNAME>"
  DB_PASSWORD: "<YOUR_DB_PASSWORD>"
  R2_ENDPOINT: "https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com"
  R2_ACCESS_KEY_ID: "<YOUR_R2_ACCESS_KEY_ID>"
  R2_SECRET_ACCESS_KEY: "<YOUR_R2_SECRET_ACCESS_KEY>"
  R2_BUCKET_NAME: "sharepad-storage"
EOF
```

---

## 2. GHCR Pull Secret (If image package is Private)

If your GitHub package (`ghcr.io/mazer-08/sharepad-backend`) is private, run this command on your VM:
```bash
kubectl create secret docker-registry ghcr-secret \
  --namespace=sharepad \
  --docker-server=ghcr.io \
  --docker-username=Mazer-08 \
  --docker-password=<YOUR_GITHUB_PAT>
```

---

## 3. Apply the Application Manifest

```bash
kubectl apply -f k8s/app.yaml
```

---

## 4. Verify Everything

```bash
# Check pod status
kubectl get pods -n sharepad

# Check service & ingress
kubectl get svc,ingress -n sharepad

# Check TLS certificate issuance
kubectl get certificate -n sharepad

# Stream logs
kubectl logs -n sharepad -l app=sharepad-backend -f
```
