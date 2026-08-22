import cv2
import numpy as np
import base64
import os
import requests

# 1. Grab an enrollment image
enrollment_dirs = [d for d in os.listdir('enrollment_images') if os.path.isdir(os.path.join('enrollment_images', d))]
if not enrollment_dirs:
    print("No enrollment sessions found")
    exit(1)

session_dir = os.path.join('enrollment_images', enrollment_dirs[0])
images = [f for f in os.listdir(session_dir) if f.endswith(('.jpg', '.png'))]
if not images:
    print("No images found in session")
    exit(1)

img_path = os.path.join(session_dir, images[0])
print(f"Using image: {img_path}")

# Phase 6 simulation (Direct via API, but the API expects a session directory to already exist)
# Actually, I can just call the Phase 8A endpoint with this image!
url = "http://localhost:8000/attendance/generate-live-embedding"
with open(img_path, 'rb') as f:
    files = {'image': (images[0], f, 'image/jpeg')}
    data = {'cameraId': 'TEST-CAM'}
    resp = requests.post(url, files=files, data=data)

if resp.status_code == 200:
    res = resp.json()
    print("Phase 8A Response:", res)
else:
    print("Phase 8A Error:", resp.text)
