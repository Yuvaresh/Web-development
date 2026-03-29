import base64
import numpy as np
from PIL import Image
import io
import random

EMOTIONS = ["happy", "sad", "angry", "fear", "surprise", "neutral"]

def preprocess_image(image_data):
    image_data = image_data.split(",")[1]
    image_bytes = base64.b64decode(image_data)

    image = Image.open(io.BytesIO(image_bytes)).convert("L")
    image = image.resize((48, 48))

    img_array = np.array(image) / 255.0
    img_array = img_array.reshape(1, 48, 48, 1)

    return img_array


def predict_emotion(image_data):
    img = preprocess_image(image_data)

    # Replace with real CNN later
    predicted_emotion = random.choice(EMOTIONS)

    return predicted_emotion