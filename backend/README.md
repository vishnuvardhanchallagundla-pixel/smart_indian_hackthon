# SkyFare AI — Backend Foundation

Python FastAPI backend foundation for SkyFare AI (Smart Airfare Intelligence & Prediction System).

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   └── main.py
├── requirements.txt
├── .env.example
└── README.md
```

## Setup & Installation

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

Start the development server with auto-reload:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Available Endpoints

- **Health Check**: `GET http://127.0.0.1:8000/api/health`
- **Interactive Swagger Documentation**: `GET http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `GET http://127.0.0.1:8000/redoc`
