import requests
import json

url = 'http://10.167.110.93:8000/api/accounts/login/'
data = {'username': 'admin', 'password': 'admin'}
headers = {'Content-Type': 'application/json'}

try:
    response = requests.post(url, data=json.dumps(data), headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Content Type: {response.headers.get('Content-Type')}")
    print(f"Body: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
