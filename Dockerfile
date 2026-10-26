FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends cmake g++ make \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend ./backend
RUN rm -rf backend/engine/build && mkdir backend/engine/build \
    && cd backend/engine/build \
    && cmake .. -DCMAKE_BUILD_TYPE=Release -Dpybind11_DIR=$(python -m pybind11 --cmakedir) \
    && make
# One worker: network state lives in process memory.
CMD gunicorn -w 1 --threads 4 -b 0.0.0.0:${PORT:-8000} backend.__main__:app
