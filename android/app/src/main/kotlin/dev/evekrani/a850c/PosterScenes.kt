package dev.evekrani.a850c

import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import dev.evekrani.a850c.core.Box
import dev.evekrani.a850c.core.Oklch

internal object PosterScenes {
    fun draw(canvas: Canvas, box: Box, cardId: String, paint: Paint) {
        val scene = sceneOf(cardId)
        drawWash(canvas, box, scene, cardId, paint)
        when (scene) {
            Scene.BOGAZ -> bogaz(canvas, box, paint)
            Scene.MAHALLE -> mahalle(canvas, box, paint)
            Scene.MUTFAK -> mutfak(canvas, box, paint)
            Scene.ANADOLU -> anadolu(canvas, box, paint)
            Scene.COCUK -> cocuk(canvas, box, paint)
            Scene.KONSER -> konser(canvas, box, paint)
            Scene.MOTIF -> motif(canvas, box, cardId, paint)
        }
        paint.shader = null
        paint.style = Paint.Style.FILL
        paint.strokeWidth = 0f
    }

    private enum class Scene {
        BOGAZ,
        MAHALLE,
        MUTFAK,
        ANADOLU,
        COCUK,
        KONSER,
        MOTIF,
    }

    private fun sceneOf(cardId: String): Scene {
        val id = cardId.lowercase()
        return when {
            "bogaz" in id || "boğaz" in id -> Scene.BOGAZ
            "mahalle" in id -> Scene.MAHALLE
            "mutfak" in id -> Scene.MUTFAK
            "anadolu" in id -> Scene.ANADOLU
            "cocuk" in id || "çocuk" in id -> Scene.COCUK
            "konser" in id -> Scene.KONSER
            else -> Scene.MOTIF
        }
    }

    private fun drawWash(canvas: Canvas, box: Box, scene: Scene, cardId: String, paint: Paint) {
        val (start, end) = when (scene) {
            Scene.BOGAZ -> 0xFF071422.toInt() to 0xFF1A4E86.toInt()
            Scene.MAHALLE -> 0xFF5A3828.toInt() to 0xFF1C100C.toInt()
            Scene.MUTFAK -> 0xFF12352C.toInt() to 0xFF071612.toInt()
            Scene.ANADOLU -> 0xFF24365C.toInt() to 0xFFC46A3A.toInt()
            Scene.COCUK -> 0xFF3C2A68.toInt() to 0xFFC9A6DE.toInt()
            Scene.KONSER -> 0xFF140814.toInt() to 0xFF3A1248.toInt()
            Scene.MOTIF -> {
                val hue = (hash(cardId) % 360).toDouble()
                Oklch.argb(0.28, 0.08, hue) to Oklch.argb(0.14, 0.05, (hue + 24.0) % 360.0)
            }
        }
        paint.style = Paint.Style.FILL
        paint.shader = LinearGradient(
            box.left,
            box.top,
            box.right,
            box.bottom,
            start,
            end,
            Shader.TileMode.CLAMP,
        )
        canvas.drawRect(box.left, box.top, box.right, box.bottom, paint)
        paint.shader = null
    }

    private fun bogaz(canvas: Canvas, box: Box, paint: Paint) {
        val w = box.width
        val h = box.height
        paint.color = 0xFFF4E4BC.toInt()
        canvas.drawCircle(box.left + w * 0.78f, box.top + h * 0.2f, w * 0.05f, paint)
        paint.color = 0xFF08283F.toInt()
        canvas.drawRect(box.left, box.top + h * 0.64f, box.right, box.bottom, paint)
        paint.color = 0xFFE4EAF1.toInt()
        canvas.drawRect(box.left + w * 0.27f, box.top + h * 0.28f, box.left + w * 0.295f, box.top + h * 0.68f, paint)
        canvas.drawRect(box.left + w * 0.67f, box.top + h * 0.28f, box.left + w * 0.695f, box.top + h * 0.68f, paint)
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = (w * 0.008f).coerceAtLeast(1.5f)
        paint.color = 0xFFF7F8FA.toInt()
        val cable = Path()
        cable.moveTo(box.left + w * 0.28f, box.top + h * 0.35f)
        cable.quadTo(box.left + w * 0.48f, box.top + h * 0.62f, box.left + w * 0.68f, box.top + h * 0.35f)
        canvas.drawPath(cable, paint)
        paint.style = Paint.Style.FILL
        paint.color = 0xFFFFD36A.toInt()
        for (index in 0..7) {
            val t = index / 7f
            val x = box.left + w * (0.30f + 0.36f * t)
            val y = box.top + h * (0.36f + 0.22f * 4f * t * (1f - t))
            canvas.drawCircle(x, y, w * 0.008f, paint)
        }
    }

