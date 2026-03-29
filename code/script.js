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
  
  let currentStroke = [];
  let strokes = [];
  
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
    if (currentTool === 'pen') {
      currentStroke = [{x: pos.x, y: pos.y}];
    }
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
    if (currentTool === 'pen') {
      currentStroke.push({x: pos.x, y: pos.y});
    }
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDrawing() {
    if (isDrawing) {
      if (currentTool === 'pen' && currentStroke.length > 0) {
        strokes.push(currentStroke);
        currentStroke = [];
      }
      isDrawing = false;
      ctx.closePath();
    }
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
    strokes = [];
    currentStroke = [];
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

  // Auth Modal Logic
  const authModal = document.getElementById('auth-modal');
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalTitle = document.getElementById('modal-title');
  const formSubmitBtn = document.getElementById('form-submit-btn');
  const authSwitchText = document.getElementById('auth-switch-text');
  const authSwitchLink = document.getElementById('auth-switch-link');
  const authForm = document.getElementById('auth-form');

  let isLoginView = true;

  function setAuthView(isLogin) {
    isLoginView = isLogin;
    if (isLogin) {
      modalTitle.textContent = 'Log In';
      formSubmitBtn.textContent = 'Log In';
      authSwitchText.textContent = "Don't have an account?";
      authSwitchLink.textContent = 'Sign Up';
    } else {
      modalTitle.textContent = 'Sign Up';
      formSubmitBtn.textContent = 'Sign Up';
      authSwitchText.textContent = "Already have an account?";
      authSwitchLink.textContent = 'Log In';
    }
  }

  function openModal(isLogin) {
    setAuthView(isLogin);
    authModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  function closeModal() {
    authModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  loginBtn.addEventListener('click', () => openModal(true));
  signupBtn.addEventListener('click', () => openModal(false));
  closeModalBtn.addEventListener('click', closeModal);

  // Close when clicking outside of modal content
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
      closeModal();
    }
  });

  authSwitchLink.addEventListener('click', (e) => {
    e.preventDefault();
    setAuthView(!isLoginView);
  });

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // In a real app, this would handle actual authentication
    const action = isLoginView ? 'logged in' : 'signed up';
    alert(`Successfully ${action}!`);
    closeModal();
  });

  function analyzeEmotion() {
    if (strokes.length === 0) return 'neutral';
    
    // Find the lowest stroke (likely the mouth)
    let lowestStroke = null;
    let maxAvgY = 0;
    
    for (const stroke of strokes) {
      if (stroke.length < 5) continue; // ignore dots
      let sumY = 0;
      for (const point of stroke) { sumY += point.y; }
      let avgY = sumY / stroke.length;
      if (avgY > maxAvgY) {
        maxAvgY = avgY;
        lowestStroke = stroke;
      }
    }
    
    if (!lowestStroke) return 'neutral';
    
    const startY = lowestStroke[0].y;
    const endY = lowestStroke[lowestStroke.length - 1].y;
    const middleIdx = Math.floor(lowestStroke.length / 2);
    const midY = lowestStroke[middleIdx].y;
    const endAvgY = (startY + endY) / 2;
    
    // Check for angry (sharp angles or many strokes)
    if (strokes.length > 7) return 'angry';
    
    // Higher Y is lower on the canvas
    if (midY > endAvgY + 15) return 'happy'; // U-shape (smile)
    if (midY < endAvgY - 15) return 'sad'; // inverted U-shape (frown)
    
    return 'neutral';
  }

  // Submit Logic
  submitBtn.addEventListener('click', () => {
    // 1. Get image data from canvas
    const imageData = canvas.toDataURL('image/png');
    
    // In a real app, this would be a fetch POST request to the backend.
    
    // UI Transitions
    initialView.classList.add('hidden');
    resultView.classList.add('hidden');
    loadingView.classList.remove('hidden');

    // Simulate Network Request and ML processing (1.5 seconds delay)
    setTimeout(() => {
      // Use heuristic stroke analysis for accurate prediction
      const predictedEmotion = analyzeEmotion();
      
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
