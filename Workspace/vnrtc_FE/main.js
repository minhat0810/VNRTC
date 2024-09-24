const localVideo = document.getElementById('localVideo');
let localStream = null;
const remoteVideos = document.getElementById('remoteVideos');
let peers = {};

// Thiết lập stream video từ camera
const startMedia = async function() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        localVideo.srcObject = stream;
        localStream = stream;
        console.log('localStream sẵn sàng:', localStream);

        // Chỉ mở WebSocket khi localStream đã sẵn sàng
        initWebSocket();
    } catch (error) {
        console.error('Không thể truy cập vào camera:', error);
    }
};

startMedia(); // Gọi hàm để khởi động việc lấy camera

// Hàm khởi tạo WebSocket sau khi localStream đã sẵn sàng
function initWebSocket() {
    const ws = new WebSocket('ws://localhost:8080/ws'); // Điều chỉnh địa chỉ theo server

    // Khi nhận được thông điệp từ server
    ws.onmessage = function (event) {
        const message = JSON.parse(event.data);
        const { type, partnerId, signal } = message;
        console.log(type, partnerId);

        switch (type) {
            case 'initReceive':
                addPeer(partnerId, false);
                ws.send(JSON.stringify({ type: 'initSend', partnerId: partnerId }));
                break;
            case 'initSend':
                console.log('Peer gửi kết nối từ:', partnerId);
                addPeer(partnerId, true);
                break;
            case 'signal':
                if (peers[partnerId]) {
                    peers[partnerId].signal(signal);
                } else {
                    console.error("Peer chưa được khởi tạo:", partnerId);
                }
                break;
        }
    };

    // Phát tín hiệu kết nối tới server
    function sendSignal(signal) {
        ws.send(JSON.stringify(signal));
    }

    // Tạo đối tượng SimplePeer
    const addPeer = function (partnerId, isInitiator) {
        if (!localStream) {
            console.error("localStream is missing");
            return; // Thoát nếu không có localStream
        }

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
            console.log('Tín hiệu gửi:', data);
        });

        peers[partnerId].on('stream', remoteStream => {
            console.log('Nhận được remote stream:', remoteStream);
            const remoteVideo = document.createElement('video');
            remoteVideo.srcObject = remoteStream;
            remoteVideo.autoplay = true;
            remoteVideo.playsInline = true;
            remoteVideos.appendChild(remoteVideo);
        });

        peers[partnerId].on('error', err => {
            console.error('Lỗi trong kết nối với peer:', err);
        });
    };
}
