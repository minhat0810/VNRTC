package vnrtc1;

import javax.websocket.DeploymentException;

import org.glassfish.tyrus.server.Server;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Vnrtc1Application {
    public static void main(String[] args) {
        SpringApplication.run(Vnrtc1Application.class, args);
        Server server = new Server("localhost", 8080, "/",null, MultiPeerSignalingServer.class);
        try {
            server.start();
            System.out.println("WebSocket server started on ws://localhost:8080/signal");
            // Keep the server running
            Thread.currentThread().join();
        } catch (DeploymentException | InterruptedException e) {
            e.printStackTrace();
        } finally {
            server.stop();
        }
    }
}
