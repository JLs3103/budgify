# base: use official slim Python image
FROM python:3.11-slim

# workdir: set working directory inside container
WORKDIR /app

# copy: copy all files into container
COPY . .

# install: install Python dependencies from requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# cmd: run app.py when container starts
CMD ["python", "app.py"]