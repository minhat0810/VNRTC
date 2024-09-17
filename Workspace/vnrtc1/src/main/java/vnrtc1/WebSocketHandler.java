//package vnrtc1;
//
//import org.springframework.stereotype.Component;
//import org.springframework.web.socket.*;
//import org.springframework.web.socket.handler.TextWebSocketHandler;
//
//import java.util.HashMap;
//import java.util.Map;
//
//@Component
//public class WebSocketHandler extends TextWebSocketHandler {
//
//    private Map<String, WebSocketSession> sessions = new HashMap<>();
//
//    @Override
//    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
//        sessions.put(session.getId(), session);
//        broadcastMessage(session, "ready", session.getId());
//    }
//
//    @Override
//    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
//        String payload = message.getPayload();
//        for (WebSocketSession peer : sessions.values()) {
//            if (!peer.getId().equals(session.getId())) {
//                peer.sendMessage(new TextMessage(payload));
//            }
//        }
//    }
//
//    @Override
//    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
//        sessions.remove(session.getId());
//    }
//
//    private void broadcastMessage(WebSocketSession session, String type, String senderId) throws Exception {
//        String message = String.format("{\"type\":\"%s\", \"sender\":\"%s\"}", type, senderId);
//        session.sendMessage(new TextMessage(message));
//    }
//}
