package vnrtc1;

import java.io.IOException;
import java.util.Hashtable;

import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

import org.json.JSONObject;

@ServerEndpoint("/ws")
public class MultiPeerSignalingServer {

    private static final Hashtable<String, Session> sessions = new Hashtable<>();

    @OnOpen
    public void onOpen(Session session) {
        sessions.put(session.getId(), session);
        doSendToAllClients(session);
    }

    @OnMessage
    public void onMessage(String message, Session session) throws IOException {
    	JSONObject 	json 	= 	new JSONObject(message);
    	String 		type 	=	json.getString("type");	
    	String 		id 		= 	json.getString("partnerId");
    	JSONObject 	res 	= 	new JSONObject();
    	
    	switch (type) {
		case "signal":
//			if (!id.equals(null)) return;
			res.put("type", "signal").put("partnerId", session.getId()).put("signal", json.getJSONObject("signal"));
			sessions.get(id).getBasicRemote().sendText(res.toString());
			break;
			
		case "initSend":
			res = new JSONObject().put("type", "initSend").put("partnerId", session.getId());
			sessions.get(id).getBasicRemote().sendText(res.toString());
			break;
			
		case "disconnect":
	
			break;

		default:
			break;
		}
    }
    
    public void doSendToAllClients (Session session) {
        // Phát tín hiệu cho tất cả các session khác, trừ session đang gửi
		sessions.forEach((id, s) -> {
			try {
				if (!s.equals(session)) {
					JSONObject res = new JSONObject().put("type", "initReceive").put("partnerId", session.getId());
					s.getBasicRemote().sendText(res.toString());
				}
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		});
    }

    @OnClose
    public void onClose(Session session) {
        sessions.remove(session.getId());
    }
}
