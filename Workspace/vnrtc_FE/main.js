const localVideo = document.getElementById('localVideo');
let localStream = null;
const remoteVideos = document.getElementById('remoteVideos');

// Kết nối WebSocket tới server
const ws = new WebSocket('ws://localhost:8080/ws');  // Điều chỉnh địa chỉ theo server
let peers = {};

// Thiết lập stream video từ camera
const startMedia = async function() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = stream;
    localStream = stream;
}

startMedia();

// Khi nhận được thông điệp từ server
ws.onmessage = function (event) {
    const message = JSON.parse(event.data);
    const { type, partnerId, signal } = message;

    switch (type) {
        case 'initReceive':
            addPeer(partnerId, false);
            ws.send(JSON.stringify({ type: 'initSend', partnerId: partnerId}));
            break;
        case 'initSend':
            addPeer(partnerId, true)
            break;

        case 'signal':
            peers[partnerId].signal(signal);
            break;
    }

};

// Phát tín hiệu kết nối tới server
function sendSignal(signal) {
    ws.send(JSON.stringify(signal));
}

// Tạo đối tượng SimplePeer
const addPeer = function (partnerId, isInitiator) {
    peers[partnerId] = new SimplePeer({
        initiator: isInitiator,
        stream: localStream,
        trickle: false
    });

    peers[partnerId].on('signal', data => {
        sendSignal({
            signal: data,
            partnerId: partnerId,
            type: 'signal'
        });
    });

    peers[partnerId].on('stream', remoteStream => {
        const remoteVideo = document.createElement('video');
        remoteVideo.srcObject = remoteStream;
        remoteVideo.autoplay = true;
        remoteVideo.playsInline = true;
        remoteVideos.appendChild(remoteVideo);
    });

}
