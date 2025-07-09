#!/usr/bin/env bash
# Build script for Render deployment

# Install system dependencies required for h5py
apt-get update
apt-get install -y libhdf5-dev libhdf5-serial-dev

# Install Python dependencies
pip install -r requirements.txt 