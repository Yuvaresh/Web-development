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

  let startX = 0;
  let startY = 0;
  let snapshot = null;

  let historyState = [];
  let historyIndex = -1;

  function saveState() {
    if (historyIndex < historyState.length - 1) {
      historyState = historyState.slice(0, historyIndex + 1);
    }
    historyState.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    historyIndex++;
  }
  
  // Save initial blank state
  setTimeout(saveState, 50);

  const redoBtn = document.getElementById('redo-btn');
  if (redoBtn) {
    redoBtn.addEventListener('click', () => {
      if (historyIndex < historyState.length - 1) {
        historyIndex++;
        ctx.putImageData(historyState[historyIndex], 0, 0);
      }
    });
  }

  // Navigations
  const navHome = document.getElementById('nav-home');
  const navMusics = document.getElementById('nav-musics');
  const navTrending = document.getElementById('nav-trending');
  
  const homeView = document.getElementById('home-view');
  const musicsView = document.getElementById('musics-view');
  const trendingView = document.getElementById('trending-view');
  
  const allNavs = [navHome, navMusics, navTrending];
  const allViews = [homeView, musicsView, trendingView];

  // Emotion Analysis & Submission
  const submitBtn = document.getElementById('submit-btn');

  function switchView(activeNav, activeView) {
    allNavs.forEach(nav => nav.classList.remove('active'));
    activeNav.classList.add('active');
    allViews.forEach(view => view.classList.add('hidden'));
    activeView.classList.remove('hidden');
  }

  navHome.addEventListener('click', (e) => { e.preventDefault(); switchView(navHome, homeView); });
  navMusics.addEventListener('click', (e) => { e.preventDefault(); switchView(navMusics, musicsView); renderMusicsLists(); });
  navTrending.addEventListener('click', (e) => { e.preventDefault(); switchView(navTrending, trendingView); renderMusicsLists(); });

  // Tools
  const clearBtn = document.getElementById('clear-btn');
  const colorPicker = document.getElementById('color-picker');
  const brushSize = document.getElementById('brush-size');
  
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const workspaceSect = document.querySelector('.workspace');
  const colorSwatches = document.querySelectorAll('.color-swatch');

  const undoBtn = document.getElementById('undo-btn');
  const downloadBtn = document.getElementById('download-btn');
  
  const toolsBtns = {};
  document.querySelectorAll('.btn[title]').forEach(btn => {
    const title = btn.getAttribute('title').toLowerCase();
    const systemTitles = ['undo step', 'redo step', 'download image', 'clear canvas', 'crop', 'resize', 'rotate', 'flip'];
    if (!systemTitles.includes(title)) {
      toolsBtns[title] = btn;
    }
  });

  // Handle color swatch matching Color 1
  const color1Swatch = document.querySelector('.color-swatch[title="Color 1"]');

  undoBtn.addEventListener('click', () => {
    if (historyIndex <= 0) {
      // Clear to blank
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      historyIndex = 0;
      historyState = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
      strokes = [];
    } else {
      historyIndex--;
      ctx.putImageData(historyState[historyIndex], 0, 0);
      strokes.pop();
    }
  });

  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'sketch-tunes-masterpiece.png';
    link.href = canvas.toDataURL();
    link.click();
  });

  const themeToggleBtn = document.getElementById('theme-toggle');
  let isDarkMode = true;

  themeToggleBtn.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    themeToggleBtn.style.transform = 'rotate(180deg) scale(0.5)';
    themeToggleBtn.style.opacity = '0';
    
    setTimeout(() => {
      if (isDarkMode) {
        document.documentElement.removeAttribute('data-theme');
        themeToggleBtn.textContent = '🌙';
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggleBtn.textContent = '☀️';
      }
      
      themeToggleBtn.style.transform = 'rotate(0deg) scale(1)';
      themeToggleBtn.style.opacity = '1';
    }, 250);
  });
  
  // Fullscreen Logic
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      workspaceSect.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });

  // Handle Resize after fullscreen
  function resizeCanvas() {
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.putImageData(imgData, 0, 0);
  }
  
  window.addEventListener('resize', () => { setTimeout(resizeCanvas, 100); });

  // Color Swatches Logic
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.getAttribute('data-color');
      if (color) {
        strokeColor = color;
        colorPicker.value = color;
        if (color1Swatch) {
           color1Swatch.dataset.color = color;
           color1Swatch.style.backgroundColor = color;
        }
        colorSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      }
    });
  });

  Object.keys(toolsBtns).forEach(toolTitle => {
    toolsBtns[toolTitle].addEventListener('click', () => {
      currentTool = toolTitle;
      Object.values(toolsBtns).forEach(btn => btn.classList.remove('active'));
      toolsBtns[toolTitle].classList.add('active');
    });
  });

  colorPicker.addEventListener('input', (e) => {
    strokeColor = e.target.value;
    if (color1Swatch) {
       color1Swatch.dataset.color = strokeColor;
       color1Swatch.style.backgroundColor = strokeColor;
    }
  });

  function hexToRgba(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16), a: 255 } : {r: 0, g: 0, b:0, a:255};
  }

  function floodFill(startX, startY, fillColorHex) {
    const fillColor = hexToRgba(fillColorHex);
    const colorLayer = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelData = colorLayer.data;
    const startPos = (startY * canvas.width + startX) * 4;
    const startColor = { r: pixelData[startPos], g: pixelData[startPos+1], b: pixelData[startPos+2], a: pixelData[startPos+3] };
    if (startColor.r === fillColor.r && startColor.g === fillColor.g && startColor.b === fillColor.b) return;
    const matchStartColor = (pos) => (pixelData[pos] === startColor.r && pixelData[pos+1] === startColor.g && pixelData[pos+2] === startColor.b && pixelData[pos+3] === startColor.a);
    const colorPixel = (pos) => { pixelData[pos] = fillColor.r; pixelData[pos+1] = fillColor.g; pixelData[pos+2] = fillColor.b; pixelData[pos+3] = fillColor.a; };
    const pixelStack = [[startX, startY]];
    while (pixelStack.length) {
      const newPos = pixelStack.pop();
      const x = newPos[0];
      let y = newPos[1];
      let pixelPos = (y * canvas.width + x) * 4;
      while (y-- >= 0 && matchStartColor(pixelPos)) { pixelPos -= canvas.width * 4; }
      pixelPos += canvas.width * 4;
      ++y;
      let reachLeft = false; let reachRight = false;
      while (y++ < canvas.height - 1 && matchStartColor(pixelPos)) {
        colorPixel(pixelPos);
        if (x > 0) {
          if (matchStartColor(pixelPos - 4)) {
            if (!reachLeft) { pixelStack.push([x - 1, y]); reachLeft = true; }
          } else if (reachLeft) { reachLeft = false; }
        }
        if (x < canvas.width - 1) {
          if (matchStartColor(pixelPos + 4)) {
            if (!reachRight) { pixelStack.push([x + 1, y]); reachRight = true; }
          } else if (reachRight) { reachRight = false; }
        }
        pixelPos += canvas.width * 4;
      }
    }
    ctx.putImageData(colorLayer, 0, 0);
  }
  
  brushSize.addEventListener('input', (e) => {
    lineWidth = e.target.value;
  });
  
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

  function drawShape(ctx, shape, sx, sy, ex, ey) {
    ctx.beginPath();
    const w = ex - sx;
    const h = ey - sy;
    switch (shape) {
      case 'line':
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        break;
      case 'selection': // draw dashed box
        ctx.setLineDash([5, 5]);
        ctx.rect(sx, sy, w, h);
        break;
      case 'rectangle':
        ctx.rect(sx, sy, w, h);
        break;
      case 'circle':
      case 'oval':
        ctx.ellipse(sx + w/2, sy + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, 2 * Math.PI);
        break;
      case 'rounded rectangle':
        const r = Math.min(Math.abs(w), Math.abs(h)) * 0.2;
        if(ctx.roundRect) {
            ctx.roundRect(sx, sy, w, h, r);
        } else {
            ctx.rect(sx, sy, w, h); // Fallback
        }
        break;
      case 'triangle':
        ctx.moveTo(sx + w/2, sy); ctx.lineTo(ex, ey); ctx.lineTo(sx, ey); ctx.closePath();
        break;
      case 'right triangle':
        ctx.moveTo(sx, sy); ctx.lineTo(sx, ey); ctx.lineTo(ex, ey); ctx.closePath();
        break;
      case 'diamond':
        ctx.moveTo(sx + w/2, sy); ctx.lineTo(ex, sy + h/2); ctx.lineTo(sx + w/2, ey); ctx.lineTo(sx, sy + h/2); ctx.closePath();
        break;
      case 'pentagon':
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(sx + w/2 + w/2 * Math.sin(i * 2 * Math.PI / 5), sy + h/2 - h/2 * Math.cos(i * 2 * Math.PI / 5));
        }
        ctx.closePath();
        break;
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          ctx.lineTo(sx + w/2 + w/2 * Math.sin(i * 2 * Math.PI / 6), sy + h/2 - h/2 * Math.cos(i * 2 * Math.PI / 6));
        }
        ctx.closePath();
        break;
      case 'heart':
        ctx.moveTo(sx + w/2, sy + h/4);
        ctx.bezierCurveTo(sx + w/2, sy, sx, sy, sx, sy + h/2);
        ctx.bezierCurveTo(sx, sy + h*0.8, sx + w/2, ey, sx + w/2, ey);
        ctx.bezierCurveTo(sx + w/2, ey, ex, sy + h*0.8, ex, sy + h/2);
        ctx.bezierCurveTo(ex, sy, sx + w/2, sy, sx + w/2, sy + h/4);
        break;
      default: // other complex shapes default to ellipse for now
        ctx.ellipse(sx + w/2, sy + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, 2 * Math.PI);
    }
  }

  function startDrawing(e) {
    const pos = getMousePos(e);
    startX = Math.floor(pos.x);
    startY = Math.floor(pos.y);
    
    if (currentTool === 'color picker') {
      const pData = ctx.getImageData(startX, startY, 1, 1).data;
      const hex = "#" + ("000000" + ((pData[0] << 16) | (pData[1] << 8) | pData[2]).toString(16)).slice(-6);
      strokeColor = hex;
      colorPicker.value = hex;
      if (color1Swatch) { color1Swatch.style.backgroundColor = hex; color1Swatch.dataset.color = hex; }
      return;
    }
    if (currentTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        ctx.font = `${lineWidth * 5}px Inter, sans-serif`;
        ctx.fillStyle = strokeColor;
        ctx.fillText(text, startX, startY);
        saveState();
      }
      return;
    }
    if (currentTool === 'magnifier') {
       if (canvas.style.transform === 'scale(2)') {
          canvas.style.transform = 'scale(1)';
       } else {
          canvas.style.transform = 'scale(2)';
          canvas.style.transformOrigin = `${startX}px ${startY}px`;
       }
       return;
    }

    isDrawing = true;
    
    if (currentTool === 'pencil') {
      currentStroke = [{x: pos.x, y: pos.y, color: strokeColor}];
    }
    
    if (currentTool === 'fill with color') {
      floodFill(startX, startY, strokeColor);
      let pStroke = [];
      for(let i=0; i<30; i++) pStroke.push({x: startX, y: startY, color: strokeColor});
      strokes.push(pStroke); 
      isDrawing = false;
      saveState();
      return;
    }

    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    ctx.setLineDash([]); // Reset dash
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = currentTool === 'eraser' ? 20 : lineWidth;
  }

  function draw(e) {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    
    if (currentTool === 'pencil' || currentTool === 'eraser') {
      if (currentTool === 'pencil') {
         currentStroke.push({x: pos.x, y: pos.y, color: strokeColor});
      }
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      ctx.putImageData(snapshot, 0, 0);
      drawShape(ctx, currentTool, startX, startY, pos.x, pos.y);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash for subsequent draws
    }
  }

  function stopDrawing() {
    if (isDrawing) {
      if (currentTool === 'pencil' && currentStroke.length > 0) {
        strokes.push(currentStroke);
        currentStroke = [];
      } else if (currentTool !== 'pencil' && currentTool !== 'eraser') {
        const dummyStrokes = [];
        for (let i=0; i<30; i++) dummyStrokes.push({x: startX, y: startY, color: strokeColor});
        strokes.push(dummyStrokes);
      }
      isDrawing = false;
      ctx.closePath();
      saveState();
    }
  }

