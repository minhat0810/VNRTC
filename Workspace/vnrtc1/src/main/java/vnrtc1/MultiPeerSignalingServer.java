package vnrtc1;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@ServerEndpoint("/signal")
public class MultiPeerSignalingServer {

    private static final Set<Session> sessions = Collections.synchronizedSet(new HashSet<>());

    @OnOpen
    public void onOpen(Session session) {
        sessions.add(session);
        System.out.println("New connection established: " + session.getId());
    }

    @OnMessage
    public void onMessage(String message, Session session) throws IOException {
        System.out.println("Received message from " + session.getId() + ": " + message);

        // Broadcast the message to all connected clients except the sender
        for (Session s : sessions) {
            if (!s.equals(session)) {
                s.getBasicRemote().sendText(message);
            }
        }
    }

    @OnClose
    public void onClose(Session session, CloseReason closeReason) {
        sessions.remove(session);
        System.out.println("Connection closed: " + session.getId());
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        System.out.println("Error for session " + session.getId() + ": " + throwable.getMessage());
    }
}
