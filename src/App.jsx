import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, MessageSquare, User, Send, Paperclip, Smile, Video, Phone, Copy, Check, Pencil, UserPlus, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Peer } from 'peerjs';
import './App.css';

const INITIAL_CONTACTS = {
  1: { name: "Contact 1", status: "online", avatar: null, phone: "111111" },
  2: { name: "Contact 2", status: "online", avatar: null, phone: "222222" },
  3: { name: "Contact 3", status: "online", avatar: null, phone: "333333" },
  4: { name: "Contact 4", status: "online", avatar: null, phone: "444444" },
  5: { name: "Contact 5", status: "online", avatar: null, phone: "555555" },
};

const INITIAL_MESSAGES = {
  1: [
    { id: 1, text: "नमस्ते! क्या हाल चाल है?", time: "12:40 PM", type: "incoming" },
    { id: 2, text: "सब ठीक है! मैं इस नए 'क्या हाल चाल' ऐप पर काम कर रहा हूँ।", time: "12:42 PM", type: "outgoing" },
    { id: 3, text: "यह तो बहुत अच्छा है! क्या मैं इसका डेमो देख सकता हूँ?", time: "12:43 PM", type: "incoming" },
  ],
  2: [
    { id: 1, text: "नमस्ते, क्या हम आज मिल रहे हैं?", time: "10:15 AM", type: "incoming" },
  ],
  3: [
    { id: 1, text: "प्रोजेक्ट बहुत अच्छा लग रहा है!", time: "यस्टरडे", type: "incoming" },
  ],
  4: [
    { id: 1, text: "जब खाली हों तो कॉल करें।", time: "सोमवार", type: "incoming" },
  ],
  5: [
    { id: 1, text: "जन्मदिन मुबारक!", time: "रविवार", type: "incoming" },
  ]
};

