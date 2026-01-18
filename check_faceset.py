import requests
from django.conf import settings
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dpi_platform.settings')
django.setup()

api_key = settings.FACEPP_API_KEY
api_secret = settings.FACEPP_API_SECRET
faceset_token = settings.FACEPP_FACESET_TOKEN

url = f"{settings.FACEPP_API_URL}/faceset/getdetail"
data = {
    'api_key': api_key,
    'api_secret': api_secret,
    'faceset_token': faceset_token
}

response = requests.post(url, data=data)
print(response.json())
