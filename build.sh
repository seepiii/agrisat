#!/usr/bin/env bash
# exit on error
set -o errexit

# Install system dependencies for h5py
apt-get update && apt-get install -y \
    libhdf5-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt 