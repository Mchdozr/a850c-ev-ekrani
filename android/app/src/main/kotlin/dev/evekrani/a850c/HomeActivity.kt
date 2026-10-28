package dev.evekrani.a850c

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import dev.evekrani.a850c.remote.LocalRemoteServer
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference
import org.json.JSONObject

class HomeActivity : Activity() {
    private lateinit var home: HomeView
    private val main = Handler(Looper.getMainLooper())
    private val remoteState = AtomicReference("{\"homeActive\":false}")
    private var server: LocalRemoteServer? = null
    private var pairing: PairingDialog? = null
    private var lanAddress: String? = null
    private var resumed = false
    @Volatile private var destroyed = false
    private var wasConnected = false
    private var refreshCount = 0
    private val deviceName = Build.MODEL?.takeIf { it.isNotBlank() } ?: "Ev ekranı"

    private companion object {
        const val REMOTE_EXTRA = "ev_remote_url"
    }

    private val remoteTick = object : Runnable {
        override fun run() {
            if (destroyed) return
            if (refreshCount++ % 5 == 0) lanAddress = findLanAddress(this@HomeActivity)
            val connected = lanAddress != null && server?.isPhoneConnected() == true
            home.setPhoneConnection(lanAddress != null && server != null, connected)
            if (connected && !wasConnected) {
                pairing?.dismiss()
                if (resumed) home.requestFocus()
            }
            wasConnected = connected
            updateRemoteState()
            pairing?.takeIf { it.isShowing }?.update(remoteUrl(), deviceName, connected, server != null)
            main.postDelayed(this, 1000L)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        hideSystemUi()
        home = HomeView(this)
        home.onPairRequested = { showPairing() }
        setContentView(home)
        home.bindRemote(intent?.getStringExtra(REMOTE_EXTRA))
        startPhoneRemote()
        main.post(remoteTick)
    }

    override fun onResume() {
        super.onResume()
        resumed = true
        hideSystemUi()
        home.reload()
        home.requestFocus()
        lanAddress = findLanAddress(this)
        updateRemoteState()
    }

    override fun onPause() {
        resumed = false
        updateRemoteState()
        super.onPause()
    }

    override fun onDestroy() {
        destroyed = true
        main.removeCallbacksAndMessages(null)
        pairing?.dismiss()
        pairing = null
        server?.close()
        server = null
        super.onDestroy()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUi()
            if (pairing?.isShowing != true) home.requestFocus()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        home.bindRemote(intent.getStringExtra(REMOTE_EXTRA))
        home.reload()
        home.requestFocus()
        updateRemoteState()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN) {
            if (event.keyCode == KeyEvent.KEYCODE_MENU) {
                if (event.repeatCount == 0) showPairing()
                return true
            }
            if (home.onRemote(event)) return true
        }
        return super.dispatchKeyEvent(event)
    }

    @Deprecated("Launcher keeps the back key on this screen.")
    override fun onBackPressed() {
        home.handleBack()
    }

    private fun startPhoneRemote() {
        try {
            val html = assets.open("remote/index.html").bufferedReader().use { it.readText() }
            server = LocalRemoteServer(html, { command -> handlePhoneCommand(command) }, { remoteState.get() }).also { it.start() }
        } catch (_: Exception) {
            server?.close()
            server = null
        }
    }

    private fun showPairing() {
        lanAddress = findLanAddress(this)
        val dialog = pairing ?: PairingDialog(this).also { pairing = it }
        if (!dialog.isShowing) dialog.show()
        dialog.update(remoteUrl(), deviceName, server?.isPhoneConnected() == true, server != null)
    }

    private fun remoteUrl(): String? {
        val address = lanAddress ?: return null
        val endpoint = server ?: return null
        return "http://$address:${endpoint.port}${endpoint.path}"
    }

    private fun updateRemoteState() {
        remoteState.set(JSONObject().apply {
            put("homeActive", resumed)
            put("focus", home.currentFocusKey() ?: JSONObject.NULL)
            put("device", deviceName)
        }.toString())
    }

    private fun handlePhoneCommand(command: String): LocalRemoteServer.CommandResult {
        if (destroyed) return LocalRemoteServer.CommandResult(false, "Ev ekranı kapalı")
        val result = AtomicReference(LocalRemoteServer.CommandResult(false, "Ev ekranı yanıt vermedi"))
        val latch = CountDownLatch(1)
        val expired = AtomicBoolean(false)
        main.post {
            try {
                if (expired.get()) {
                    return@post
                } else if (destroyed) {
                    result.set(LocalRemoteServer.CommandResult(false, "Ev ekranı kapalı"))
                } else if (command == "home") {
                    pairing?.dismiss()
                    home.applyRemote("home")
                    if (!resumed) {
                        startActivity(Intent(this, HomeActivity::class.java).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                        })
                    }
                    result.set(LocalRemoteServer.CommandResult(true, "Ev ekranı açılıyor"))
                } else if (!resumed && command != "youtube" && command != "netflix") {
                    result.set(LocalRemoteServer.CommandResult(false, "Yön tuşları Ev ekranında çalışır. Önce Ev ekranına dön."))
                } else {
                    pairing?.dismiss()
                    if (command == "back") home.handleBack() else home.applyRemote(command)
                    val message = when (command) {
                        "youtube" -> "YouTube seçildi · yüklüyse açılır"
                        "netflix" -> "Netflix seçildi · yüklüyse açılır"
                        else -> ""
                    }
                    result.set(LocalRemoteServer.CommandResult(true, message))
                }
            } catch (_: RuntimeException) {
                result.set(LocalRemoteServer.CommandResult(false, "Komut uygulanamadı"))
            } finally {
                updateRemoteState()
                latch.countDown()
            }
        }
        try {
            if (!latch.await(1500L, TimeUnit.MILLISECONDS)) expired.set(true)
        } catch (_: InterruptedException) {
            expired.set(true)
            Thread.currentThread().interrupt()
        }
        return result.get()
    }

    private fun hideSystemUi() {
        if (Build.VERSION.SDK_INT >= 30) {
            val controller = window.insetsController ?: return
            controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
            controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
        }
    }
}
