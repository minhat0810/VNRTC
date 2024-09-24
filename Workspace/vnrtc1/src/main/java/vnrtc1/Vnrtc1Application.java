package vnrtc1;

import org.glassfish.tyrus.server.Server;

//@SpringBootApplication
public class Vnrtc1Application {
    public static void main(String[] args) throws Exception {
//        SpringApplication.run(Vnrtc1Application.class, args);
        Server server = new Server("localhost", 8080, "/", MultiPeerSignalingServer.class);
        try {
            server.start();
            System.out.println("WebSocket server started on ws://localhost:8080/ws");
            // Keep the server running
            Thread.currentThread().join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            server.stop();
        }
    }
}
