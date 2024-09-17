package vnrtc1;

import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class MultiPeerSignalingServer extends TextWebSocketHandler {

    private static final Set<WebSocketSession> sessions = Collections.synchronizedSet(new HashSet<>());

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        sessions.add(session);
        System.out.println("New connection established: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        System.out.println("Received message from " + session.getId() + ": " + message.getPayload());

        // Broadcast the message to all connected clients except the sender
        for (WebSocketSession s : sessions) {
            if (!s.equals(session)) {
                s.sendMessage(message);
            }
        }
    }
    

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws IOException {
        sessions.remove(session);
        System.out.println("Connection closed: " + session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws IOException {
        System.out.println("Error for session " + session.getId() + ": " + exception.getMessage());
    }
}
