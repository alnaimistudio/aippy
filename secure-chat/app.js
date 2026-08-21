(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const ui = {
    setupView: $('setupView'), chatView: $('chatView'), displayName: $('displayName'),
    myPeerId: $('myPeerId'), copyIdBtn: $('copyIdBtn'), remotePeerId: $('remotePeerId'),
    connectBtn: $('connectBtn'), connectionStatus: $('connectionStatus'), peerLabel: $('peerLabel'),
    secureState: $('secureState'), messages: $('messages'), messageForm: $('messageForm'),
    messageInput: $('messageInput'), sendBtn: $('sendBtn'), disconnectBtn: $('disconnectBtn'),
    callBtn: $('callBtn'), muteBtn: $('muteBtn'), callOverlay: $('callOverlay'),
    callTitle: $('callTitle'), callState: $('callState'), overlayMuteBtn: $('overlayMuteBtn'),
    hangupBtn: $('hangupBtn'), toast: $('toast')
  };

  const state = {
    peer: null,
    conn: null,
    keyPair: null,
    publicKeyB64: '',
    aesKey: null,
    localStream: null,
    mediaCall: null,
    muted: false,
    secureReady: false,
    toastTimer: null
  };

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function bytesToB64(bytes) {
    let binary = '';
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i += 0x8000) {
      binary += String.fromCharCode(...arr.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }

  function b64ToBytes(value) {
    const binary = atob(value);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.remove('hidden');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => ui.toast.classList.add('hidden'), 2400);
  }

  function setStatus(text) {
    ui.connectionStatus.textContent = text;
  }

  function appendSystem(text) {
    const el = document.createElement('div');
    el.className = 'system-message';
    el.textContent = text;
    ui.messages.appendChild(el);
    ui.messages.scrollTop = ui.messages.scrollHeight;
  }

  function appendMessage(text, mine, when = Date.now()) {
    const bubble = document.createElement('div');
    bubble.className = `message ${mine ? 'me' : 'them'}`;

    const body = document.createElement('div');
    body.textContent = text;
    bubble.appendChild(body);

    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = new Date(when).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    bubble.appendChild(time);

    ui.messages.appendChild(bubble);
    ui.messages.scrollTop = ui.messages.scrollHeight;
  }

  function setSecureReady(ready) {
    state.secureReady = ready;
    ui.messageInput.disabled = !ready;
    ui.sendBtn.disabled = !ready;
    ui.callBtn.disabled = !state.conn || !state.conn.open;
    ui.secureState.classList.toggle('ready', ready);
    ui.secureState.classList.toggle('pending', !ready);
    ui.secureState.textContent = ready ? '🔒 End-to-end encrypted messages' : 'Negotiating encryption…';
    if (ready) ui.messageInput.focus();
  }

  async function generateIdentity() {
    state.keyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey']
    );
    const raw = await crypto.subtle.exportKey('raw', state.keyPair.publicKey);
    state.publicKeyB64 = bytesToB64(raw);
  }

  async function deriveSessionKey(remotePublicKeyB64) {
    const remotePublicKey = await crypto.subtle.importKey(
      'raw',
      b64ToBytes(remotePublicKeyB64),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    state.aesKey = await crypto.subtle.deriveKey(
      { name: 'ECDH', public: remotePublicKey },
      state.keyPair.privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encryptText(text) {
    if (!state.aesKey) throw new Error('Encryption key is not ready');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      state.aesKey,
      enc.encode(text)
    );
    return { iv: bytesToB64(iv), ciphertext: bytesToB64(ciphertext) };
  }

  async function decryptText(ivB64, ciphertextB64) {
    if (!state.aesKey) throw new Error('Encryption key is not ready');
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64ToBytes(ivB64) },
      state.aesKey,
      b64ToBytes(ciphertextB64)
    );
    return dec.decode(plaintext);
  }

  function localName() {
    return ui.displayName.value.trim() || 'User';
  }

  function openChat(peerId) {
    ui.setupView.classList.add('hidden');
    ui.chatView.classList.remove('hidden');
    ui.peerLabel.textContent = peerId;
    setStatus(`Connected to ${peerId}`);
    setSecureReady(false);
  }

  function closeChat(message = 'Disconnected') {
    setSecureReady(false);
    state.aesKey = null;
    ui.callBtn.disabled = true;
    endCall(false);

    if (state.conn) {
      try { state.conn.close(); } catch (_) {}
      state.conn = null;
    }

    ui.chatView.classList.add('hidden');
    ui.setupView.classList.remove('hidden');
    ui.messages.innerHTML = '<div class="system-message">Connection established. Waiting for end-to-end encryption keys…</div>';
    setStatus(state.peer && state.peer.open ? 'Ready to connect' : message);
  }

  async function handleData(data) {
    if (!data || typeof data !== 'object') return;

    if (data.type === 'hello') {
      if (typeof data.name === 'string' && data.name.trim()) ui.peerLabel.textContent = data.name.trim();
      if (!data.publicKey) return;
      try {
        await deriveSessionKey(data.publicKey);
        setSecureReady(true);
        appendSystem('🔒 Encryption established. Message contents are protected with ECDH + AES-256-GCM.');
      } catch (error) {
        console.error(error);
        appendSystem('Could not establish encryption. Disconnect and try again.');
        setSecureReady(false);
      }
      return;
    }

    if (data.type === 'message') {
      try {
        const text = await decryptText(data.iv, data.ciphertext);
        appendMessage(text, false, data.sentAt || Date.now());
      } catch (error) {
        console.error(error);
        appendSystem('An encrypted message could not be decrypted.');
      }
    }
  }

  function prepareConnection(conn) {
    if (state.conn && state.conn !== conn) {
      try { state.conn.close(); } catch (_) {}
    }
    state.conn = conn;
    state.aesKey = null;
    openChat(conn.peer);

    conn.on('open', () => {
      setStatus('Peer connected');
      ui.callBtn.disabled = false;
      conn.send({ type: 'hello', name: localName(), publicKey: state.publicKeyB64, version: 1 });
    });

    conn.on('data', handleData);
    conn.on('close', () => closeChat('Peer disconnected'));
    conn.on('error', (error) => {
      console.error(error);
      showToast('Connection error');
    });
  }

  async function startPeer() {
    if (!window.Peer) throw new Error('PeerJS failed to load');
    await generateIdentity();

    state.peer = new Peer();

    state.peer.on('open', (id) => {
      ui.myPeerId.textContent = id;
      ui.connectBtn.disabled = false;
      setStatus('Ready to connect');
    });

    state.peer.on('connection', (conn) => prepareConnection(conn));

    state.peer.on('call', async (call) => {
      const caller = call.metadata && call.metadata.name ? call.metadata.name : call.peer;
      const accept = window.confirm(`${caller} is calling. Accept the audio call?`);
      if (!accept) {
        call.close();
        return;
      }
      try {
        const stream = await getMicrophone();
        state.mediaCall = call;
        call.answer(stream);
        showCallOverlay(`Call with ${caller}`, 'Connecting…');
        attachCallEvents(call);
      } catch (error) {
        console.error(error);
        call.close();
        showToast('Microphone permission is required');
      }
    });

    state.peer.on('disconnected', () => setStatus('Reconnecting…'));
    state.peer.on('close', () => setStatus('Offline'));
    state.peer.on('error', (error) => {
      console.error(error);
      const messages = {
        'peer-unavailable': 'That connection ID is offline or unavailable.',
        'network': 'Network error. Check your internet connection.',
        'server-error': 'Signaling service error. Try again.'
      };
      showToast(messages[error.type] || `Connection error: ${error.type || 'unknown'}`);
      if (!state.conn || !state.conn.open) closeChat('Connection failed');
    });
  }

  async function getMicrophone() {
    if (state.localStream && state.localStream.active) return state.localStream;
    state.localStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false
    });
    state.muted = false;
    updateMuteUI();
    return state.localStream;
  }

  function attachCallEvents(call) {
    call.on('stream', (remoteStream) => {
      let audio = document.getElementById('remoteAudio');
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'remoteAudio';
        audio.autoplay = true;
        audio.playsInline = true;
        document.body.appendChild(audio);
      }
      audio.srcObject = remoteStream;
      audio.play().catch(() => {});
      ui.callState.textContent = 'Encrypted peer-to-peer audio';
      ui.muteBtn.classList.remove('hidden');
    });

    call.on('close', () => endCall(false));
    call.on('error', (error) => {
      console.error(error);
      showToast('Call ended because of a connection error');
      endCall(false);
    });
  }

  function showCallOverlay(title, subtitle) {
    ui.callTitle.textContent = title;
    ui.callState.textContent = subtitle;
    ui.callOverlay.classList.remove('hidden');
  }

  async function startCall() {
    if (!state.conn || !state.conn.open || !state.peer) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Audio calls are not supported in this browser');
      return;
    }
    try {
      const stream = await getMicrophone();
      const call = state.peer.call(state.conn.peer, stream, { metadata: { name: localName() } });
      if (!call) throw new Error('Could not start call');
      state.mediaCall = call;
      showCallOverlay(`Call with ${ui.peerLabel.textContent}`, 'Calling…');
      attachCallEvents(call);
    } catch (error) {
      console.error(error);
      showToast('Microphone permission is required');
    }
  }

  function endCall(closeRemote = true) {
    if (closeRemote && state.mediaCall) {
      try { state.mediaCall.close(); } catch (_) {}
    }
    state.mediaCall = null;
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => track.stop());
      state.localStream = null;
    }
    const audio = document.getElementById('remoteAudio');
    if (audio) {
      audio.srcObject = null;
      audio.remove();
    }
    state.muted = false;
    updateMuteUI();
    ui.muteBtn.classList.add('hidden');
    ui.callOverlay.classList.add('hidden');
  }

  function toggleMute() {
    if (!state.localStream) return;
    state.muted = !state.muted;
    state.localStream.getAudioTracks().forEach((track) => { track.enabled = !state.muted; });
    updateMuteUI();
  }

  function updateMuteUI() {
    const icon = state.muted ? '🔇' : '🎙️';
    ui.overlayMuteBtn.textContent = icon;
    ui.muteBtn.textContent = icon;
    ui.overlayMuteBtn.classList.toggle('active', state.muted);
    ui.muteBtn.classList.toggle('active', state.muted);
  }

  ui.copyIdBtn.addEventListener('click', async () => {
    const id = ui.myPeerId.textContent.trim();
    if (!id || id.includes('…')) return;
    try {
      await navigator.clipboard.writeText(id);
      showToast('Connection ID copied');
    } catch (_) {
      showToast('Press and hold the ID to copy it');
    }
  });

  ui.connectBtn.addEventListener('click', () => {
    const id = ui.remotePeerId.value.trim();
    if (!id || !state.peer || !state.peer.open) return;
    if (id === state.peer.id) {
      showToast('Use a different device or browser session');
      return;
    }
    const conn = state.peer.connect(id, { reliable: true, serialization: 'json' });
    prepareConnection(conn);
  });

  ui.remotePeerId.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      ui.connectBtn.click();
    }
  });

  ui.messageForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = ui.messageInput.value.trim();
    if (!text || !state.secureReady || !state.conn || !state.conn.open) return;
    ui.messageInput.value = '';
    ui.messageInput.style.height = '';
    try {
      const packet = await encryptText(text);
      const sentAt = Date.now();
      state.conn.send({ type: 'message', ...packet, sentAt });
      appendMessage(text, true, sentAt);
    } catch (error) {
      console.error(error);
      showToast('Message could not be encrypted');
    }
  });

  ui.messageInput.addEventListener('input', () => {
    ui.messageInput.style.height = 'auto';
    ui.messageInput.style.height = `${Math.min(ui.messageInput.scrollHeight, 130)}px`;
  });

  ui.messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      ui.messageForm.requestSubmit();
    }
  });

  ui.disconnectBtn.addEventListener('click', () => closeChat());
  ui.callBtn.addEventListener('click', startCall);
  ui.hangupBtn.addEventListener('click', () => endCall(true));
  ui.overlayMuteBtn.addEventListener('click', toggleMute);
  ui.muteBtn.addEventListener('click', toggleMute);

  window.addEventListener('beforeunload', () => {
    endCall(true);
    if (state.conn) state.conn.close();
    if (state.peer) state.peer.destroy();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  startPeer().catch((error) => {
    console.error(error);
    ui.myPeerId.textContent = 'Unable to start';
    setStatus('Startup failed');
    showToast('Could not start secure chat');
  });
})();