// Removing old listeners

  clearBtn.addEventListener('click', () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    strokes = [];
    currentStroke = [];
    saveState();
  });

  // Mock songs DB
  const mockPlaylists = {
    happy: [
      { title: "Walking on Sunshine", artist: "Katrina & The Waves" },
      { title: "Happy", artist: "Pharrell Williams" },
      { title: "Good Vibrations", artist: "The Beach Boys" },
      { title: "Don't Stop Me Now", artist: "Queen" }
    ],
    pleasant: [
      { title: "Morning Has Broken", artist: "Cat Stevens" },
      { title: "Here Comes The Sun", artist: "The Beatles" },
      { title: "What A Wonderful World", artist: "Louis Armstrong" },
      { title: "Weightless", artist: "Marconi Union" }
    ],
    horror: [
      { title: "Halloween Theme", artist: "John Carpenter" },
      { title: "Tubular Bells", artist: "Mike Oldfield" },
      { title: "Psycho Theme", artist: "Bernard Herrmann" },
      { title: "Dead Silence Theme", artist: "Charlie Clouser" }
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

  function renderMusicsLists() {
    const allList = document.getElementById('all-songs-list');
    const trendingList = document.getElementById('trending-songs-list');
    if (!allList || !trendingList) return;
    
    if (allList.children.length === 0) {
      let allSongs = [];
      Object.values(mockPlaylists).forEach(playlist => {
        allSongs = allSongs.concat(playlist);
      });
      allSongs = allSongs.filter((song, index, self) => index === self.findIndex((t) => (t.title === song.title)));
      allSongs.forEach(song => { allList.innerHTML += createSongElement(song); });
    }

    if (trendingList.children.length === 0) {
      let allSongs = [];
      Object.values(mockPlaylists).forEach(playlist => {
        allSongs = allSongs.concat(playlist);
      });
      allSongs = allSongs.filter((song, index, self) => index === self.findIndex((t) => (t.title === song.title)));
      const trendingSongs = [...allSongs].sort(() => 0.5 - Math.random()).slice(0, 5);
      trendingSongs.forEach(song => { trendingList.innerHTML += createSongElement(song); });
    }
  }

  function createSongElement(song) {
    const safeTitle = song.title.replace(/'/g, "\\'");
    const safeArtist = song.artist.replace(/'/g, "\\'");
    return `
      <li class="song-item" onclick="playGlobalSong('${safeTitle}', '${safeArtist}')">
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
      </li>
    `;
  }

  // Global Music Player Logic
  const globalPlayer = document.getElementById('global-music-player');
  const npTitle = document.getElementById('now-playing-title');
  const npArtist = document.getElementById('now-playing-artist');
  const playerPlayBtn = document.getElementById('player-play');
  const playerProgress = document.getElementById('player-progress');
  const timeCurrent = document.getElementById('player-time-current');
  const timeTotal = document.getElementById('player-time-total');
  
  let currentMusicTimer = null;
  let isPlaying = false;
  let songProgress = 0;
  let songDuration = 210; // 3:30 mockup

  function formatTime(sec) {
    let MathFloorSec = Math.floor(sec);
    let m = Math.floor(MathFloorSec / 60);
    let s = Math.floor(MathFloorSec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  window.playGlobalSong = function(title, artist) {
    globalPlayer.classList.remove('hidden');
    npTitle.textContent = title;
    npArtist.textContent = artist;
    isPlaying = true;
    songProgress = 0;
    playerProgress.value = 0;
    timeCurrent.textContent = "0:00";
    timeTotal.textContent = formatTime(songDuration);
    
    playerPlayBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
    
    clearInterval(currentMusicTimer);
    currentMusicTimer = setInterval(() => {
      if (isPlaying && songProgress < songDuration) {
        songProgress++;
        playerProgress.value = (songProgress / songDuration) * 100;
        timeCurrent.textContent = formatTime(songProgress);
      }
    }, 1000);
  };

  playerPlayBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if(isPlaying) {
      playerPlayBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
    } else {
      playerPlayBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    }
  });

  playerProgress.addEventListener('input', (e) => {
    songProgress = (e.target.value / 100) * songDuration;
    timeCurrent.textContent = formatTime(songProgress);
  });

  // User Profile & Authentication Logic
  const authModal = document.getElementById('auth-modal');
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modalTitle = document.getElementById('modal-title');
  const formSubmitBtn = document.getElementById('form-submit-btn');
  const authSwitchText = document.getElementById('auth-switch-text');
  const authSwitchLink = document.getElementById('auth-switch-link');
  const authForm = document.getElementById('auth-form');
  const nameGroup = document.getElementById('name-group');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const authButtonsContainer = document.getElementById('auth-buttons');
  const userProfileContainer = document.getElementById('user-profile');
  const profileAvatar = document.getElementById('profile-avatar');
  const profileDropdown = document.getElementById('profile-dropdown');
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const profileImg = document.getElementById('profile-img');
  const profileInitial = document.getElementById('profile-initial');
  const logoutBtn = document.getElementById('logout-btn');
  const changePhotoInput = document.getElementById('change-photo-input');
  
  // Social Logins
  const socialBtns = document.querySelectorAll('.social-btn');
  socialBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.textContent.trim().replace('Continue with ', '');
      const defaultEmail = `user@${provider.toLowerCase()}.com`;
      loginUser({ name: `${provider} User`, email: defaultEmail, photo: null, password: 'nopassword' });
      closeModal();
    });
  });

  let isLoginView = true;

  // Local state
  let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  let users = JSON.parse(localStorage.getItem('users')) || [];

  function updateProfileUI() {
    if (currentUser) {
      if (authButtonsContainer) authButtonsContainer.classList.add('hidden');
      if (userProfileContainer) userProfileContainer.classList.remove('hidden');
      if (profileName) profileName.textContent = currentUser.name || 'User';
      if (profileEmail) profileEmail.textContent = currentUser.email;

      if (currentUser.photo) {
        if (profileImg) {
          profileImg.src = currentUser.photo;
          profileImg.style.display = 'block';
        }
        if (profileInitial) profileInitial.style.display = 'none';
      } else {
        if (profileImg) profileImg.style.display = 'none';
        if (profileInitial) {
          profileInitial.style.display = 'flex';
          profileInitial.textContent = (currentUser.name && currentUser.name.charAt(0).toUpperCase()) || 'U';
        }
      }
    } else {
      if (authButtonsContainer) authButtonsContainer.classList.remove('hidden');
      if (userProfileContainer) userProfileContainer.classList.add('hidden');
      if (profileDropdown) profileDropdown.classList.add('hidden');
    }
  }

  // Initial Check
  updateProfileUI();

  if (profileAvatar) {
    profileAvatar.addEventListener('click', () => {
      profileDropdown.classList.toggle('hidden');
    });
  }

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (userProfileContainer && !userProfileContainer.contains(e.target)) {
      if (profileDropdown) profileDropdown.classList.add('hidden');
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      currentUser = null;
      localStorage.removeItem('currentUser');
      updateProfileUI();
    });
  }

  if (changePhotoInput) {
    changePhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          currentUser.photo = event.target.result;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          
          const userIndex = users.findIndex(u => u.email === currentUser.email);
          if (userIndex !== -1) {
            users[userIndex].photo = currentUser.photo;
            localStorage.setItem('users', JSON.stringify(users));
          }
          updateProfileUI();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function loginUser(userData) {
    currentUser = userData;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    if (!users.find(u => u.email === currentUser.email)) {
      users.push(currentUser);
      localStorage.setItem('users', JSON.stringify(users));
    }
    updateProfileUI();
  }

  function setAuthView(isLogin) {
    isLoginView = isLogin;
    if (nameInput) nameInput.value = '';
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    if (isLogin) {
      if (modalTitle) modalTitle.textContent = 'Log In';
      if (formSubmitBtn) formSubmitBtn.textContent = 'Log In';
      if (authSwitchText) authSwitchText.textContent = "Don't have an account?";
      if (authSwitchLink) authSwitchLink.textContent = 'Sign Up';
      if (nameGroup) nameGroup.classList.add('hidden');
      if (nameInput) nameInput.removeAttribute('required');
    } else {
      if (modalTitle) modalTitle.textContent = 'Sign Up';
      if (formSubmitBtn) formSubmitBtn.textContent = 'Sign Up';
      if (authSwitchText) authSwitchText.textContent = "Already have an account?";
      if (authSwitchLink) authSwitchLink.textContent = 'Log In';
      if (nameGroup) nameGroup.classList.remove('hidden');
      if (nameInput) nameInput.setAttribute('required', 'required');
    }
  }

  function openModal(isLogin) {
    if (authModal) {
      setAuthView(isLogin);
      authModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (authModal) {
      authModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  if (loginBtn) loginBtn.addEventListener('click', () => openModal(true));
  if (signupBtn) signupBtn.addEventListener('click', () => openModal(false));
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) {
        closeModal();
      }
    });
  }

  if (authSwitchLink) {
    authSwitchLink.addEventListener('click', (e) => {
      e.preventDefault();
      setAuthView(!isLoginView);
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      
      if (isLoginView) {
        const userIndex = users.findIndex(u => u.email === email);
        if (userIndex === -1) {
          alert("You don't have an account. Redirecting to sign up page.");
          setAuthView(false);
        } else {
          const foundUser = users[userIndex];
          if (foundUser.password === password) {
            loginUser(foundUser);
            closeModal();
          } else {
            alert('Incorrect password!');
          }
        }
      } else {
        if (users.find(u => u.email === email)) {
          alert("You already have an account. Redirecting to log in page.");
          setAuthView(true);
        } else {
          const name = nameInput ? nameInput.value.trim() : 'User';
          const newUser = { email, password, name, photo: null };
          users.push(newUser);
          localStorage.setItem('users', JSON.stringify(users));
          loginUser(newUser);
          closeModal();
        }
      }
    });
  }

  function analyzeEmotion() {
    if (strokes.length === 0) return 'neutral';
    
    // Theme logic based on colors
    let horrorScore = 0;
    let pleasantScore = 0;
    
    for (const stroke of strokes) {
      if (stroke.length > 0) {
        const hColor = stroke[0].color || '#000000';
        
        // Count red or dark colors for horror
        if (hColor === '#000000' || hColor.startsWith('#ff') || hColor.startsWith('#cc00') || hColor.startsWith('#8b00')) {
          horrorScore++;
        }
        
        // Count green or blue colors for pleasant mountain/nature
        if (hColor.startsWith('#00ff') || hColor.startsWith('#0080') || hColor.startsWith('#0000ff') || hColor === '#4caf50' || hColor === '#2196f3' || hColor.startsWith('#32cd') || hColor.startsWith('#00cc')) {
          pleasantScore++;
        }
      }
    }
    
    // If predominantly green/blue
    if (pleasantScore > 1 && pleasantScore >= horrorScore) return 'pleasant';
    
    // If lots of black/red and jagged/messy lines
    if (strokes.length > 10 && horrorScore > 4) return 'horror';
    
    // Standard facial heuristic
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
    if (strokes.length === 0) {
      alert("Please draw something first!");
      return;
    }

    if (!currentUser) {
      let guestUsages = parseInt(localStorage.getItem('guestUsages') || '0');
      if (guestUsages >= 3) {
        alert("You've reached the maximum guest limits (3 times). Please log in or sign up to continue.");
        openModal(true);
        return;
      }
      guestUsages++;
      localStorage.setItem('guestUsages', guestUsages.toString());
    }

    // UI Transitions
    initialView.classList.add('hidden');
    resultView.classList.add('hidden');
    loadingView.classList.remove('hidden');
    
    // Show scan line on canvas
    const scanOverlay = document.getElementById('scan-overlay');
    if (scanOverlay) scanOverlay.classList.remove('hidden');

    // Simulate Network Request and ML processing (2 seconds delay)
    setTimeout(() => {
      if (scanOverlay) scanOverlay.classList.add('hidden');

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
        const safeTitle = song.title.replace(/'/g, "\\'");
        const safeArtist = song.artist.replace(/'/g, "\\'");
        li.setAttribute('onclick', `playGlobalSong('${safeTitle}', '${safeArtist}')`);
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
