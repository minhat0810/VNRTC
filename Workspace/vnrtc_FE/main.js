const localVideo = document.getElementById('localVideo');
let localStream = null;
const remoteVideos = document.getElementById('remoteVideos');
let peers = {};
let connectedPeers = {};
const toggleMicButton = document.getElementById('muteButton');
const toggleCamButton = document.getElementById('cameraButton');
const toggleEndCallButton = document.getElementById('endCallButton');
let micEnabled = true;
let camEnabled = true;

let ws;


// Thiết lập stream video từ camera
const startMedia = async function() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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
    ws = new WebSocket('ws://localhost:8080/ws'); // Điều chỉnh địa chỉ theo server

    // Khi nhận được thông điệp từ server
    ws.onmessage = function (event) {
        const message = JSON.parse(event.data);
        const { type, partnerId, signal } = message;
        console.log(type, partnerId);
        // connectedPeers[partnerId] = peers[partnerId]
        // console.log(con);
        
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
            case 'disconnect':
                endPeerConnection(partnerId);
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

          connectedPeers[partnerId] = peers[partnerId]; // Lưu peer vào danh sách

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
            remoteVideo.id = 'video-'+ partnerId;
            remoteVideos.appendChild(remoteVideo);
        });

        peers[partnerId].on('error', err => {
            console.error('Lỗi trong kết nối với peer:', err);
        });
    };
}

toggleEndCallButton.addEventListener('click', () => {
    if (localStream) {
        const tracks = localStream.getTracks();

        tracks.forEach(function (track) {
            track.stop()
        })

        localVideo.srcObject = null
    }

    for (let socket_id in peers) {
        endPeerConnection(socket_id)
    }

    ws.send(JSON.stringify({ type: 'disconnect', partnerId: "" }));
    ws.close();
});

// Khi nhấn nút bật/tắt mic
toggleMicButton.addEventListener('click', function () {
    micEnabled = !micEnabled;
    
    // Bật hoặc tắt audio track
    localStream.getAudioTracks().forEach(track => track.enabled = micEnabled);
    
    // Cập nhật tên nút
    toggleMicButton.innerText = micEnabled ? "Tắt Mic" : "Bật Mic";
});

// Khi nhấn nút bật/tắt camera
toggleCamButton.addEventListener('click', function () {
    camEnabled = !camEnabled;
    
    // Bật hoặc tắt video track
    localStream.getVideoTracks().forEach(track => track.enabled = camEnabled);
    
    // Cập nhật tên nút
    toggleCamButton.innerText = camEnabled ? "Tắt Camera" : "Bật Camera";
});



function endPeerConnection(partnerId) {
    if (peers[partnerId]) {
        // Hủy kết nối peer
        peers[partnerId].destroy();
        console.log(`Đã kết thúc cuộc gọi với peer: ${partnerId}`);

        // Xóa video của peer từ giao diện
        const remoteVideo = document.getElementById('video-'+ partnerId);
        if (remoteVideo) {
            remoteVideo.srcObject.getTracks().forEach(track => track.stop()); // Dừng stream
            remoteVideo.remove(); // Xóa phần tử video
        }

        // Xóa peer khỏi danh sách các peer
        delete peers[partnerId];
        delete connectedPeers[partnerId]; // Cập nhật danh sách connectedPeers
    }
}