    private fun mahalle(canvas: Canvas, box: Box, paint: Paint) {
        val w = box.width
        val h = box.height
        paint.color = 0xFF16324C.toInt()
        canvas.drawRoundRect(
            RectF(box.left + w * 0.62f, box.top + h * 0.14f, box.left + w * 0.86f, box.top + h * 0.46f),
            w * 0.012f,
            w * 0.012f,
            paint,
        )
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = (w * 0.008f).coerceAtLeast(1.4f)
        paint.color = 0xFFD7C4A4.toInt()
        canvas.drawLine(box.left + w * 0.74f, box.top + h * 0.14f, box.left + w * 0.74f, box.top + h * 0.46f, paint)
        canvas.drawLine(box.left + w * 0.62f, box.top + h * 0.3f, box.left + w * 0.86f, box.top + h * 0.3f, paint)
        paint.style = Paint.Style.FILL
        paint.color = 0xFFF3E6D4.toInt()
        canvas.drawRoundRect(
            RectF(box.left + w * 0.28f, box.top + h * 0.46f, box.left + w * 0.42f, box.top + h * 0.64f),
            w * 0.015f,
            w * 0.015f,
            paint,
        )
        paint.color = 0xFFFFF8EE.toInt()
        canvas.drawOval(
            RectF(box.left + w * 0.28f, box.top + h * 0.42f, box.left + w * 0.42f, box.top + h * 0.5f),
            paint,
        )
    }

    private fun mutfak(canvas: Canvas, box: Box, paint: Paint) {
        val w = box.width
        val h = box.height
        paint.color = 0xFFF0B45A.toInt()
        canvas.drawCircle(box.left + w * 0.18f, box.top + h * 0.22f, w * 0.055f, paint)
        paint.color = 0xFF1A2E28.toInt()
        canvas.drawRect(box.left, box.top + h * 0.62f, box.right, box.bottom, paint)
        paint.color = 0xFFC4A574.toInt()
        canvas.drawRoundRect(
            RectF(box.left + w * 0.1f, box.top + h * 0.52f, box.left + w * 0.32f, box.top + h * 0.66f),
            w * 0.012f,
            w * 0.012f,
            paint,
        )
        paint.color = 0xFFD7DEE4.toInt()
        canvas.drawRoundRect(
            RectF(box.left + w * 0.5f, box.top + h * 0.42f, box.left + w * 0.7f, box.top + h * 0.6f),
            w * 0.02f,
            w * 0.02f,
            paint,
        )
        paint.color = 0xFFF4F7F8.toInt()
        canvas.drawRoundRect(
            RectF(box.left + w * 0.54f, box.top + h * 0.36f, box.left + w * 0.66f, box.top + h * 0.44f),
            w * 0.012f,
            w * 0.012f,
            paint,
        )
    }

    private fun anadolu(canvas: Canvas, box: Box, paint: Paint) {
        val w = box.width
        val h = box.height
        paint.color = 0xFFFFD7A1.toInt()
        canvas.drawCircle(box.left + w * 0.76f, box.top + h * 0.26f, w * 0.055f, paint)
        paint.color = 0xFF1C3A28.toInt()
        val far = Path()
        far.moveTo(box.left, box.top + h * 0.62f)
        far.quadTo(box.left + w * 0.4f, box.top + h * 0.42f, box.right, box.top + h * 0.5f)
        far.lineTo(box.right, box.bottom)
        far.lineTo(box.left, box.bottom)
        far.close()
        canvas.drawPath(far, paint)
        paint.color = 0xFFE7D3B4.toInt()
        val road = Path()
        road.moveTo(box.left + w * 0.42f, box.bottom)
        road.lineTo(box.left + w * 0.48f, box.top + h * 0.52f)
        road.lineTo(box.left + w * 0.54f, box.top + h * 0.52f)
        road.lineTo(box.left + w * 0.62f, box.bottom)
        road.close()
        canvas.drawPath(road, paint)
    }

