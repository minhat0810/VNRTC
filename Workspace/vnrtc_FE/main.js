const startCallButton = document.getElementById('startCall');
const endCallButton = document.getElementById('endCall');
const videoContainer = document.getElementById('videos');

let localStream;
let peerConnections = {};
let socket;

const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

startCallButton.addEventListener('click', async () => {
    socket = new WebSocket('ws://localhost:8080/signal');

    socket.onopen = () => {
        console.log('WebSocket connection is open.');
        socket.send(JSON.stringify({ type: 'join' }));
        // Notify the server that the client is ready after WebSocket is open
        socket.send(JSON.stringify({ type: 'ready' }));
    };

    socket.onmessage = async (message) => {
        const data = JSON.parse(message.data);
        console.log('Received:', data.type);

        switch (data.type) {
            case 'offer':
                await handleOffer(data.offer, data.sender);
                break;
            case 'answer':
                handleAnswer(data.answer, data.sender);
                break;
            case 'ice-candidate':
                handleICECandidate(data.candidate, data.sender);
                break;
            default:
                console.log('Unknown message type:', data.type);
                break;
        }
    };

    // Get local media stream
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        addVideoElement('local', localStream);
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
});

endCallButton.addEventListener('click', () => {
    for (let id in peerConnections) {
        peerConnections[id].close();
        delete peerConnections[id];
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (socket) {
        socket.close();
    }
});

function addVideoElement(id, stream) {
    const videoElement = document.createElement('video');
    videoElement.id = id;
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.playsInline = true; // For mobile compatibility
    videoContainer.appendChild(videoElement);
}

async function handleOffer(offer, senderId) {
    const peerConnection = new RTCPeerConnection(servers);
    peerConnections[senderId] = peerConnection;

    // Add local stream tracks to the peer connection
    if (localStream) {
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    }

    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Send the answer back to the offerer
        socket.send(JSON.stringify({
            type: 'answer',
            answer: peerConnection.localDescription,
            sender: senderId
        }));
    } catch (error) {
        console.error('Error handling offer:', error);
    }

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
    const peerConnection = peerConnections[senderId];
    if (peerConnection) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
            .catch(error => console.error('Error setting remote description for answer:', error));
    }
}

function handleICECandidate(candidate, senderId) {
    const peerConnection = peerConnections[senderId];
    if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            .catch(error => console.error('Error adding ICE candidate:', error));
    }
}
