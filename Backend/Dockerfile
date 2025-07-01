# Gunakan image Python
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Salin semua file ke container
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Jalankan aplikasi
CMD ["python", "app.py"]