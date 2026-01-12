# Azure deployment (App Service + PostgreSQL)

This guide deploys the Flask API to Azure App Service (Linux) with Azure Database for PostgreSQL Flexible Server.

## 1) Prerequisites
- Azure subscription (you have $100 credits)
- Azure CLI installed and logged in: `az login`
- Python 3.11 locally, Git initialized

## 2) Create Azure resources
Choose names and region:

```bash
RG=mosquestn-rg
LOC=westeurope
PG_NAME=mosquestn-pg$RANDOM   # must be globally unique
PG_ADMIN=pgadmin
PG_PASS='<strongpassword>'    # choose a strong password
PG_DB=mosques
PLAN=mosquestn-plan
WEBAPP=mosquestn-api
```

Create resource group:
```bash
az group create -n $RG -l $LOC
```

Create PostgreSQL Flexible Server (Burstable B1ms is low-cost):
```bash
az postgres flexible-server create \
  -g $RG -n $PG_NAME -l $LOC \
  --tier Burstable --sku-name Standard_B1ms \
  --version 16 \
  --storage-size 32 \
  --public-access 0.0.0.0-0.0.0.0 \
  --admin-user $PG_ADMIN --admin-password $PG_PASS
```

Create database:
```bash
az postgres flexible-server db create -g $RG -s $PG_NAME -d $PG_DB
```

Build DATABASE_URL:
```bash
DBHOST=$(az postgres flexible-server show -g $RG -n $PG_NAME --query fullyQualifiedDomainName -o tsv)
# SQLAlchemy format:
DATABASE_URL="postgresql+psycopg2://${PG_ADMIN}:${PG_PASS}@${DBHOST}:5432/${PG_DB}"
```

## 3) Create App Service (Linux, Python)
```bash
az appservice plan create -g $RG -n $PLAN --sku B1 --is-linux
az webapp create -g $RG -p $PLAN -n $WEBAPP -r "python|3.11"
```

Configure app settings (env vars):
```bash
az webapp config appsettings set -g $RG -n $WEBAPP --settings \
  FLASK_ENV=production \
  DATABASE_URL="$DATABASE_URL" \
  GEMINI_API_KEY="" \
  PORT=8000
```
Note: Leave `GEMINI_API_KEY` empty to use heuristic moderation, or set a valid Google AI key.

Set startup command (Gunicorn + WSGI):
```bash
az webapp config set -g $RG -n $WEBAPP --startup-file "gunicorn --bind=0.0.0.0:$PORT --timeout 600 wsgi:app"
```

## 4) Deploy code
From the `backend` folder:
```bash
cd backend
zip -r app.zip . -x "migrations/versions/* __pycache__/* .venv/*"
az webapp deploy -g $RG -n $WEBAPP --type zip --src-path app.zip
```

## 5) Run DB migrations
Open SSH (preview) / Kudu console and run:
```bash
export FLASK_ENV=production
export DATABASE_URL="<same as set above>"
flask --app 'app:create_app' db upgrade
```
Alternatively, you can add a one-time deployment step locally running against Azure DB before deploy:
```bash
# Using your local environment but pointing to Azure DB
set DATABASE_URL=<azure_database_url>
flask --app "app:create_app" db upgrade
```

## 6) Verify
Get your URL:
```bash
az webapp show -g $RG -n $WEBAPP --query defaultHostName -o tsv
```
Test endpoints:
```bash
curl https://<host>/health || curl https://<host>/mosques
```

## 7) CORS and auth
- CORS: The API uses `flask-cors`; restrict origins via env or update app config if needed.
- Auth: `/auth/firebase/verify` expects a Firebase ID token if enabled. For now, the app supports a simple dev mode (e.g., "demo"/"admin") as per Insomnia collection.

## 8) Costs
- B1 App Service + B1ms PostgreSQL typically fits well within $100 credits for a month of light usage. You can scale down or stop resources when idle.

## Troubleshooting
- API key not valid: Set `GEMINI_API_KEY` to a valid Google AI key, or leave it empty to use heuristic moderation.
- DB errors: Ensure `DATABASE_URL` is correct and run migrations. Use the provided `scripts/reset_pg_sequences.py` if you manually inserted rows and sequences got out of sync.
- Logs:
```bash
az webapp log tail -g $RG -n $WEBAPP
```
