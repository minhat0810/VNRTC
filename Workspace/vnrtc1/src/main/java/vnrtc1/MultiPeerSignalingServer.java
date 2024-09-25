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
        System.out.println("Connected: " +session.getId());
    }

    @OnMessage
    public void onMessage(String message, Session session) throws IOException {
    	JSONObject 	json 	= 	new JSONObject(message);
    	String 		type 	=	json.getString("type");	
    	String 		id 		= json.getString("partnerId");
    	String 		res;
    	
    	switch (type) {
		case "signal":
			//if (!sessions.get(id).equals(null)) return;
		//	 JSONObject signal = json.getJSONObject("signal");
//			res = new JSONObject().put("type", "signal").put("partnerId", session.getId()).put("signal", json.getString("signal")).toString();
//			sessions.get(id).getBasicRemote().sendText(res);
			  // Lấy đối tượng signal từ client (dưới dạng JSONObject)
		    JSONObject signalData = json.getJSONObject("signal");
		    
		    // Tạo đối tượng JSON mới để gửi đến peer khác
		    res = new JSONObject()
		            .put("type", "signal")
		            .put("partnerId", session.getId())
		            .put("signal", signalData)  // Gửi trực tiếp JSONObject này
		            .toString();
		    
		    // Gửi thông điệp tới peer đối tác
		    sessions.get(id).getBasicRemote().sendText(res);
			break;
			
		case "initSend":
			res = new JSONObject().put("type", "initSend").put("partnerId", session.getId()).toString();
			sessions.get(id).getBasicRemote().sendText(res);
			break;
			
		case "disconnect":
			doDisconnect(session);
			break;

		default:
			break;
		}
    }
    
    public void doDisconnect(Session session) {
    	String res = new JSONObject().put("type", "disconnect").put("partnerId", session.getId()).toString();
		sessions.forEach((id, s) -> {
			try {
				if (!s.equals(session)) {
					s.getBasicRemote().sendText(res);
				}
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		});
    }
    
    public void doSendToAllClients (Session session) {
        // Phát tín hiệu cho tất cả các session khác, trừ session đang gửi
		sessions.forEach((id, s) -> {
			try {
				if (!s.equals(session)) {
					String res = new JSONObject().put("type", "initReceive").put("partnerId", session.getId()).toString();
					s.getBasicRemote().sendText(res);
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
