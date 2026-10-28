package dev.evekrani.a850c.remote;

import java.io.ByteArrayOutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/** Device-independent integration checks: real TCP sockets, no Android mocks. */
public final class LocalRemoteServerTest {
    public static void main(String[] args) throws Exception {
        List<String> commands = new ArrayList<>();
        try (LocalRemoteServer server = new LocalRemoteServer("<html>phone</html>", command -> {
            commands.add(command);
            return new LocalRemoteServer.CommandResult(true, "Uygulandı");
        }, () -> "{\"homeActive\":true,\"focus\":\"Netflix\"}")) {
            server.start();
            String host = "127.0.0.1:" + server.getPort();
            String base = server.getPath();
            expect(404, request(server, "GET", "/", host, null, ""));
            expect(404, request(server, "GET", "/r/wrong/", host, null, ""));
            expect(200, request(server, "GET", base, host, null, ""));
            expect(405, request(server, "GET", base + "command", host, null, ""));
            expect(403, request(server, "POST", base + "command", host, null, "left"));
            expect(403, request(server, "POST", base + "command", host, "http://evil.example", "left"));
            expect(403, request(server, "POST", base + "command", "evil.example:" + server.getPort(), "http://evil.example:" + server.getPort(), "left"));
            expect(400, request(server, "POST", base + "command", host, "http://" + host, "shell"));
            expect(200, request(server, "POST", base + "command", host, "http://" + host, "left"));
            expect(200, request(server, "POST", base + "command", host, "http://" + host, "home"));
            expect(200, request(server, "POST", base + "command", host, "http://" + host, "youtube"));
            if (!commands.equals(List.of("left", "home", "youtube"))) throw new AssertionError(commands);
            String status = request(server, "GET", base + "status", host, null, "");
            expect(200, status);
            if (!status.contains("\"homeActive\":true") || !server.isPhoneConnected()) throw new AssertionError(status);
            String html = request(server, "GET", base, host, null, "");
            if (!html.contains("Content-Security-Policy:") || html.contains("Access-Control-Allow-Origin")) throw new AssertionError(html);
            expect(413, request(server, "POST", base + "command", host, "http://" + host, "x".repeat(65)));
            expect(400, raw(server, "POST " + base + "command HTTP/1.1\r\nHost: " + host + "\r\nOrigin: http://" + host + "\r\nTransfer-Encoding: chunked\r\n\r\n"));
            expect(400, raw(server, "POST " + base + "command HTTP/1.1\r\nHost: " + host + "\r\nHost: " + host + "\r\n\r\n"));
            expect(431, raw(server, "GET " + base + " HTTP/1.1\r\nHost: " + host + "\r\nX-Large: " + "a".repeat(8300) + "\r\n\r\n"));
            expect(408, raw(server, "GET " + base + " HTTP/1.1\r\nHost: " + host + "\r\n"));
            if (server.getPath().length() < 50) throw new AssertionError("Token is too short");
            int port = server.getPort();
            server.close();
            try (Socket ignored = new Socket("127.0.0.1", port)) {
                throw new AssertionError("Socket stayed open after close");
            } catch (java.net.ConnectException expected) { }
        }
        System.out.println("Phone remote TCP routing, security, timeout and lifecycle checks passed");
    }

    private static String request(LocalRemoteServer server, String method, String path, String host, String origin, String body) throws Exception {
        return raw(server, method + " " + path + " HTTP/1.1\r\nHost: " + host + "\r\n" +
                (origin == null ? "" : "Origin: " + origin + "\r\n") +
                "Content-Type: text/plain;charset=UTF-8\r\nContent-Length: " + body.getBytes(StandardCharsets.UTF_8).length + "\r\n\r\n" + body);
    }

    private static String raw(LocalRemoteServer server, String data) throws Exception {
        try (Socket socket = new Socket("127.0.0.1", server.getPort())) {
            socket.setSoTimeout(3500);
            socket.getOutputStream().write(data.getBytes(StandardCharsets.UTF_8));
            socket.getOutputStream().flush();
            ByteArrayOutputStream result = new ByteArrayOutputStream();
            socket.getInputStream().transferTo(result);
            return result.toString(StandardCharsets.UTF_8);
        }
    }

    private static void expect(int status, String response) {
        if (!response.startsWith("HTTP/1.1 " + status + " ")) throw new AssertionError("Expected " + status + ": " + response);
    }
}