function App() {
  const [activeChat, setActiveChat] = useState(1);
  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('whatsapp_contacts');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('whatsapp_messages');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });
  const [inputValue, setInputValue] = useState("");
  const [isCalling, setIsCalling] = useState(null); // 'voice' or 'video' or null
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [myPeerId, setMyPeerId] = useState("");
  const [copied, setCopied] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [peer, setPeer] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState("Idle");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'chat' for mobile responsive view

  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const peerInstance = useRef(null);
  const ringtoneRef = useRef(null);
  const incomingRingRef = useRef(null);
  const activeCallRef = useRef(null);
  const connectionsRef = useRef({}); // Store active data connections

  const EMOJIS = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠"];

  useEffect(() => {
    localStorage.setItem('whatsapp_contacts', JSON.stringify(contacts));
  }, [contacts]);

  // Repair missing data for contacts
  useEffect(() => {
    setContacts(prev => {
      const repaired = { ...prev };
      let hasChanges = false;
      Object.keys(repaired).forEach(key => {
        const c = repaired[key];
        if (!c.phone || !c.status || !c.name) {
          repaired[key] = {
            ...c,
            name: c.name || "Unknown",
            phone: c.phone || "",
            status: c.status || "offline"
          };
          hasChanges = true;
        }
      });
      return hasChanges ? repaired : prev;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('whatsapp_messages', JSON.stringify(messages));
  }, [messages]);

  // Repair message data
  useEffect(() => {
    setMessages(prev => {
      const repaired = { ...prev };
      let hasChanges = false;
      Object.keys(repaired).forEach(key => {
        if (!Array.isArray(repaired[key])) {
          repaired[key] = []; // Should be array
          hasChanges = true;
        } else {
          const validMsgs = repaired[key].filter(m => m && (m.text || m.file || m.url));
          if (validMsgs.length !== repaired[key].length) {
            repaired[key] = validMsgs;
            hasChanges = true;
          }
        }
      });
      return hasChanges ? repaired : prev;
    });
  }, []);

  useEffect(() => {
    const initializePeer = (attemptId = null) => {
      const savedId = localStorage.getItem('whatupstyle_peer_id');

      // Generate a unique ID based on timestamp and random number
      const generateUniqueId = () => {
        const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
        const random = Math.floor(100 + Math.random() * 900); // 3-digit random
        return `${timestamp}${random}`; // 9-digit unique ID
      };

      const finalId = attemptId || savedId || generateUniqueId();

      console.log('Attempting to initialize peer with ID:', finalId);

      // Configure PeerJS with STUN servers for better connectivity
      const newPeer = new Peer(finalId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        },
        debug: 2 // Enable detailed logging
      });

      newPeer.on('open', (id) => {
        console.log('✅ Peer connection opened with ID:', id);
        setMyPeerId(id);
        setPeer(newPeer);
        localStorage.setItem('whatupstyle_peer_id', id);
      });

      newPeer.on('error', (err) => {
        console.error('❌ Peer error:', err);
        if (err.type === 'unavailable-id') {
          console.warn('ID conflict detected for ID:', finalId);

          // Check if this was a custom ID (saved by user) vs auto-generated
          const wasCustomId = savedId && savedId === finalId && !attemptId;

          let newId;
          if (wasCustomId) {
            // Preserve custom ID by adding a suffix
            const suffix = Math.floor(10 + Math.random() * 90); // 2-digit random
            newId = `${finalId}${suffix}`;
            console.warn(`Custom ID "${finalId}" is in use. Trying "${newId}" instead...`);

            // Don't save this modified ID - let user know
            alert(
              `Your custom ID "${finalId}" is already in use by another device.\n\n` +
              `Temporarily using: ${newId}\n\n` +
              `To fix this:\n` +
              `1. Close the other device using this ID, OR\n` +
              `2. Choose a different custom ID`
            );
          } else {
            // Auto-generated ID conflict - just generate a new random one
            newId = generateUniqueId();
            localStorage.setItem('whatupstyle_peer_id', newId);
          }

          // Destroy the failed peer and try again with new ID
          newPeer.destroy();

          // Retry with new ID after a short delay
          setTimeout(() => {
            initializePeer(newId);
          }, 500);
        } else if (err.type === 'peer-unavailable') {
          console.error('Target peer is not available/online');
        } else if (err.type === 'network') {
          console.error('Network error - check your internet connection');
        }
      });

      newPeer.on('disconnected', () => {
        console.warn('⚠️ Peer disconnected, attempting to reconnect...');
        newPeer.reconnect();
      });

      newPeer.on('call', async (call) => {
        console.log('📞 Incoming call from:', call.peer);
        setIncomingCall(call);

        // Handle caller cancelling before we answer
        call.on('close', () => {
          console.log('Incoming call closed before answering');
          setIncomingCall(null);
          stopCamera();
        });
        call.on('error', (err) => {
          console.error("Incoming call error:", err);
          setIncomingCall(null);
          stopCamera();
        });

        if (incomingRingRef.current) {
          incomingRingRef.current.play().catch(e => console.error("Ringtone blocked:", e));
        }
      });

      peerInstance.current = newPeer;

      // Handle incoming data connections (for chat)
      newPeer.on('connection', (conn) => {
        console.log('🔗 Incoming data connection from:', conn.peer);
        setupConnection(conn);
      });
    };

    const setupConnection = (conn) => {
      conn.on('open', () => {
        console.log('✅ Data connection established with:', conn.peer);
        connectionsRef.current[conn.peer] = conn;
      });

      conn.on('data', (data) => {
        console.log('📩 Received data from:', conn.peer, data);
        handleIncomingMessage(data, conn.peer);
      });

      conn.on('close', () => {
        console.log('❌ Data connection closed with:', conn.peer);
        delete connectionsRef.current[conn.peer];
      });

      conn.on('error', (err) => {
        console.error('⚠️ Data connection error:', err);
        delete connectionsRef.current[conn.peer];
      });
    };

    const handleIncomingMessage = (data, peerId) => {
      // Find contact by peerId (phone)
      let contactId = Object.keys(contacts).find(key => contacts[key].phone == peerId);

      // If not found, check if we need to add a temporary contact or if it's one of the initial ones
      if (!contactId) {
        // Create a new contact if it doesn't exist
        contactId = Date.now();
        setContacts(prev => ({
          ...prev,
          [contactId]: {
            name: `User ${peerId.substr(0, 4)}...`,
            status: "online",
            phone: peerId,
            isTemp: true
          }
        }));
      }

      const newMessage = {
        ...data,
        type: 'incoming', // Ensure it's marked as incoming
      };

      setMessages(prev => {
        const chatMessages = prev[contactId] || [];
        // Avoid duplicates if using IDs
        if (chatMessages.some(m => m.id === newMessage.id)) return prev;

        return {
          ...prev,
          [contactId]: [...chatMessages, newMessage]
        };
      });

      // Play notification sound if available
      if (incomingRingRef.current) {
        // Just a short beep or reuse ringtone momentarily (optional, skipping for now to avoid annoyance)
      }
    };

    // Initialize peer
    initializePeer();

    return () => {
      console.log('🔴 Destroying peer connection');
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
    };
  }, []);

  const stopCamera = () => {
    console.log("Stopping camera and releasing resources...");

    // STOP ALL SOUNDS
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    if (incomingRingRef.current) {
      incomingRingRef.current.pause();
      incomingRingRef.current.currentTime = 0;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped local track: ${track.kind}`);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped remote track: ${track.kind}`);
      });
      setRemoteStream(null);
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setCallStatus("Idle");
  };


  const startCall = async (type) => {
    const contact = contacts[activeChat];
    const targetId = contact.phone || prompt("Enter the ID or Phone Number you want to call:");
    if (!targetId) return;

    console.log("=== STARTING OUTGOING CALL ===");
    console.log("Target ID:", targetId);
    console.log("Call type:", type);

    setIsCalling(type);
    setCallStatus("Calling...");
    if (ringtoneRef.current) {
      ringtoneRef.current.play().catch(e => console.error("Ringtone blocked:", e));
    }

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia is not available!");
        console.error("navigator.mediaDevices:", navigator.mediaDevices);

        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        let errorMsg = "❌ Camera/Microphone access is not available.\n\n";

        if (!isHttps && !isLocalhost) {
          errorMsg += "⚠️ HTTPS REQUIRED!\n\n" +
            "You're accessing via:\n" + window.location.protocol + "//" + window.location.host + "\n\n" +
            "Mobile browsers require HTTPS for camera/mic access.\n\n" +
            "Solutions:\n" +
            "1. Set up HTTPS (recommended)\n" +
            "2. Use a tunneling service:\n" +
            "   • ngrok (https://ngrok.com)\n" +
            "   • localtunnel\n" +
            "   • Cloudflare Tunnel\n\n" +
            "3. Test on same device via localhost";
        } else {
          errorMsg += "Your browser doesn't support camera/microphone access.\n\n" +
            "Try using:\n" +
            "• Chrome for Android\n" +
            "• Safari for iOS\n" +
            "• Firefox for Android";
        }

        alert(errorMsg);
        handleHangup();
        return;
      }

      console.log("Requesting media devices - video:", type === 'video', "audio: true");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });

      console.log("Got local stream with tracks:", stream.getTracks().map(t => `${t.kind}: ${t.label}`));

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("Set local video element srcObject");
      }

      console.log("Initiating call to peer:", targetId);
      const call = peerInstance.current.call(targetId, stream, {
        metadata: { type }
      });

      // Store the active call reference
      activeCallRef.current = call;
      console.log("Outgoing call initiated and stored in activeCallRef");

      call.on('stream', (userRemoteStream) => {
        console.log("=== RECEIVED REMOTE STREAM (OUTGOING CALL) ===");
        console.log("Remote stream tracks:", userRemoteStream.getTracks().map(t => `${t.kind}: ${t.label}`));

        if (ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
        }
        setCallStatus("Talking");
        setRemoteStream(userRemoteStream);

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = userRemoteStream;
          console.log("Set remote video element srcObject");
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = userRemoteStream;
          console.log("Set remote audio element srcObject");
        }
      });

      call.on('close', () => {
        console.log("Outgoing call closed by remote peer");
        handleHangup();
      });

      call.on('error', (err) => {
        console.error("Outgoing call error:", err);
        handleHangup();
      });

      // Monitor connection state
      call.peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE connection state (outgoing):", call.peerConnection.iceConnectionState);
      };

      call.peerConnection.onconnectionstatechange = () => {
        console.log("Connection state (outgoing):", call.peerConnection.connectionState);

        if (call.peerConnection.connectionState === 'failed') {
          console.error("Connection failed!");
          alert("Connection failed. The other peer may be offline or unreachable.");
          handleHangup();
        }
      };

    } catch (err) {
      console.error("=== CALL ERROR ===");
      console.error("Error type:", err.name);
      console.error("Error message:", err.message);

      if (err.name === 'NotAllowedError') {
        alert("Camera/microphone access denied. Please allow access and try again.");
      } else if (err.name === 'NotFoundError') {
        alert("No camera/microphone found. Please check your devices.");
      } else {
        alert("Failed to access camera/mic or initiate call: " + err.message);
      }

      handleHangup();
    }
  };

  const handleHangup = () => {
    console.log("Hanging up call...");

    // Close the active call if it exists
    if (activeCallRef.current) {
      console.log("Closing active call");
      activeCallRef.current.close();
      activeCallRef.current = null;
    }

    // Close the incoming call object if it exists
    if (incomingCall) {
      console.log("Closing incoming call");
      incomingCall.close();
      setIncomingCall(null);
    }

    stopCamera();
    setIsCalling(null);
  };

  const answerCall = async () => {
    if (!incomingCall) {
      console.error('No incoming call to answer');
      return;
    }

    console.log("=== ANSWERING INCOMING CALL ===");
    console.log("Call peer ID:", incomingCall.peer);
    console.log("Call metadata:", incomingCall.options.metadata);

    if (incomingRingRef.current) {
      incomingRingRef.current.pause();
      incomingRingRef.current.currentTime = 0;
    }

    const type = incomingCall.options.metadata?.type || 'video';
    console.log("Call type:", type);

    setCallStatus("Connecting...");
    setIsCalling(type);

    // Store the active call reference BEFORE answering
    activeCallRef.current = incomingCall;
    console.log("Stored incoming call in activeCallRef");

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia is not available!");
        console.error("navigator.mediaDevices:", navigator.mediaDevices);

        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        let errorMsg = "❌ Camera/Microphone access is not available.\n\n";

        if (!isHttps && !isLocalhost) {
          errorMsg += "⚠️ HTTPS REQUIRED!\n\n" +
            "You're accessing via:\n" + window.location.protocol + "//" + window.location.host + "\n\n" +
            "Mobile browsers require HTTPS for camera/mic access.\n\n" +
            "Solutions:\n" +
            "1. Set up HTTPS (recommended)\n" +
            "2. Use a tunneling service:\n" +
            "   • ngrok (https://ngrok.com)\n" +
            "   • localtunnel\n" +
            "   • Cloudflare Tunnel\n\n" +
            "3. Test on same device via localhost";
        } else {
          errorMsg += "Your browser doesn't support camera/microphone access.\n\n" +
            "Try using:\n" +
            "• Chrome for Android\n" +
            "• Safari for iOS\n" +
            "• Firefox for Android";
        }

        alert(errorMsg);
        handleHangup();
        return;
      }

      console.log("Requesting media devices - video:", type === 'video', "audio: true");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });

      console.log("Got local stream with tracks:", stream.getTracks().map(t => `${t.kind}: ${t.label}`));

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("Set local video element srcObject");
      }

      // CRITICAL: Attach the stream event listener BEFORE answering
      // This ensures we don't miss the remote stream
      console.log("Attaching stream event listener...");
      incomingCall.on('stream', (userRemoteStream) => {
        console.log("=== RECEIVED REMOTE STREAM ===");
        console.log("Remote stream tracks:", userRemoteStream.getTracks().map(t => `${t.kind}: ${t.label}`));

        setCallStatus("Talking");
        setRemoteStream(userRemoteStream);

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = userRemoteStream;
          console.log("Set remote video element srcObject");
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = userRemoteStream;
          console.log("Set remote audio element srcObject");
        }
      });

      // Also listen for connection state changes
      if (incomingCall.peerConnection) {
        incomingCall.peerConnection.oniceconnectionstatechange = () => {
          console.log("ICE connection state:", incomingCall.peerConnection.iceConnectionState);
        };

        incomingCall.peerConnection.onconnectionstatechange = () => {
          console.log("Connection state:", incomingCall.peerConnection.connectionState);

          if (incomingCall.peerConnection.connectionState === 'failed') {
            console.error("Connection failed!");
            alert("Connection failed. Please try again.");
            handleHangup();
          }
        };
      }

      console.log("Answering call with local stream...");
      incomingCall.answer(stream);
      console.log("Call answered successfully");

      // Set up connection monitoring after answering (when peerConnection is created)
      setTimeout(() => {
        if (incomingCall.peerConnection) {
          console.log("Setting up connection state monitoring...");

          incomingCall.peerConnection.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", incomingCall.peerConnection.iceConnectionState);
          };

          incomingCall.peerConnection.onconnectionstatechange = () => {
            console.log("Connection state:", incomingCall.peerConnection.connectionState);

            if (incomingCall.peerConnection.connectionState === 'failed') {
              console.error("Connection failed!");
              alert("Connection failed. Please try again.");
              handleHangup();
            }
          };
        }
      }, 100);

      setIncomingCall(null);
    } catch (err) {
      console.error("=== ANSWER ERROR ===");
      console.error("Error type:", err.name);
      console.error("Error message:", err.message);
      console.error("Full error:", err);

      if (err.name === 'NotAllowedError') {
        alert("Camera/microphone access denied. Please allow access and try again.");
      } else if (err.name === 'NotFoundError') {
        alert("No camera/microphone found. Please check your devices.");
      } else {
        alert("Failed to answer call: " + err.message);
      }

      handleHangup();
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      incomingCall.close();
      setIncomingCall(null);
    }
    stopCamera(); // This stops the ringtone and resets states
  };

  const copyId = () => {
    navigator.clipboard.writeText(myPeerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setCustomId = () => {
    const currentId = myPeerId || localStorage.getItem('whatupstyle_peer_id') || 'Not set';
    const newId = prompt(
      `Current ID: ${currentId}\n\n` +
      `Enter your custom ID or Phone Number:\n` +
      `(e.g., your mobile number like 9876543210)\n\n` +
      `⚠️ IMPORTANT: Make sure this ID is NOT being used by another device/tab!\n` +
      `If it's already in use, you'll get a temporary modified ID.`
    );

    if (newId && newId.trim()) {
      const trimmedId = newId.trim();

      // Validate the ID (only alphanumeric, no spaces)
      if (!/^[a-zA-Z0-9]+$/.test(trimmedId)) {
        alert('Invalid ID! Please use only letters and numbers (no spaces or special characters).');
        return;
      }

      console.log('=== SETTING CUSTOM PEER ID ===');
      console.log('New custom ID:', trimmedId);

      // Save to localStorage
      localStorage.setItem('whatupstyle_peer_id', trimmedId);

      // Verify it was saved
      const savedCheck = localStorage.getItem('whatupstyle_peer_id');
      console.log('Verified saved ID:', savedCheck);

      // Destroy current peer connection
      if (peerInstance.current) {
        console.log('Destroying current peer connection...');
        peerInstance.current.destroy();
      }

      alert(
        `✅ Custom ID saved: ${trimmedId}\n\n` +
        `The app will now reload and connect with this ID.\n\n` +
        `⚠️ If you see a different ID after reload, it means:\n` +
        `• Another device/tab is already using "${trimmedId}"\n` +
        `• Close that device/tab first, then try again`
      );

      console.log('Reloading app...');
      window.location.reload();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  const handleSendMessage = (type = "text", content = null) => {
    if (type === "text" && !inputValue.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: type === "text" ? inputValue : (content?.name || "File"),
      file: type !== "text" ? content : null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "outgoing",
      msgType: type // "text", "image", "file"
    };

    // Update local UI immediately
    setMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMessage]
    }));

    // Send to peer
    const contact = contacts[activeChat];
    if (contact && contact.phone) {
      const targetPeerId = contact.phone;
      const conn = connectionsRef.current[targetPeerId];

      if (conn && conn.open) {
        conn.send(newMessage);
      } else if (peerInstance.current) {
        console.log("Initiating new data connection to:", targetPeerId);
        const newConn = peerInstance.current.connect(targetPeerId);

        newConn.on('open', () => {
          console.log("Connection opened, sending message...");
          newConn.send(newMessage);
          connectionsRef.current[targetPeerId] = newConn;
        });

        // Re-bind setupConnection to handle future data/errors on this new connection
        setupConnection(newConn);
      } else {
        console.warn("Cannot send message: Peer not initialized or valid target ID missing.");
      }
    }

    if (type === "text") setInputValue("");
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const type = file.type.startsWith('image/') ? 'image' : 'file';
      handleSendMessage(type, {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        url: event.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const addEmoji = (emoji) => {
    setInputValue(prev => prev + emoji);
  };

  const backToList = () => {
    setViewMode("list");
  };

  const startEditContact = () => {
    setEditName(contacts[activeChat].name);
    setEditPhone(contacts[activeChat].phone || "");
    setIsEditingContact(true);
  };

  const saveContactName = () => {
    setContacts(prev => ({
      ...prev,
      [activeChat]: { ...prev[activeChat], name: editName, phone: editPhone }
    }));
    setIsEditingContact(false);
  };

  const addNewContact = () => {
    const name = prompt("Enter contact name:");
    if (!name) return;
    const phone = prompt("Enter Phone Number / Peer ID:");
    if (!phone) return;

    const newId = Date.now();
    setContacts(prev => ({
      ...prev,
      [newId]: { name, status: "offline", avatar: null, phone }
    }));
    setActiveChat(newId);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const getLastMessagePreview = (id) => {
    const chatMsgs = messages[id];
    if (!chatMsgs || chatMsgs.length === 0) return "No messages yet";
    const lastMsg = chatMsgs[chatMsgs.length - 1];
    if (lastMsg.msgType === 'image') return "📷 Photo";
    if (lastMsg.msgType === 'file') return "📎 File";
    return lastMsg.text || "";
  };

  return (
    <div className={`app-container ${viewMode}`}>
      <div className={`sidebar ${viewMode === 'list' ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="profile-img">
            <img src="/logo.png" alt="App Logo" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          </div>
          <div className="app-brand-container">
            <div className="app-brand">Messaging Intelligence</div>
            <div className="app-subtitle">क्या हाल चाल?</div>
            <div
              className="my-id-badge"
              onClick={setCustomId}
              title="Click to change your ID/Phone Number"
              style={{
                backgroundColor: myPeerId ? '#dcf8c6' : '#fff3cd',
                color: myPeerId ? '#075e54' : '#856404',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {myPeerId ? (
                <>
                  <span style={{ color: '#25d366', marginRight: '4px' }}>●</span>
                  <span style={{ flex: 1 }}>ID: {myPeerId}</span>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {copied ? <Check size={12} /> : <Copy size={12} onClick={(e) => { e.stopPropagation(); copyId(); }} />}
                    <Pencil size={12} style={{ opacity: 0.7 }} />
                  </div>
                </>
              ) : (
                <>
                  <span style={{ color: '#ffa500', marginRight: '4px' }}>●</span>
                  Connecting...
                </>
              )}
            </div>
          </div>
          <div className="header-actions">
            <UserPlus size={20} className="icon" onClick={addNewContact} title="Add New Contact" />
            <MessageSquare size={20} className="icon" />
            <MoreVertical size={20} className="icon" />
          </div>
        </div>

        <div className="search-container">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="खोजें या नई चैट शुरू करें" />
          </div>
        </div>

        <div className="chat-list">
          {Object.keys(contacts).map((id) => (
            <div
              key={id}
              className={`chat-item ${activeChat === parseInt(id) ? 'active' : ''}`}
              onClick={() => {
                setActiveChat(parseInt(id));
                setIsEditingContact(false);
                setViewMode("chat");
              }}
            >
              <div className="chat-avatar">
                <User size={20} />
              </div>
              <div className="chat-info">
                <div className="chat-name-row">
                  <span className="chat-name">{contacts[id].name}</span>
                  <span className="chat-time">
                    {messages[id]?.[messages[id].length - 1]?.time || "12:45 PM"}
                  </span>
                </div>
                <div className="chat-subtitle-row">
                  <span className="chat-phone">{contacts[id].phone}</span>
                </div>
                <div className="chat-message-preview">
                  {getLastMessagePreview(id)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`chat-area ${viewMode === 'chat' ? 'active' : ''}`}>
        <div className="chat-header">
          {/* Mobile Back Button - Moved outside info-header to avoid overflow clipping */}
          <ChevronLeft
            size={24}
            className="mobile-back-icon icon"
            onClick={backToList}
          />
          <div className="chat-info-header">
            <div className="chat-avatar-small">
              <User size={18} />
            </div>
            <div className="chat-name-header">
              {isEditingContact ? (
                <div className="edit-contact-inputs">
                  <input
                    className="edit-name-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Name"
                    autoFocus
                  />
                  <input
                    className="edit-phone-input"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Phone/ID"
                    onKeyPress={(e) => e.key === 'Enter' && saveContactName()}
                  />
                  <button onClick={saveContactName} className="save-edit-btn">Save</button>
                </div>
              ) : (
                <div className="chat-name-row-header">
                  <h3 onClick={startEditContact} style={{ cursor: 'pointer' }}>
                    {contacts[activeChat].name}
                  </h3>
                  <Pencil size={14} className="edit-icon" onClick={startEditContact} />
                </div>
              )}
              <span>{contacts[activeChat].status} • {contacts[activeChat].phone}</span>
            </div>
          </div>
          <div className="header-actions">
            <Search size={20} className="icon" />
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Video size={20} className="icon" onClick={() => startCall('video')} title="Video Call" />
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Phone size={20} className="icon" onClick={() => startCall('voice')} title="Voice Call" />
            </motion.div>
            <MoreVertical size={20} className="icon" />
          </div>
        </div>

        <div className="messages-container">
          <AnimatePresence initial={false}>
            {messages[activeChat]?.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`message ${msg.type}`}
              >
                <div className="bubble">
                  {msg.msgType === 'image' ? (
                    <div className="message-image">
                      <img src={msg.file.url} alt={msg.file.name} />
                      <span className="file-info">{msg.file.name} ({msg.file.size})</span>
                    </div>
                  ) : msg.msgType === 'file' ? (
                    <div className="message-file">
                      <Paperclip size={20} />
                      <div className="file-detail">
                        <span className="file-name">{msg.file.name}</span>
                        <span className="file-size">{msg.file.size}</span>
                      </div>
                    </div>
                  ) : (
                    msg.text
                  )}
                  <span className="msg-time">{msg.time}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <div className="emoji-button-container">
              <Smile
                size={24}
                className={`icon ${showEmojiPicker ? 'active' : ''}`}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              />
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="emoji-picker"
                  >
                    <div className="emoji-grid">
                      {EMOJIS.map((emoji, i) => (
                        <span key={i} onClick={() => addEmoji(emoji)}>{emoji}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Paperclip
              size={24}
              className="icon"
              onClick={() => fileInputRef.current.click()}
            />

            <input
              type="text"
              placeholder="संदेश टाइप करें"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setShowEmojiPicker(false)}
            />
            <Send
              size={24}
              className={`icon send ${inputValue.trim() ? 'active' : ''}`}
              onClick={() => handleSendMessage("text")}
            />
          </div>
        </div>
      </div>

      {/* Audio elements for ringtones */}
      <audio ref={ringtoneRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" loop />
      <audio ref={incomingRingRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" loop />

      {/* Incoming Call Overlay */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="incoming-call-overlay"
          >
            <div className="incoming-call-content">
              <div className="calling-avatar">
                <User size={64} />
              </div>
              <h2>Incoming {incomingCall.options.metadata?.type || 'media'} call</h2>
              <h3>{incomingCall.peer}</h3>
              <div className="incoming-actions">
                <button className="answer-btn" onClick={answerCall}>
                  Answer
                </button>
                <button className="reject-btn" onClick={rejectCall}>
                  Reject
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calling (Outgoing) Overlay */}
      <AnimatePresence>
        {isCalling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="calling-overlay"
          >
            {/* Hidden audio element for remote voice in all call types */}
            <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

            {isCalling === 'video' && (
              <div className="video-container">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="remote-video"
                />
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="local-video-pip"
                />
              </div>
            )}
            <div className="calling-content">
              {isCalling === 'voice' && (
                <div className="calling-avatar">
                  <User size={64} />
                </div>
              )}
              <h2>{contacts[activeChat].name}</h2>
              <p>{callStatus}</p>
              <div className="calling-actions">
                <button className="hangup-btn" onClick={handleHangup}>
                  Hang Up
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
