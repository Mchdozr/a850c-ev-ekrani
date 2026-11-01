package dev.evekrani.a850c

import android.view.ViewGroup
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class HomeActivityTest {
    @Test
    fun coldStartInstallsHomeViewOnAndroid14() {
        // Accessing PhoneWindow.insetsController before installing the decor
        // crashes on the TV, before HomeView can become the activity's content.
        val controller = Robolectric.buildActivity(HomeActivity::class.java)
        try {
            val activity = controller.create().get()
            val content = activity.findViewById<ViewGroup>(android.R.id.content)
            assertTrue(content.getChildAt(0) is HomeView)
        } finally {
            controller.destroy()
        }
    }
}