    private fun cocuk(canvas: Canvas, box: Box, paint: Paint) {
        val w = box.width
        val h = box.height
        paint.color = 0xFFF7F1E6.toInt()
        canvas.drawRect(box.left + w * 0.24f, box.top + h * 0.42f, box.left + w * 0.5f, box.top + h * 0.74f, paint)
        paint.color = 0xFFF2D7A2.toInt()
        val roof = Path()
        roof.moveTo(box.left + w * 0.2f, box.top + h * 0.42f)
        roof.lineTo(box.left + w * 0.37f, box.top + h * 0.22f)
        roof.lineTo(box.left + w * 0.54f, box.top + h * 0.42f)
        roof.close()
        canvas.drawPath(roof, paint)
        paint.color = 0xFF8C5A3C.toInt()
        canvas.drawRect(box.left + w * 0.33f, box.top + h * 0.54f, box.left + w * 0.41f, box.top + h * 0.74f, paint)
        paint.color = 0xFFFFE08A.toInt()
        canvas.drawCircle(box.left + w * 0.74f, box.top + h * 0.28f, w * 0.04f, paint)
    }

    private fun konser(canvas: Canvas, box: Box, paint: Paint) {
        val w = box.width
        val h = box.height
        paint.color = 0xFF241018.toInt()
        val stage = Path()
        stage.moveTo(box.left + w * 0.12f, box.bottom)
        stage.lineTo(box.left + w * 0.32f, box.top + h * 0.42f)
        stage.lineTo(box.left + w * 0.68f, box.top + h * 0.42f)
        stage.lineTo(box.left + w * 0.88f, box.bottom)
        stage.close()
        canvas.drawPath(stage, paint)
        paint.color = 0xB8FF4D6D.toInt()
        cone(canvas, box, paint, 0.22f, 0.34f)
        paint.color = 0xB8F2C14E.toInt()
        cone(canvas, box, paint, 0.46f, 0.58f)
        paint.color = 0xB87AA2FF.toInt()
        cone(canvas, box, paint, 0.7f, 0.82f)
        paint.color = 0xFFF7F4EF.toInt()
        canvas.drawCircle(box.left + w * 0.5f, box.top + h * 0.62f, w * 0.04f, paint)
    }

    private fun cone(canvas: Canvas, box: Box, paint: Paint, left: Float, right: Float) {
        val path = Path()
        path.moveTo(box.left + box.width * ((left + right) / 2f), box.top)
        path.lineTo(box.left + box.width * right, box.top + box.height * 0.7f)
        path.lineTo(box.left + box.width * left, box.top + box.height * 0.7f)
        path.close()
        canvas.drawPath(path, paint)
    }

    private fun motif(canvas: Canvas, box: Box, cardId: String, paint: Paint) {
        val hue = (hash(cardId) % 360).toDouble()
        paint.color = Oklch.argb(0.78, 0.12, hue)
        canvas.drawCircle(box.left + box.width * 0.72f, box.top + box.height * 0.34f, box.width * 0.11f, paint)
        paint.color = Oklch.argb(0.92, 0.04, (hue + 40.0) % 360.0)
        canvas.drawRoundRect(
            RectF(
                box.left + box.width * 0.1f,
                box.top + box.height * 0.2f,
                box.left + box.width * 0.4f,
                box.top + box.height * 0.52f,
            ),
            box.width * 0.03f,
            box.width * 0.03f,
            paint,
        )
    }

    private fun hash(id: String): Long {
        var value = 0L
        for (char in id) {
            value = (value * 31 + char.code.toLong()) and 0xFFFF_FFFFL
        }
        return value
    }
}
