package dev.evekrani.a850c.remote;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/** Small, bounded HTTP/1.1 endpoint. It only controls the app that owns it. */
public final class LocalRemoteServer implements AutoCloseable {
    public interface CommandHandler { CommandResult handle(String command); }
    public interface StatusProvider { String json(); }

    public static final class CommandResult {
        public final boolean accepted;
        public final String message;
        public CommandResult(boolean accepted, String message) {
            this.accepted = accepted;
            this.message = message;
        }
    }

    private static final int MAX_HEADER_BYTES = 8192;
    private static final int MAX_BODY_BYTES = 64;
    private static final Set<String> COMMANDS = Collections.unmodifiableSet(
        new java.util.HashSet<>(Arrays.asList("left", "right", "up", "down", "enter", "back", "home", "youtube", "netflix"))
    );
    private final byte[] html;
    private final CommandHandler handler;
    private final StatusProvider status;
    private final String token;
    private final String path;
    private final Set<Socket> clients = Collections.newSetFromMap(new ConcurrentHashMap<Socket, Boolean>());
    private final ThreadPoolExecutor workers = new ThreadPoolExecutor(2, 2, 0L, TimeUnit.MILLISECONDS,
        new ArrayBlockingQueue<Runnable>(4), runnable -> daemon(runnable, "ev-phone-http"));
    private volatile ServerSocket server;
    private volatile boolean closed;
    private volatile long lastPhoneNanos;
    private int port;

    public LocalRemoteServer(String html, CommandHandler handler, StatusProvider status) {
        this.html = html.getBytes(StandardCharsets.UTF_8);
        this.handler = handler;
        this.status = status;
        byte[] secret = new byte[24];
        new SecureRandom().nextBytes(secret);
        StringBuilder encoded = new StringBuilder(48);
        for (byte value : secret) encoded.append(String.format(Locale.ROOT, "%02x", value & 0xff));
        token = encoded.toString();
        path = "/r/" + token + "/";
    }

    public synchronized void start() throws IOException {
        if (closed) throw new IOException("Server is closed");
        if (server != null) return;
        server = new ServerSocket(0, 8, InetAddress.getByName("0.0.0.0"));
        port = server.getLocalPort();
        daemon(this::accept, "ev-phone-listener").start();
    }

    public int getPort() { return port; }
    public String getPath() { return path; }

    /** A loaded browser page heartbeats every two seconds; stale tabs expire. */
    public boolean isPhoneConnected() {
        long seen = lastPhoneNanos;
        return seen != 0 && System.nanoTime() - seen < TimeUnit.SECONDS.toNanos(8);
    }

    private void accept() {
        while (!closed) {
            Socket client = null;
            try {
                client = server.accept();
                client.setSoTimeout(2000);
                clients.add(client);
                final Socket accepted = client;
                workers.execute(() -> serve(accepted));
            } catch (RejectedExecutionException busy) {
                if (client != null) { clients.remove(client); closeSocket(client); }
            } catch (IOException unavailable) {
                if (client != null) { clients.remove(client); closeSocket(client); }
                if (closed) return;
            }
        }
    }

    private void serve(Socket client) {
        try {
            try {
                route(client);
            } catch (ProtocolError invalid) {
                respond(client, invalid.status, "application/json; charset=utf-8", json(false, "Geçersiz istek").getBytes(StandardCharsets.UTF_8));
            } catch (java.net.SocketTimeoutException timeout) {
                respond(client, 408, "application/json; charset=utf-8", json(false, "İstek zaman aşımına uğradı").getBytes(StandardCharsets.UTF_8));
            }
        } catch (IOException disconnected) {
            // A phone can leave Wi-Fi at any time. The next browser poll reconnects.
        } finally {
            clients.remove(client);
            closeSocket(client);
        }
    }

    private void route(Socket client) throws IOException, ProtocolError {
        HeaderReader reader = new HeaderReader(client.getInputStream());
        String[] request = reader.line().split(" ", -1);
        if (request.length != 3 || (!request[2].equals("HTTP/1.1") && !request[2].equals("HTTP/1.0"))) throw new ProtocolError(400);
        String method = request[0];
        String target = request[1];
        Map<String, String> headers = new HashMap<>();
        for (String line = reader.line(); !line.isEmpty(); line = reader.line()) {
            int split = line.indexOf(':');
            if (split <= 0) throw new ProtocolError(400);
            String name = line.substring(0, split).toLowerCase(Locale.ROOT);
            if (!name.matches("[a-z0-9!#$%&'*+.^_`|~-]+") || headers.containsKey(name)) throw new ProtocolError(400);
            headers.put(name, line.substring(split + 1).trim());
        }
        String authority = client.getLocalAddress().getHostAddress() + ":" + port;
        if (!authority.equals(headers.get("host"))) throw new ProtocolError(403);
        if (headers.containsKey("transfer-encoding")) throw new ProtocolError(400);
        int length = 0;
        if (headers.containsKey("content-length")) {
            String rawLength = headers.get("content-length");
            if (!rawLength.matches("[0-9]{1,9}")) throw new ProtocolError(400);
            length = Integer.parseInt(rawLength);
            if (length > MAX_BODY_BYTES) throw new ProtocolError(413);
        }
        if (!hasToken(target)) throw new ProtocolError(404);
        String endpoint = target.substring(path.length());
        if ((endpoint.isEmpty() || endpoint.equals("status")) && !method.equals("GET")) throw new ProtocolError(405);
        if (endpoint.equals("command") && !method.equals("POST")) throw new ProtocolError(405);
        if (endpoint.isEmpty()) {
            if (length != 0) throw new ProtocolError(400);
            respond(client, 200, "text/html; charset=utf-8", html);
        } else if (endpoint.equals("status")) {
            if (length != 0) throw new ProtocolError(400);
            lastPhoneNanos = System.nanoTime();
            respond(client, 200, "application/json; charset=utf-8", status.json().getBytes(StandardCharsets.UTF_8));
        } else if (endpoint.equals("command")) {
            if (!("http://" + authority).equals(headers.get("origin"))) throw new ProtocolError(403);
            String fetchSite = headers.get("sec-fetch-site");
            if (fetchSite != null && !fetchSite.equals("same-origin")) throw new ProtocolError(403);
            String contentType = headers.get("content-type");
            if (contentType == null || !contentType.split(";", 2)[0].trim().equalsIgnoreCase("text/plain")) throw new ProtocolError(415);
            byte[] bytes = new byte[length];
            for (int count = 0; count < length;) {
                reader.checkDeadline();
                int read = client.getInputStream().read(bytes, count, length - count);
                if (read < 0) throw new ProtocolError(400);
                count += read;
            }
            String command = new String(bytes, StandardCharsets.UTF_8);
            if (!COMMANDS.contains(command)) throw new ProtocolError(400);
            lastPhoneNanos = System.nanoTime();
            CommandResult result;
            try {
                result = handler.handle(command);
            } catch (RuntimeException failed) {
                result = new CommandResult(false, "Komut uygulanamadı");
            }
            respond(client, result.accepted ? 200 : 409, "application/json; charset=utf-8", json(result.accepted, result.message).getBytes(StandardCharsets.UTF_8));
        } else {
            throw new ProtocolError(404);
        }
    }

