package dev.evekrani.a850c

import android.app.Activity
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController

class HomeActivity : Activity() {
    private lateinit var home: HomeView

    private companion object {
        const val REMOTE_EXTRA = "ev_remote_url"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        hideSystemUi()
        home = HomeView(this)
        setContentView(home)
        home.bindRemote(intent?.getStringExtra(REMOTE_EXTRA))
    }

    override fun onResume() {
        super.onResume()
        hideSystemUi()
        home.reload()
        home.requestFocus()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemUi()
            home.requestFocus()
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        home.bindRemote(intent.getStringExtra(REMOTE_EXTRA))
        home.reload()
        home.requestFocus()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN && home.onRemote(event)) {
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    @Deprecated("Launcher keeps the back key on this screen.")
    override fun onBackPressed() {
        home.handleBack()
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
