FROM python:3.12-slim

WORKDIR /srv/app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY data ./data

# Train models at build time if artifacts aren't already present
RUN python3 app/ml/train_shortage_model.py && python3 app/ml/train_leak_model.py

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
