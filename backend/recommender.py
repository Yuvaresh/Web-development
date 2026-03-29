from database import emotion_playlist_map

def get_playlist(emotion):
    return emotion_playlist_map.get(emotion, emotion_playlist_map["neutral"])