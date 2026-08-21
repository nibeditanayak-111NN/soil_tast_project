FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port (default 3001 as used in the project)
EXPOSE 3001

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3001"]
