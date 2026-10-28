package dev.evekrani.a850c

import android.app.Dialog
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel

internal class PairingDialog(context: Context) : Dialog(context) {
    private val title: TextView
    private val detail: TextView
    private val address: TextView
    private val qr: ImageView
    private val state: TextView
    private var bitmap: Bitmap? = null
    private var renderedUrl: String? = null

    init {
        requestWindowFeature(Window.FEATURE_NO_TITLE)
        val outer = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(36), dp(30), dp(36), dp(26))
            background = GradientDrawable(GradientDrawable.Orientation.TL_BR, intArrayOf(0xF02C3333.toInt(), 0xEE181D21.toInt())).apply {
                cornerRadius = dp(28).toFloat()
                setStroke(dp(1), 0x35FFFFFF)
            }
        }
        title = text("Telefonla bağlan", 26f, Color.WHITE).apply {
            typeface = Typeface.create("sans-serif", Typeface.NORMAL)
        }
        outer.addView(title)
        outer.addView(text("Ev ekranının kumandası, telefonunda.", 14f, 0xFFC4CCC6.toInt()).apply {
            setPadding(0, dp(8), 0, dp(22))
        })
        val row = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        qr = ImageView(context).apply {
            contentDescription = "Telefon kamerasıyla okutulacak yerel kumanda QR kodu"
            setPadding(dp(10), dp(10), dp(10), dp(10))
            background = GradientDrawable().apply { setColor(Color.WHITE); cornerRadius = dp(16).toFloat() }
        }
        row.addView(qr, LinearLayout.LayoutParams(dp(216), dp(216)))
        val copy = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(28), 0, 0, 0)
        }
        state = text("Yerel bağlantı hazırlanıyor", 16f, 0xFFD9E6CC.toInt())
        copy.addView(state)
        detail = text("", 14f, 0xFFC4CCC6.toInt()).apply { setPadding(0, dp(12), 0, dp(12)); setLineSpacing(dp(4).toFloat(), 1f) }
        copy.addView(detail)
        address = text("", 11f, 0xFFA1AFA8.toInt()).apply { setLineSpacing(dp(3).toFloat(), 1f) }
        copy.addView(address)
        row.addView(copy, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        outer.addView(row)
        outer.addView(text("Yön tuşları Ev ekranını yönetir. Uygulama açıldığında TV kumandanı kullan.", 12f, 0xFF9FAAA5.toInt()).apply {
            setPadding(0, dp(22), 0, dp(16))
            setLineSpacing(dp(3).toFloat(), 1f)
        })
        val close = Button(context).apply {
            this.text = "Tamam, kapat"
            isAllCaps = false
            textSize = 14f
            setTextColor(Color.WHITE)
            setPadding(dp(20), 0, dp(20), 0)
            background = GradientDrawable().apply {
                setColor(0x20FFFFFF)
                cornerRadius = dp(14).toFloat()
                setStroke(dp(1), 0x40FFFFFF)
            }
            setOnFocusChangeListener { view, focused -> view.alpha = if (focused) 1f else 0.7f }
            setOnClickListener { dismiss() }
        }
        outer.addView(close, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(46)).apply { gravity = Gravity.END })
        setContentView(outer)
        setOnShowListener {
            window?.apply {
                setBackgroundDrawableResource(android.R.color.transparent)
                addFlags(android.view.WindowManager.LayoutParams.FLAG_DIM_BEHIND)
                setDimAmount(0.35f)
                setLayout(minOf(dp(760), (context.resources.displayMetrics.widthPixels * 0.86f).toInt()), ViewGroup.LayoutParams.WRAP_CONTENT)
                decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            }
            close.requestFocus()
        }
        setOnDismissListener {
            qr.setImageDrawable(null)
            bitmap?.recycle()
            bitmap = null
            renderedUrl = null
        }
    }

    fun update(url: String?, device: String, connected: Boolean, serverAvailable: Boolean) {
        title.text = "Telefonla bağlan · $device"
        if (url == null) {
            state.text = if (serverAvailable) "Wi-Fi bağlantısı bekleniyor" else "Kumanda başlatılamadı"
            detail.text = if (serverAvailable) "TV’yi Wi-Fi veya yerel ağa bağla.\nTelefonun da aynı ağda olsun." else "Ev ekranını yeniden açıp tekrar dene."
            address.text = "İnternet gerekmez · misafir ağında cihaz erişimi kapalı olabilir"
            qr.visibility = View.GONE
            return
        }
        state.text = if (connected) "Telefon TV’ye bağlı" else "1. Aynı Wi-Fi ağına katıl"
        detail.text = "2. Telefon kamerasıyla QR kodu okut.\n3. Açılan yerel sayfada kumandayı kullan."
        address.text = url
        qr.visibility = View.VISIBLE
        if (url != renderedUrl || bitmap == null) {
            val matrix = QRCodeWriter().encode(url, BarcodeFormat.QR_CODE, 420, 420, mapOf(
                EncodeHintType.MARGIN to 3,
                EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M,
            ))
            val pixels = IntArray(matrix.width * matrix.height) { index ->
                if (matrix[index % matrix.width, index / matrix.width]) Color.BLACK else Color.WHITE
            }
            qr.setImageDrawable(null)
            bitmap?.recycle()
            bitmap = Bitmap.createBitmap(pixels, matrix.width, matrix.height, Bitmap.Config.RGB_565)
            qr.setImageBitmap(bitmap)
            renderedUrl = url
        }
    }

    private fun text(value: String, size: Float, color: Int) = TextView(context).apply {
        text = value
        textSize = size
        setTextColor(color)
        typeface = Typeface.create("sans-serif", Typeface.NORMAL)
    }

    private fun dp(value: Int) = (value * context.resources.displayMetrics.density).toInt()
}
