package dev.evekrani.a850c

import android.os.Handler
import android.os.HandlerThread
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

internal fun resolveRemoteBase(explicit: String?): String? {
    val candidates = listOf(explicit, System.getenv("EV_REMOTE_URL"), BuildConfig.EV_REMOTE_URL)
    for (raw in candidates) {
        val value = raw?.trim()?.trimEnd('/') ?: continue
        if (value.startsWith("http://") || value.startsWith("https://")) {
            return value
        }
    }
    return null
}

internal class RemoteClient(
    private val baseUrl: String,
    private val view: HomeView,
) {
    private val thread = HandlerThread("evekrani-remote")
    private var handler: Handler? = null
    private var seen = 0

    @Volatile
    private var stopped = false

    fun start() {
        if (thread.isAlive) {
            return
        }
        thread.start()
        val worker = Handler(thread.looper)
        handler = worker
        worker.post { tick() }
    }

    fun stop() {
        stopped = true
        handler?.removeCallbacksAndMessages(null)
        thread.quitSafely()
    }

    private fun tick() {
        if (stopped) {
            return
        }
        val worker = handler ?: return
        val commands = try {
            pendingCommands()
        } catch (_: Exception) {
            emptyList()
        }
        view.post {
            if (stopped) {
                return@post
            }
            for (command in commands) {
                view.applyRemote(command)
            }
            val focus = view.currentFocusKey()
            worker.post {
                if (stopped) {
                    return@post
                }
                try {
                    sendFocus(focus)
                } catch (_: Exception) {
                    // The next poll tries again. A missing server must not close the home screen.
                }
            }
        }
        worker.postDelayed({ tick() }, 700L)
    }

    private fun pendingCommands(): List<String> {
        val json = JSONObject(request("GET", null))
        val recent = json.optJSONArray("recent")
        val found = mutableListOf<Pair<Int, String>>()
        if (recent != null) {
            for (index in 0 until recent.length()) {
                val item = recent.optJSONObject(index) ?: continue
                val seq = item.optInt("seq", 0)
                val command = item.optString("command", "")
                if (seq > seen && command.isNotEmpty()) {
                    found += seq to command
                }
            }
        }
        val seq = json.optInt("seq", seen)
        if (found.isEmpty()) {
            if (seq > seen) {
                seen = seq
            }
            return emptyList()
        }
        found.sortBy { it.first }
        seen = found.maxOf { it.first }
        return found.map { it.second }
    }

    private fun sendFocus(focus: String?) {
        val payload = JSONObject()
        payload.put("role", "tv")
        payload.put("ackSeq", seen)
        if (focus == null) {
            payload.put("focusKey", JSONObject.NULL)
        } else {
            payload.put("focusKey", focus)
        }
        request("POST", payload.toString())
    }

    private fun request(method: String, body: String?): String {
        val connection = (URL("$baseUrl/api/kumanda").openConnection() as HttpURLConnection).apply {
            connectTimeout = 2000
            readTimeout = 2000
            requestMethod = method
            useCaches = false
            setRequestProperty("accept", "application/json")
            if (body != null) {
                doOutput = true
                setRequestProperty("content-type", "application/json")
            }
        }
        try {
            if (body != null) {
                connection.outputStream.use { stream ->
                    stream.write(body.toByteArray(Charsets.UTF_8))
                }
            }
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            if (code !in 200..299) {
                error("Kumanda sunucusu $code döndü.")
            }
            return text
        } finally {
            connection.disconnect()
        }
    }
}
