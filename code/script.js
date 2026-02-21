document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('drawing-canvas');
  const ctx = canvas.getContext('2d');
  
  // Set explicit canvas size
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  
  // Initialize white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  let isDrawing = false;
  let currentTool = 'pen'; // 'pen' or 'eraser'
  let strokeColor = '#000000';
  let lineWidth = 4;
  
  // Tools
  const penBtn = document.getElementById('pen-btn');
  const eraserBtn = document.getElementById('eraser-btn');
  const clearBtn = document.getElementById('clear-btn');
  const submitBtn = document.getElementById('submit-btn');
  
  // Results view elements
  const initialView = document.getElementById('initial-view');
  const loadingView = document.getElementById('loading-view');
  const resultView = document.getElementById('result-view');
  const emotionText = document.getElementById('emotion-text');
  const songList = document.getElementById('song-list');
  
  // Event Listeners for Drawing
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
  
  // Touch support
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    if(e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function handleTouchStart(e) {
    e.preventDefault();
    startDrawing(e);
  }

  function handleTouchMove(e) {
    e.preventDefault();
    draw(e);
  }

  function startDrawing(e) {
    isDrawing = true;
    const pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : strokeColor;
    ctx.lineWidth = currentTool === 'eraser' ? 20 : lineWidth;
  }

  function draw(e) {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDrawing() {
    isDrawing = false;
    ctx.closePath();
  }

  // Tool changing
  penBtn.addEventListener('click', () => {
    currentTool = 'pen';
    penBtn.classList.add('active');
    eraserBtn.classList.remove('active');
  });

  eraserBtn.addEventListener('click', () => {
    currentTool = 'eraser';
    eraserBtn.classList.add('active');
    penBtn.classList.remove('active');
  });

  clearBtn.addEventListener('click', () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  // Mock songs DB
  const mockPlaylists = {
    happy: [
      { title: "Walking on Sunshine", artist: "Katrina & The Waves" },
      { title: "Happy", artist: "Pharrell Williams" },
      { title: "Good Vibrations", artist: "The Beach Boys" },
      { title: "Don't Stop Me Now", artist: "Queen" }
    ],
    sad: [
      { title: "Someone Like You", artist: "Adele" },
      { title: "Fix You", artist: "Coldplay" },
      { title: "The Sound of Silence", artist: "Simon & Garfunkel" },
      { title: "Tears in Heaven", artist: "Eric Clapton" }
    ],
    angry: [
      { title: "Break Stuff", artist: "Limp Bizkit" },
      { title: "Killing in the Name", artist: "Rage Against The Machine" },
      { title: "Chop Suey!", artist: "System Of A Down" },
      { title: "Before I Forget", artist: "Slipknot" }
    ],
    neutral: [
      { title: "Weightless", artist: "Marconi Union" },
      { title: "Clair de Lune", artist: "Claude Debussy" },
      { title: "Lofi Hip Hop Mix", artist: "ChilledCow" },
      { title: "Sunset Lover", artist: "Petit Biscuit" }
    ]
  };

  const emotions = ['happy', 'sad', 'angry', 'neutral'];

  // Submit Logic
  submitBtn.addEventListener('click', () => {
    // 1. Get image data from canvas
    const imageData = canvas.toDataURL('image/png');
    
    // In a real app, this would be a fetch POST request to the backend.
    
    // UI Transitions
    initialView.classList.add('hidden');
    resultView.classList.add('hidden');
    loadingView.classList.remove('hidden');

    // Simulate Network Request and ML processing (2 seconds delay)
    setTimeout(() => {
      // Pick random emotion for demo purposes
      const predictedEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      
      // Update UI
      loadingView.classList.add('hidden');
      resultView.classList.remove('hidden');
      
      // Update emotion text & styling
      emotionText.textContent = predictedEmotion.toUpperCase();
      emotionText.className = `emotion-tag ${predictedEmotion}`;
      
      // Populate Playlist
      const playlist = mockPlaylists[predictedEmotion] || mockPlaylists['neutral'];
      songList.innerHTML = '';
      
      playlist.forEach(song => {
        const li = document.createElement('li');
        li.className = 'song-item';
        li.innerHTML = `
          <div class="song-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
          </div>
          <div class="song-details">
            <div class="song-title">${song.title}</div>
            <div class="song-artist">${song.artist}</div>
          </div>
          <button class="play-btn">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
        `;
        songList.appendChild(li);
      });
      
    }, 2000);
  });
});
