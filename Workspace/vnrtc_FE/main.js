const localVideo = document.getElementById('localVideo');
let localStream = null;
const remoteVideos = document.getElementById('remoteVideos');

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, // Sử dụng STUN server miễn phí của Google
    ]
};
let peers = {};

// Thiết lập stream video từ camera
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    localVideo.srcObject = stream;
    localStream = stream;

    do_lc_init_socket();

}).catch(error => {
    console.error('Error accessing media devices.', error);
});

const do_lc_init_socket = function () {
    // Kết nối WebSocket tới server
    const ws = new WebSocket('ws://localhost:8080/ws');  // Điều chỉnh địa chỉ theo server

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
                addPeer(partnerId, true);
                break;

            case 'signal':
                peers[partnerId].signal(signal);
                break;
        }

    };
}

// Phát tín hiệu kết nối tới server
function sendSignal(signal) {
    ws.send(JSON.stringify(signal));
}

// Tạo đối tượng SimplePeer
const addPeer = function (partnerId, isInitiator) {
    peers[partnerId] = new SimplePeer({
        initiator   :   isInitiator, 
        trickle     :   false, 
        stream      :   localStream,
    });

    peers[partnerId].on('signal', data => {
        sendSignal({
            type        :   'signal',
            signal      :   data,
            partnerId   :   partnerId,
        });
    });

    peers[partnerId].on('stream', remoteStream => {
        const remoteVideo       = document.createElement('video');
        remoteVideo.srcObject   = remoteStream;
        remoteVideo.autoplay    = true;
        remoteVideo.playsInline = true;
        remoteVideos.append(remoteVideo);
    });
}
