const startCallButton = document.getElementById('startCall');
const endCallButton = document.getElementById('endCall');
const videoContainer = document.getElementById('videos');

let localStream;
let peerConnections = {};
let socket; // WebSocket or other signaling method

const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

startCallButton.addEventListener('click', async () => {
    // Initialize WebSocket connection
    socket = new WebSocket('ws://localhost:8080/signal');
    
    socket.onmessage = async (message) => {
        const data = JSON.parse(message.data);
        if (data.type === 'offer') {
            handleOffer(data.offer, data.sender);
        } else if (data.type === 'answer') {
            handleAnswer(data.answer, data.sender);
        } else if (data.type === 'ice-candidate') {
            handleICECandidate(data.candidate, data.sender);
        }
    };

    // Get local media stream
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    // Display local video
    addVideoElement('local', localStream);

    // Notify server to join the room
    socket.send(JSON.stringify({ type: 'join' }));

    // Start handling peer connections
    socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'ready' }));
    };
});

endCallButton.addEventListener('click', () => {
    for (let id in peerConnections) {
        peerConnections[id].close();
        delete peerConnections[id];
    }
    localStream.getTracks().forEach(track => track.stop());
    socket.close();
});

function addVideoElement(id, stream) {
    const videoElement = document.createElement('video');
    videoElement.id = id;
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoContainer.appendChild(videoElement);
}

function handleOffer(offer, senderId) {
    const peerConnection = new RTCPeerConnection(servers);
    peerConnections[senderId] = peerConnection;

    peerConnection.addStream(localStream);

    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => peerConnection.createAnswer())
        .then(answer => peerConnection.setLocalDescription(answer))
        .then(() => {
            socket.send(JSON.stringify({
                type: 'answer',
                answer: peerConnection.localDescription,
                sender: senderId
            }));
        });

    peerConnection.ontrack = event => {
        addVideoElement(senderId, event.streams[0]);
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.send(JSON.stringify({
                type: 'ice-candidate',
                candidate: event.candidate,
                sender: senderId
            }));
        }
    };
}

function handleAnswer(answer, senderId) {
    peerConnections[senderId].setRemoteDescription(new RTCSessionDescription(answer));
}

function handleICECandidate(candidate, senderId) {
    peerConnections[senderId].addIceCandidate(new RTCIceCandidate(candidate));
}