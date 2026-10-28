package dev.evekrani.a850c

import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import dev.evekrani.a850c.core.Box
import dev.evekrani.a850c.core.Oklch
import dev.evekrani.a850c.core.WallpaperPresetId
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.sin
import kotlin.random.Random

internal class WallpaperPainter {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val bitmapPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
    val grain: Bitmap = makeGrain()

    fun drawPreset(canvas: Canvas, preset: WallpaperPresetId, width: Float, height: Float) {
        when (preset) {
            WallpaperPresetId.SIYAH -> {
                drawLinear(
                    canvas,
                    width,
                    height,
                    180f,
                    intArrayOf(ok(0.17, 0.01, 260.0), ok(0.09, 0.006, 260.0)),
                    floatArrayOf(0f, 1f),
                )
                drawRadial(
                    canvas,
                    width,
                    height,
                    width * 0.80f,
                    height * -0.10f,
                    width * 0.90f,
                    height * 0.55f,
                    ok(0.28, 0.02, 260.0, 0.45),
                    0.55f,
                )
            }
            WallpaperPresetId.BAKIR_LAMBA -> {
                drawLinear(canvas, width, height, 165f, intArrayOf(ok(0.18, 0.02, 42.0), ok(0.1, 0.015, 32.0)), floatArrayOf(0f, 1f))
                drawRadial(canvas, width, height, width * 0.08f, 0f, width * 0.70f, height * 0.50f, ok(0.34, 0.05, 48.0))
                drawRadial(canvas, width, height, width * 0.86f, height * 1.10f, width * 0.90f, height * 0.70f, ok(0.58, 0.14, 55.0), 0.58f)
            }
            WallpaperPresetId.GECE_CAM -> {
                drawLinear(
                    canvas,
                    width,
                    height,
                    180f,
                    intArrayOf(ok(0.13, 0.012, 40.0), ok(0.16, 0.03, 50.0), ok(0.24, 0.05, 58.0)),
                    floatArrayOf(0f, 0.78f, 1f),
                )
                drawRadial(canvas, width, height, width * 0.5f, 0f, width * 0.80f, height * 0.45f, ok(0.3, 0.03, 55.0, 0.7), 0.60f)
            }
            WallpaperPresetId.SOMINE -> {
                drawLinear(canvas, width, height, 180f, intArrayOf(ok(0.11, 0.02, 30.0), ok(0.18, 0.04, 36.0)), floatArrayOf(0f, 1f))
                drawRadial(canvas, width, height, width * 0.5f, height * 1.20f, width * 0.80f, height * 0.60f, ok(0.52, 0.16, 42.0), 0.62f)
            }
            WallpaperPresetId.ZEYTIN_GECE -> {
                drawLinear(canvas, width, height, 205f, intArrayOf(ok(0.15, 0.02, 75.0), ok(0.11, 0.025, 55.0)), floatArrayOf(0f, 1f))
                drawRadial(canvas, width, height, 0f, height, width * 0.70f, height * 0.55f, ok(0.4, 0.06, 112.0), 0.58f)
            }
            WallpaperPresetId.KIS_AKSAMI -> {
                drawLinear(canvas, width, height, 150f, intArrayOf(ok(0.16, 0.02, 250.0), ok(0.12, 0.03, 42.0)), floatArrayOf(0f, 1f))
                drawRadial(canvas, width, height, width * 0.78f, height * 0.18f, width * 0.45f, height * 0.40f, ok(0.55, 0.08, 72.0, 0.55), 0.70f)
            }
            WallpaperPresetId.ISTANBUL_AKSAM,
            WallpaperPresetId.SONBAHAR_BAHCE -> {
                drawLinear(canvas, width, height, 180f, intArrayOf(ok(0.28, 0.08, 35.0), ok(0.16, 0.05, 145.0)), floatArrayOf(0f, 1f))
            }
        }
    }

    fun drawLamp(canvas: Canvas, width: Float, height: Float, alpha: Double) {
        if (alpha <= 0.01) {
            return
        }
        drawRadial(
            canvas,
            width,
            height,
            width * 0.72f,
            height * -0.08f,
            width * 0.75f,
            height * 0.48f,
            ok(0.95, 0.01, 260.0, alpha),
            0.68f,
        )
    }

