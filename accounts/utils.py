"""
Face++ API Integration Service
Handles face detection, registration, and verification using Face++ API.
"""
import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class FacePPService:
    """Service class for Face++ API operations."""
    
    def __init__(self):
        self.api_key = settings.FACEPP_API_KEY
        self.api_secret = settings.FACEPP_API_SECRET
        self.api_url = settings.FACEPP_API_URL
        
    def detect_face(self, image_file):
        """
        Detect face in the uploaded image.
        
        Args:
            image_file: Django UploadedFile object
            
        Returns:
            dict: Face detection response from Face++ or error dict
        """
        if not self.api_key or not self.api_secret:
            # Return mock success for testing without credentials
            return {
                'faces': [{'face_token': 'mock_token'}],
                'mock': True,
                'message': 'Running in mock mode. Add Face++ credentials to enable real face recognition.'
            }
        
        try:
            url = f"{self.api_url}/detect"
            
            # Prepare the request
            files = {'image_file': image_file}
            data = {
                'api_key': self.api_key,
                'api_secret': self.api_secret,
                'return_attributes': 'none'
            }
            
            response = requests.post(url, data=data, files=files, timeout=30)
            result = response.json()
            
            if response.status_code != 200:
                logger.error(f"Face++ API error: {result}")
                return {'error': result.get('error_message', 'Unknown error occurred')}
            
            if not result.get('faces'):
                return {'error': 'No face detected in the image. Please upload a clear photo of your face.'}
            
            return result
            
        except requests.exceptions.Timeout:
            return {'error': 'Request timeout. Please try again.'}
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {str(e)}")
            return {'error': 'Network error. Please check your connection and try again.'}
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return {'error': 'An unexpected error occurred. Please try again.'}
    
    def register_face(self, image_file, user_id):
        """
        Register a face with Face++ and return face_token.
        
        Args:
            image_file: Django UploadedFile object
            user_id: Unique identifier for the user
            
        Returns:
            dict: Contains 'face_token' on success or 'error' on failure
        """
        # First detect the face
        detect_result = self.detect_face(image_file)
        
        if 'error' in detect_result:
            return detect_result
        
        # If mock mode (no credentials), return a mock face token
        if detect_result.get('mock'):
            return {
                'face_token': f'mock_face_token_{user_id}',
                'mock': True,
                'message': 'Running in mock mode. Add Face++ credentials to enable real face recognition.'
            }
        
        # Extract face_token from the first detected face
        faces = detect_result.get('faces', [])
        if faces:
            face_token = faces[0].get('face_token')
            return {'face_token': face_token}
        
        return {'error': 'Failed to extract face token from the response.'}
    
    def verify_face(self, image_file, stored_face_token):
        """
        Verify if the uploaded face matches the stored face_token.
        
        Args:
            image_file: Django UploadedFile object
            stored_face_token: Previously stored face_token from registration
            
        Returns:
            dict: Contains 'verified' (bool), 'confidence' (float), or 'error'
        """
        # First detect face in the new image (works in both mock and production mode)
        detect_result = self.detect_face(image_file)
        
        if 'error' in detect_result:
            return detect_result
        
        faces = detect_result.get('faces', [])
        if not faces:
            return {'error': 'No face detected in the uploaded image.'}
        
        new_face_token = faces[0].get('face_token')
        
        # Check if running in mock mode
        if stored_face_token.startswith('mock_face_token_'):
            # In mock mode, verify by comparing the tokens
            # The stored token format is: mock_face_token_{username}
            # The new token from detect is just 'mock_token'
            # We need to check if they're for the same user
            if new_face_token == 'mock_token':
                # In mock mode, we simulate verification
                # Extract username from stored token
                stored_username = stored_face_token.replace('mock_face_token_', '')
                
                # In a real scenario, we'd compare face features
                # For mock mode, we'll return success with a note
                return {
                    'verified': True,
                    'confidence': 95.5,
                    'mock': True,
                    'message': 'Running in mock mode. Add Face++ credentials to enable real face recognition.'
                }
            else:
                # Tokens don't match (shouldn't happen in mock mode, but safety check)
                return {
                    'verified': False,
                    'confidence': 0,
                    'mock': True
                }
        
        if not self.api_key or not self.api_secret:
            return {
                'error': 'Face++ API credentials not configured.',
                'mock': True
            }
        
        # Now use Face++ API to compare the two face tokens
        try:
            # Compare the two faces
            url = f"{self.api_url}/compare"
            data = {
                'api_key': self.api_key,
                'api_secret': self.api_secret,
                'face_token1': stored_face_token,
                'face_token2': new_face_token
            }
            
            response = requests.post(url, data=data, timeout=30)
            result = response.json()
            
            if response.status_code != 200:
                logger.error(f"Face++ compare error: {result}")
                return {'error': result.get('error_message', 'Face comparison failed')}
            
            confidence = result.get('confidence', 0)
            threshold = result.get('thresholds', {}).get('1e-5', 70)  # Default threshold
            
            return {
                'verified': confidence > threshold,
                'confidence': confidence,
                'threshold': threshold
            }
            
        except requests.exceptions.Timeout:
            return {'error': 'Request timeout. Please try again.'}
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {str(e)}")
            return {'error': 'Network error. Please try again.'}
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return {'error': 'An unexpected error occurred. Please try again.'}


# Create a singleton instance
face_service = FacePPService()