    private boolean hasToken(String target) {
        if (!target.startsWith("/r/") || target.length() < path.length()) return false;
        if (target.charAt(3 + token.length()) != '/') return false;
        String supplied = target.substring(3, 3 + token.length());
        return MessageDigest.isEqual(token.getBytes(StandardCharsets.US_ASCII), supplied.getBytes(StandardCharsets.US_ASCII));
    }

    private static void respond(Socket client, int code, String contentType, byte[] body) throws IOException {
        String reason;
        switch (code) {
            case 200: reason = "OK"; break;
            case 403: reason = "Forbidden"; break;
            case 404: reason = "Not Found"; break;
            case 405: reason = "Method Not Allowed"; break;
            case 408: reason = "Request Timeout"; break;
            case 409: reason = "Conflict"; break;
            case 413: reason = "Payload Too Large"; break;
            case 415: reason = "Unsupported Media Type"; break;
            case 431: reason = "Request Header Fields Too Large"; break;
            default: reason = "Bad Request";
        }
        String header = "HTTP/1.1 " + code + " " + reason + "\r\n" +
            "Content-Type: " + contentType + "\r\nContent-Length: " + body.length + "\r\n" +
            "Connection: close\r\nCache-Control: no-store\r\nReferrer-Policy: no-referrer\r\n" +
            "X-Content-Type-Options: nosniff\r\nX-Frame-Options: DENY\r\n" +
            "Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'\r\n" +
            (code == 405 ? "Allow: GET, POST\r\n" : "") + "\r\n";
        OutputStream stream = client.getOutputStream();
        stream.write(header.getBytes(StandardCharsets.US_ASCII));
        stream.write(body);
        stream.flush();
        client.shutdownOutput();
    }

    private static String json(boolean ok, String message) {
        StringBuilder value = new StringBuilder();
        for (int i = 0; i < message.length(); i++) {
            char ch = message.charAt(i);
            if (ch == '"' || ch == '\\') value.append('\\').append(ch);
            else if (ch < 32) value.append(' ');
            else value.append(ch);
        }
        return "{\"ok\":" + ok + ",\"message\":\"" + value + "\"}";
    }

    @Override public synchronized void close() {
        if (closed) return;
        closed = true;
        if (server != null) { try { server.close(); } catch (IOException ignored) { } }
        workers.shutdownNow();
        for (Socket socket : clients) closeSocket(socket);
        clients.clear();
    }

    private static Thread daemon(Runnable task, String name) {
        Thread thread = new Thread(task, name);
        thread.setDaemon(true);
        return thread;
    }

    private static void closeSocket(Socket socket) {
        try { socket.close(); } catch (IOException ignored) { }
    }

    private static final class ProtocolError extends Exception {
        final int status;
        ProtocolError(int status) { this.status = status; }
    }

    private static final class HeaderReader {
        final InputStream stream;
        final long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(3);
        int count;
        HeaderReader(InputStream stream) { this.stream = stream; }
        String line() throws IOException, ProtocolError {
            ByteArrayOutputStream line = new ByteArrayOutputStream();
            while (true) {
                int ch = read();
                if (ch == '\r') {
                    if (read() != '\n') throw new ProtocolError(400);
                    return new String(line.toByteArray(), StandardCharsets.US_ASCII);
                }
                if (ch < 32 && ch != '\t' || ch > 126) throw new ProtocolError(400);
                line.write(ch);
            }
        }
        int read() throws IOException, ProtocolError {
            checkDeadline();
            if (++count > MAX_HEADER_BYTES) throw new ProtocolError(431);
            int value = stream.read();
            if (value < 0) throw new ProtocolError(400);
            return value;
        }
        void checkDeadline() throws java.net.SocketTimeoutException {
            if (System.nanoTime() - deadline >= 0) throw new java.net.SocketTimeoutException();
        }
    }
}