    fun drawScrim(canvas: Canvas, width: Float, height: Float, strength: Float = 1f) {
        val scale = strength.coerceIn(0f, 1f).toDouble()
        drawLinear(
            canvas,
            width,
            height,
            180f,
            intArrayOf(
                ok(0.02, 0.005, 260.0, 0.25 * scale),
                ok(0.02, 0.005, 260.0, 0.0),
                ok(0.02, 0.005, 260.0, 0.4 * scale),
            ),
            floatArrayOf(0f, 0.32f, 1f),
        )
    }

    fun drawGrain(canvas: Canvas, width: Float, height: Float) {
        paint.shader = BitmapShader(grain, Shader.TileMode.REPEAT, Shader.TileMode.REPEAT)
        paint.style = Paint.Style.FILL
        canvas.drawRect(0f, 0f, width, height, paint)
        paint.shader = null
    }

    fun drawCover(canvas: Canvas, bitmap: Bitmap, width: Float, height: Float) {
        val scale = max(width / bitmap.width, height / bitmap.height)
        val drawnW = bitmap.width * scale
        val drawnH = bitmap.height * scale
        val left = (width - drawnW) / 2f
        val top = (height - drawnH) / 2f
        canvas.drawBitmap(bitmap, null, RectF(left, top, left + drawnW, top + drawnH), bitmapPaint)
    }

    private fun drawLinear(
        canvas: Canvas,
        width: Float,
        height: Float,
        cssDeg: Float,
        colors: IntArray,
        stops: FloatArray,
    ) {
        paint.shader = linearIn(Box(0f, 0f, width, height), cssDeg, colors, stops)
        paint.style = Paint.Style.FILL
        canvas.drawRect(0f, 0f, width, height, paint)
        paint.shader = null
    }

    private fun drawRadial(
        canvas: Canvas,
        width: Float,
        height: Float,
        cx: Float,
        cy: Float,
        rx: Float,
        ry: Float,
        color: Int,
        transparentAt: Float = 0.52f,
    ) {
        val radius = max(rx, ry).coerceAtLeast(1f)
        val shader = RadialGradient(
            cx,
            cy,
            radius,
            intArrayOf(color, color and 0x00FFFFFF),
            floatArrayOf(0f, transparentAt),
            Shader.TileMode.CLAMP,
        )
        val matrix = Matrix()
        matrix.setScale(rx / radius, ry / radius, cx, cy)
        shader.setLocalMatrix(matrix)
        paint.shader = shader
        paint.style = Paint.Style.FILL
        canvas.drawRect(0f, 0f, width, height, paint)
        paint.shader = null
    }

    private fun linearIn(box: Box, cssDeg: Float, colors: IntArray, stops: FloatArray): LinearGradient {
        val radians = Math.toRadians(cssDeg.toDouble())
        val dx = sin(radians).toFloat()
        val dy = (-cos(radians)).toFloat()
        val half = abs(dx) * box.width / 2f + abs(dy) * box.height / 2f
        val cx = box.left + box.width / 2f
        val cy = box.top + box.height / 2f
        return LinearGradient(
            cx - dx * half,
            cy - dy * half,
            cx + dx * half,
            cy + dy * half,
            colors,
            stops,
            Shader.TileMode.CLAMP,
        )
    }

    private fun ok(lightness: Double, chroma: Double, hue: Double, alpha: Double = 1.0): Int {
        return Oklch.argb(lightness, chroma, hue, alpha)
    }

    private fun makeGrain(): Bitmap {
        val size = 128
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val pixels = IntArray(size * size)
        val random = Random(7)
        for (index in pixels.indices) {
            val noise = random.nextInt(256)
            pixels[index] = (12 shl 24) or (noise shl 16) or (noise shl 8) or noise
        }
        bitmap.setPixels(pixels, 0, size, 0, 0, size, size)
        return bitmap
    }
}
