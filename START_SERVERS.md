# Starting Espargne Servers

## Backend Server (Python/FastAPI)

```bash
cd /Users/francoisrouaix/Documents/Repos/espargne
python3 api/server.py
```

The backend will start on: http://localhost:8000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

**Note:** If you get `ModuleNotFoundError`, install dependencies first:
```bash
pip3 install fastapi uvicorn pydantic python-multipart
```

## Frontend Server (React/Vite)

```bash
cd /Users/francoisrouaix/Documents/Repos/espargne-web
pnpm dev
```

The frontend will start on: http://localhost:5173

## Start Both Servers

Open two terminal windows and run each command in a separate terminal:

**Terminal 1 (Backend):**
```bash
cd /Users/francoisrouaix/Documents/Repos/espargne && python3 api/server.py
```

**Terminal 2 (Frontend):**
```bash
cd /Users/francoisrouaix/Documents/Repos/espargne-web && pnpm dev
```

## Troubleshooting

### Backend won't start
- Ensure Python 3.14 is installed
- Install missing packages: `pip3 install fastapi uvicorn pydantic python-multipart`
- Check if port 8000 is already in use: `lsof -i :8000`

### Frontend won't start
- Ensure pnpm is installed: `npm install -g pnpm`
- Install dependencies: `pnpm install`
- Check if port 5173 is already in use: `lsof -i :5173`
