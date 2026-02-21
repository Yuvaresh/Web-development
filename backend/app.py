import os
import io
import base64
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np

# Simulate ML model loading
# import tensorflow as tf
# model = tf.keras.models.load_model('emotion_model.h5')

app = Flask(__name__)
CORS(app) # Allow frontend to communicate with backend

EMOTIONS = ['happy', 'sad', 'angry', 'neutral', 'surprise', 'fear']

def preprocess_image(base64_string):
    """
    Step 4: Image Acquisition and Preprocessing
    Convert base64 to image, grayscale, resize, normalize
    """
    # Remove header from base64 string
    img_data = base64.b64decode(base64_string.split(',')[1])
    img = Image.open(io.BytesIO(img_data)).convert('L') # Grayscale
    
    # Resize to CNN expected input, e.g., 48x48
    img = img.resize((48, 48))
    
    # Convert to numpy array and normalize
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=[0, -1]) # Shape: (1, 48, 48, 1)
    
    return img_array

def predict_emotion(img_array):
    """
    Step 5: Emotion Detection
    Pass through CNN and return label
    """
    # Simulated prediction
    # preds = model.predict(img_array)
    # return EMOTIONS[np.argmax(preds)]
    
    return random.choice(EMOTIONS)

def get_recommendations(emotion):
    """
    Step 6: Emotion-Based Music Recommendation
    Rule-based mapping to fetch songs
    """
    # In a real app, integrate Spotify API here
    # Default mock database
    db = {
        'happy': [{"title": "Walking on Sunshine", "artist": "Katrina"}, {"title": "Happy", "artist": "Pharrell"}],
        'sad': [{"title": "Someone Like You", "artist": "Adele"}, {"title": "Fix You", "artist": "Coldplay"}],
        'angry': [{"title": "Break Stuff", "artist": "Limp Bizkit"}, {"title": "Before I Forget", "artist": "Slipknot"}],
        'neutral': [{"title": "Weightless", "artist": "Marconi Union"}, {"title": "Clair de Lune", "artist": "Claude Debussy"}],
        'fear': [{"title": "Thriller", "artist": "Michael Jackson"}, {"title": "Tubular Bells", "artist": "Mike Oldfield"}],
        'surprise': [{"title": "Bohemian Rhapsody", "artist": "Queen"}, {"title": "A Day in the Life", "artist": "The Beatles"}]
    }
    
    return db.get(emotion, db['neutral'])

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    if 'image' not in data:
        return jsonify({'error': 'No image provided'}), 400
        
    try:
        # Preprocess
        img_array = preprocess_image(data['image'])
        
        # Predict
        emotion = predict_emotion(img_array)
        
        # Recommend
        songs = get_recommendations(emotion)
        
        return jsonify({
            'emotion': emotion,
            'playlist': songs
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Sketch Tunes Backend...")
    app.run(debug=True, port=5000)
