package dev.evekrani.a850c

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.SystemClock
import android.util.Base64
import android.view.KeyEvent
import android.view.View
import dev.evekrani.a850c.core.AppMark
import dev.evekrani.a850c.core.AppColorId
import dev.evekrani.a850c.core.Box
import dev.evekrani.a850c.core.Direction
import dev.evekrani.a850c.core.DockApp
import dev.evekrani.a850c.core.DrawOp
import dev.evekrani.a850c.core.FocusTarget
import dev.evekrani.a850c.core.FontStyle
import dev.evekrani.a850c.core.FontRole
import dev.evekrani.a850c.core.HomeDesign
import dev.evekrani.a850c.core.LabelMode
import dev.evekrani.a850c.core.LayoutId
import dev.evekrani.a850c.core.LogoColor
import dev.evekrani.a850c.core.TileStyle
import dev.evekrani.a850c.core.Palette
import dev.evekrani.a850c.core.appMark
import dev.evekrani.a850c.core.focusKeyForMark
import dev.evekrani.a850c.core.parseFocusKey
import dev.evekrani.a850c.core.Scene
import dev.evekrani.a850c.core.TextAlign
import dev.evekrani.a850c.core.TextMetrics
import dev.evekrani.a850c.core.TextMeasurer
import dev.evekrani.a850c.core.Wallpaper
import dev.evekrani.a850c.core.WallpaperPresetId
import dev.evekrani.a850c.core.buildFocusMap
import dev.evekrani.a850c.core.createDefaultDesign
import dev.evekrani.a850c.core.cqw
import dev.evekrani.a850c.core.ellipsize
import dev.evekrani.a850c.core.firstFocusKey
import dev.evekrani.a850c.core.focusMapHas
import dev.evekrani.a850c.core.focusTitle
import dev.evekrani.a850c.core.formatIstanbulDate
import dev.evekrani.a850c.core.formatIstanbulTime
import dev.evekrani.a850c.core.layoutScene
import dev.evekrani.a850c.core.moveFocus
import dev.evekrani.a850c.core.mergeAppCatalog
import dev.evekrani.a850c.core.parseDesign
import dev.evekrani.a850c.core.serializeDesign
import dev.evekrani.a850c.core.selectionCaption
import dev.evekrani.a850c.core.wrapText
import java.util.concurrent.Executors
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.abs
import kotlin.math.sin

class HomeView(context: Context) : View(context) {
    private val wallpaperPainter = WallpaperPainter()
    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val bitmapPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
    private val displayPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        isSubpixelText = true
        typeface = Typeface.SANS_SERIF
    }
    private val bodyPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        isSubpixelText = true
        typeface = Typeface.SANS_SERIF
    }
    private val measurer = TextMeasurer { text, size, role, trackingEm ->
        val paint = paintFor(role)
        paint.textSize = size
        paint.letterSpacing = trackingEm
        paint.fontFeatureSettings = "tnum"
        val metrics = paint.fontMetrics
        TextMetrics(paint.measureText(text), -metrics.ascent, metrics.descent)
    }
    private val decodeExecutor = Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "evekrani-wallpaper").apply { isDaemon = true }
    }

    private var design: HomeDesign = createDefaultDesign()
    private var notice: String? = null
    private var fingerprint: String = ""
    private var focusKey: String? = null
    private var overlay: Overlay? = null
    private var timeText: String = "--:--"
    private var dateText: String = "İstanbul"
    private var cachedScene: Scene? = null
    private var cacheStamp: Stamp? = null
    private var wallpaperBitmap: Bitmap? = null
    private var wallpaperKey: String? = null
    private var decodeGeneration = 0
    private val vectors = HashMap<String, Drawable>()
    private var presetBitmap: Bitmap? = null
    private var presetBitmapPath: String? = null
    private var glassBitmap: Bitmap? = null
    private var glassSource: Bitmap? = null
    private var backdropWidth = 1f
    private var backdropHeight = 1f
    private var appliedFont: FontStyle? = null
    private val launcherIcons = mutableMapOf<AppMark, Bitmap>()
    private var remoteBase: String? = null
    private var remoteClient: RemoteClient? = null
    private val preferences = context.getSharedPreferences("home-design", Context.MODE_PRIVATE)
    private var appCatalog = emptyList<DockApp>()
    private var settingsOpen = false
    private var settingsIndex = 0
    private var phoneAvailable = false
    private var phoneConnected = false
    internal var onPairRequested: (() -> Unit)? = null
    internal var onDesignChanged: ((HomeDesign) -> Unit)? = null

    private val clockTick = object : Runnable {
        override fun run() {
            val now = System.currentTimeMillis()
            val nextTime = formatIstanbulTime(now)
            val nextDate = formatIstanbulDate(now)
            if (nextTime != timeText || nextDate != dateText) {
                timeText = nextTime
                dateText = nextDate
                invalidate()
            }
            val delay = (1000L - (now % 1000L)).coerceAtLeast(200L)
            postDelayed(this, delay)
        }
    }
    private val lampTick = object : Runnable {
        override fun run() {
            if (isHardwareAccelerated) {
                invalidate()
            }
            postDelayed(this, 200L)
        }
    }

    init {
        isFocusable = true
        isFocusableInTouchMode = true
        if (Build.VERSION.SDK_INT >= 26) {
            defaultFocusHighlightEnabled = false
        }
        setBackgroundColor(Palette.background)
        contentDescription = "Ev ekranı"
        displayPaint.typeface = loadFont(context, "fonts/Inter.ttf", "'wght' 300")
            ?: Typeface.SANS_SERIF
        bodyPaint.typeface = loadFont(context, "fonts/Inter.ttf", "'wght' 500")
            ?: Typeface.SANS_SERIF
        val now = System.currentTimeMillis()
        timeText = formatIstanbulTime(now)
        dateText = formatIstanbulDate(now)
        apply(DesignFiles.load(context))
    }

    fun reload() {
        apply(DesignFiles.load(context))
    }

    fun onRemote(event: KeyEvent): Boolean {
        if (event.action != KeyEvent.ACTION_DOWN) {
            return false
        }
        if (event.keyCode == KeyEvent.KEYCODE_MENU) {
            if (event.repeatCount == 0) onPairRequested?.invoke()
            return true
        }
        if (event.keyCode == KeyEvent.KEYCODE_SETTINGS) {
            settingsOpen = true
            settingsIndex = 0
            invalidate()
            return true
        }
        if (settingsOpen) {
            return handleSettingsKey(event.keyCode, event.repeatCount)
        }
        val overlayOpen = overlay
        if (overlayOpen != null) {
            return when (event.keyCode) {
                KeyEvent.KEYCODE_DPAD_CENTER,
                KeyEvent.KEYCODE_ENTER,
                KeyEvent.KEYCODE_NUMPAD_ENTER,
                KeyEvent.KEYCODE_BUTTON_A,
                -> {
                    if (event.repeatCount == 0) {
                        overlay = null
                        invalidate()
                    }
                    true
                }
                KeyEvent.KEYCODE_DPAD_LEFT,
                KeyEvent.KEYCODE_DPAD_RIGHT,
                KeyEvent.KEYCODE_DPAD_UP,
                KeyEvent.KEYCODE_DPAD_DOWN,
                -> true
                else -> false
            }
        }
        val direction = when (event.keyCode) {
            KeyEvent.KEYCODE_DPAD_LEFT -> Direction.LEFT
            KeyEvent.KEYCODE_DPAD_RIGHT -> Direction.RIGHT
            KeyEvent.KEYCODE_DPAD_UP -> Direction.UP
            KeyEvent.KEYCODE_DPAD_DOWN -> Direction.DOWN
            else -> null
        }
        if (direction != null) {
            nudge(direction)
            return true
        }
        if (
            event.keyCode == KeyEvent.KEYCODE_DPAD_CENTER ||
            event.keyCode == KeyEvent.KEYCODE_ENTER ||
            event.keyCode == KeyEvent.KEYCODE_NUMPAD_ENTER ||
            event.keyCode == KeyEvent.KEYCODE_BUTTON_A
        ) {
            if (event.repeatCount == 0) {
                showSelection()
            }
            return true
        }
        return false
    }

    fun handleBack(): Boolean {
        if (settingsOpen) {
            settingsOpen = false
            invalidate()
            return true
        }
        if (overlay != null) {
            overlay = null
            invalidate()
            return true
        }
        if (notice != null) {
            notice = null
            invalidate()
            return true
        }
        return true
    }

    internal fun bindRemote(explicit: String?) {
        val next = resolveRemoteBase(explicit)
        if (next == remoteBase && (next == null || remoteClient != null)) {
            return
        }
        remoteBase = next
        remoteClient?.stop()
        remoteClient = null
        if (next != null && isAttachedToWindow) {
            remoteClient = RemoteClient(next, this).also { it.start() }
        }
    }

    internal fun applyRemote(command: String) {
        if (command == "home") {
            settingsOpen = false
            overlay = null
            focusKey = if (design.layout == LayoutId.SAAT) null else firstFocusKey(buildFocusMap(design))
            invalidate()
            return
        }
        if (command == "back") {
            handleBack()
            return
        }
        if (command == "youtube" || command == "netflix") {
            settingsOpen = false
            overlay = null
            val mark = if (command == "youtube") AppMark.YOUTUBE else AppMark.NETFLIX
            jumpTo(mark)
            if (!launchMark(mark)) {
                overlay = Overlay(if (mark == AppMark.YOUTUBE) "YouTube" else "Netflix",
                    "Bu uygulama bu televizyonda yüklü değil.")
                invalidate()
            }
            return
        }
        if (settingsOpen) {
            val code = when (command) {
                "left" -> KeyEvent.KEYCODE_DPAD_LEFT
                "right" -> KeyEvent.KEYCODE_DPAD_RIGHT
                "up" -> KeyEvent.KEYCODE_DPAD_UP
                "down" -> KeyEvent.KEYCODE_DPAD_DOWN
                "enter" -> KeyEvent.KEYCODE_DPAD_CENTER
                else -> return
            }
            handleSettingsKey(code, 0)
            return
        }
        if (overlay != null && command != "enter") {
            return
        }
        when (command) {
            "left" -> nudge(Direction.LEFT)
            "right" -> nudge(Direction.RIGHT)
            "up" -> nudge(Direction.UP)
            "down" -> nudge(Direction.DOWN)
            "enter" -> {
                if (overlay != null) {
                    overlay = null
                    invalidate()
                } else {
                    showSelection()
                }
            }
            "youtube" -> jumpTo(AppMark.YOUTUBE)
            "netflix" -> jumpTo(AppMark.NETFLIX)
            else -> Unit
        }
    }

    internal fun currentFocusKey(): String? = focusKey

    internal fun currentDesign(): HomeDesign = design

    internal fun setPhoneConnection(available: Boolean, connected: Boolean) {
        phoneAvailable = available
        phoneConnected = connected
        invalidate()
    }

    internal fun applyEditedDesign(next: HomeDesign) {
        val keepSettingsOpen = settingsOpen
        val sourceFingerprint = fingerprint
        appCatalog = mergeAppCatalog(next.apps, appCatalog)
        val catalog = JSONArray().apply {
            appCatalog.forEach { app -> put(JSONObject().apply {
                put("id", app.id)
                put("name", app.name)
                put("colorId", app.colorId.wire)
            }) }
        }
        preferences.edit().putString("source", sourceFingerprint)
            .putString("design", serializeDesign(next)).putString("catalog", catalog.toString()).apply()
        apply(LoadedDesign(next, null, sourceFingerprint), useSaved = false)
        settingsOpen = keepSettingsOpen
        onDesignChanged?.invoke(next)
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        removeCallbacks(clockTick)
        removeCallbacks(lampTick)
        post(clockTick)
        post(lampTick)
        val base = remoteBase
        if (base != null && remoteClient == null) {
            remoteClient = RemoteClient(base, this).also { it.start() }
        }
    }

    override fun onDetachedFromWindow() {
        remoteClient?.stop()
        remoteClient = null
        removeCallbacks(clockTick)
        removeCallbacks(lampTick)
        super.onDetachedFromWindow()
    }

    override fun onDraw(canvas: Canvas) {
        val frame = contentFrame(width.toFloat(), height.toFloat())
        canvas.drawColor(Palette.background)
        val save = canvas.save()
        canvas.translate(frame.left, frame.top)
        canvas.clipRect(0f, 0f, frame.width, frame.height)
        drawBackdrop(canvas, frame.width, frame.height)
        val scene = scene(frame.width, frame.height)
        drawOps(canvas, scene.ops, scene)
        drawFocus(canvas, scene, frame.width)
        if (design.layout != LayoutId.SINEMA) {
            val size = cqw(frame.width, 1.25f)
            val metrics = measurer.measure("Tamam: Aç · Yön tuşları: Gezin", size, FontRole.BODY, 0f)
            drawText(canvas, DrawOp.Text("Tamam: Aç · Yön tuşları: Gezin", frame.width * 0.05f,
                frame.height * 0.978f - metrics.descent, size, 0xFFC5CED8.toInt(), FontRole.BODY, TextAlign.LEFT, 0f))
        }
        drawNotice(canvas, frame.width, frame.height)
        drawOverlay(canvas, frame.width, frame.height)
        drawSettings(canvas, frame.width, frame.height)
        canvas.restoreToCount(save)
    }

    private fun apply(source: LoadedDesign, useSaved: Boolean = true) {
        val saved = if (useSaved && preferences.getString("source", null) == source.fingerprint) {
            preferences.getString("design", null)?.let { runCatching { parseDesign(it) }.getOrNull() }
        } else null
        val loaded = if (saved != null) source.copy(design = saved) else source
        val remembered = if (preferences.getString("source", null) == source.fingerprint) readAppCatalog() else emptyList()
        appCatalog = mergeAppCatalog(loaded.design.apps, remembered + source.design.apps)
        applyFont(loaded.design.fontStyle)
        val iconsChanged = if (useSaved) refreshLauncherIcons() else false
        if (loaded.fingerprint == fingerprint && loaded.notice == notice && loaded.design == design) {
            if (iconsChanged) {
                invalidate()
            }
            return
        }
        val previous = design
        val previousKey = focusKey
        design = loaded.design
        notice = loaded.notice
        fingerprint = loaded.fingerprint
        val map = buildFocusMap(design)
        focusKey = if (design.layout == LayoutId.SAAT && (previous.layout != LayoutId.SAAT || previousKey == null)) {
            null
        } else if (previousKey != null && focusMapHas(map, previousKey)) {
            previousKey
        } else {
            firstFocusKey(map)
        }
        if (loaded.design != previous) {
            overlay = null
            if (loaded.design.wallpaper !is Wallpaper.Image) {
                decodeGeneration += 1
                wallpaperBitmap?.recycle()
                wallpaperBitmap = null
                wallpaperKey = null
            }
        }
        cachedScene = null
        invalidate()
    }

    private fun showSelection() {
        val key = focusKey ?: return
        val target = parseFocusKey(key) as? FocusTarget.App
        if (target != null && design.apps.firstOrNull { it.id == target.appId }?.let(::appMark) == AppMark.AYARLAR) {
            settingsOpen = true
            settingsIndex = 0
            invalidate()
            return
        }
        if (launchInstalled(key)) {
            return
        }
        overlay = Overlay(focusTitle(design, key), if (target != null) {
            "Bu uygulama bu televizyonda yüklü değil."
        } else selectionCaption(key))
        invalidate()
    }

    private fun nudge(direction: Direction) {
        val map = buildFocusMap(design)
        val next = moveFocus(map, focusKey, direction)
        if (next != null && next != focusKey) {
            focusKey = next
            invalidate()
        }
    }

    private fun jumpTo(mark: AppMark) {
        val next = focusKeyForMark(design, mark) ?: return
        if (next != focusKey) {
            focusKey = next
            invalidate()
        }
    }

    private fun launchInstalled(key: String): Boolean {
        val target = parseFocusKey(key) as? FocusTarget.App ?: return false
        val app = design.apps.firstOrNull { it.id == target.appId } ?: return false
        return launchMark(appMark(app))
    }

    private fun launchMark(mark: AppMark): Boolean {
        val packages = PACKAGES[mark] ?: return false
        val manager = context.packageManager
        for (name in packages) {
            val intent = try {
                manager.getLeanbackLaunchIntentForPackage(name)
                    ?: manager.getLaunchIntentForPackage(name)
            } catch (_: Exception) {
                null
            } ?: continue
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            try {
                context.startActivity(intent)
                return true
            } catch (_: ActivityNotFoundException) {
                continue
            } catch (_: SecurityException) {
                continue
            }
        }
        return false
    }

    private fun refreshLauncherIcons(): Boolean {
        var changed = false
        for ((kind, packages) in PACKAGES) {
            val next = loadLauncherBitmap(packages)
            val current = launcherIcons[kind]
            if ((current != null) != (next != null)) {
                changed = true
            }
            val swapped = swapIcon(current, next)
            if (swapped == null) {
                launcherIcons.remove(kind)
            } else {
                launcherIcons[kind] = swapped
            }
        }
        return changed
    }

    private fun swapIcon(current: Bitmap?, next: Bitmap?): Bitmap? {
        if (current != null && current !== next) {
            current.recycle()
        }
        return next
    }

    private fun loadLauncherBitmap(packages: List<String>): Bitmap? {
        val manager = context.packageManager
        for (name in packages) {
            try {
                val info = manager.getApplicationInfo(name, 0)
                val drawable = manager.getApplicationIcon(info)
                return raster(drawable)
            } catch (_: PackageManager.NameNotFoundException) {
                continue
            } catch (_: Exception) {
                continue
            }
        }
        return null
    }

    private fun raster(drawable: Drawable): Bitmap {
        val size = 192
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, size, size)
        drawable.draw(canvas)
        return bitmap
    }

    private fun markDrawable(kind: AppMark, glyphOnly: Boolean): Drawable? {
        if (kind == AppMark.LETTER) {
            return null
        }
        val cacheKey = "${kind.name}:$glyphOnly"
        val cached = vectors[cacheKey]
        if (cached != null) {
            return cached
        }
        val resId = if (glyphOnly) {
            when (kind) {
                AppMark.YOUTUBE -> R.drawable.mark_youtube_glyph
                AppMark.NETFLIX -> R.drawable.mark_netflix_glyph
                AppMark.DISNEY -> R.drawable.mark_disney_glyph
                AppMark.BLUTV -> R.drawable.mark_blutv_glyph
                AppMark.TABII -> R.drawable.mark_tabii_glyph
                AppMark.AYARLAR -> R.drawable.mark_ayarlar_glyph
                AppMark.LETTER -> return null
            }
        } else {
            when (kind) {
                AppMark.YOUTUBE -> R.drawable.mark_youtube
                AppMark.NETFLIX -> R.drawable.mark_netflix
                AppMark.DISNEY -> R.drawable.mark_disney
                AppMark.BLUTV -> R.drawable.mark_blutv
                AppMark.TABII -> R.drawable.mark_tabii
                AppMark.AYARLAR -> R.drawable.mark_ayarlar
                AppMark.LETTER -> return null
            }
        }
        val drawable = try {
            resources.getDrawable(resId, context.theme)?.mutate()
        } catch (_: Exception) {
            null
        } ?: return null
        vectors[cacheKey] = drawable
        return drawable
    }

    private fun applyFont(style: FontStyle) {
        if (style == appliedFont) {
            return
        }
        appliedFont = style
        val file = if (style == FontStyle.YUMUSAK) "fonts/NunitoSans.ttf" else "fonts/Inter.ttf"
        val displayVariation = "'wght' 300"
        val bodyVariation = "'wght' 500"
        displayPaint.typeface = loadFont(context, file, displayVariation) ?: Typeface.SANS_SERIF
        bodyPaint.typeface = loadFont(context, file, bodyVariation) ?: Typeface.SANS_SERIF
    }

    private fun presetBitmap(preset: WallpaperPresetId): Bitmap? {
        val path = "wallpapers/${preset.wire}.jpg"
        val cached = presetBitmap
        if (presetBitmapPath == path && cached != null && !cached.isRecycled) {
            return cached
        }
        presetBitmapPath = path
        presetBitmap = null
        cached?.recycle()
        return try {
            context.assets.open(path).use { stream ->
                BitmapFactory.decodeStream(stream)
            }?.also { presetBitmap = it }
        } catch (_: Exception) {
            null
        }
    }

    private fun scene(width: Float, height: Float): Scene {
        val stamp = Stamp(width, height, design, timeText, dateText, focusKey)
        val cached = cachedScene
        if (cached != null && cacheStamp == stamp) {
            return cached
        }
        val laid = layoutScene(design, width, height, timeText, dateText, focusKey, measurer)
        cachedScene = laid
        cacheStamp = stamp
        return laid
    }

    private fun drawBackdrop(canvas: Canvas, width: Float, height: Float) {
        backdropWidth = width
        backdropHeight = height
        when (val paper = design.wallpaper) {
            is Wallpaper.Preset -> {
                val photo = presetBitmap(paper.presetId)
                if (photo != null) {
                    wallpaperPainter.drawCover(canvas, photo, width, height)
                } else {
                    wallpaperPainter.drawPreset(canvas, paper.presetId, width, height)
                }
            }
            is Wallpaper.Image -> {
                ensureBitmap(paper)
                val bitmap = wallpaperBitmap
                if (bitmap != null) {
                    wallpaperPainter.drawCover(canvas, bitmap, width, height)
                } else {
                    wallpaperPainter.drawPreset(canvas, WallpaperPresetId.SIYAH, width, height)
                }
            }
        }
        val breathe = if (isHardwareAccelerated) {
            val phase = (SystemClock.uptimeMillis() % 7000L) / 7000.0
            0.82 + 0.18 * sin(phase * Math.PI)
        } else {
            1.0
        }
        val lamp = (design.lamp / 100.0).coerceIn(0.0, 1.0) * breathe * 0.55
        wallpaperPainter.drawLamp(canvas, width, height, lamp)
        wallpaperPainter.drawScrim(canvas, width, height)
        wallpaperPainter.drawGrain(canvas, width, height)
    }

    private fun drawOps(canvas: Canvas, ops: List<DrawOp>, scene: Scene) {
        for (op in ops) {
            when (op) {
                is DrawOp.RoundRect -> drawRound(canvas, op)
                is DrawOp.Poster -> drawPoster(canvas, op)
                is DrawOp.Mark -> drawMark(canvas, op)
                is DrawOp.Text -> drawText(canvas, op)
                is DrawOp.Group -> {
                    val save = canvas.save()
                    val clip = op.clip
                    if (clip != null) {
                        canvas.clipRect(clip.left, clip.top, clip.right, clip.bottom)
                    }
                    val lift = op.liftKey
                    if (lift != null && lift == focusKey) {
                        val item = scene.items.firstOrNull { it.key == lift }
                        if (item != null) {
                            val cx = item.box.left + item.box.width / 2f
                            val cy = item.box.top + item.box.height / 2f
                            canvas.scale(1.045f, 1.045f, cx, cy)
                        }
                    }
                    drawOps(canvas, op.children, scene)
                    canvas.restoreToCount(save)
                }
            }
        }
    }

    private fun drawRound(canvas: Canvas, op: DrawOp.RoundRect) {
        val rect = op.box.toRectF()
        if ((op.color ushr 24) in 1..63) drawGlassBackdrop(canvas, rect, op.radius)
        fillPaint.shader = null
        fillPaint.style = Paint.Style.FILL
        fillPaint.color = op.color
        canvas.drawRoundRect(rect, op.radius, op.radius, fillPaint)
        if ((op.color ushr 24) in 1..63) {
            fillPaint.shader = LinearGradient(rect.left, rect.top, rect.right, rect.bottom,
                0x18FFFFFF, 0x03FFFFFF, Shader.TileMode.CLAMP)
            canvas.drawRoundRect(rect, op.radius, op.radius, fillPaint)
            fillPaint.shader = null
            fillPaint.style = Paint.Style.STROKE
            fillPaint.strokeWidth = (width * 0.0008f).coerceAtLeast(1f)
            fillPaint.color = 0x30FFFFFF
            canvas.drawRoundRect(rect, op.radius, op.radius, fillPaint)
            fillPaint.style = Paint.Style.FILL
        }
        if (op.strokeWidth > 0f) {
            fillPaint.style = Paint.Style.STROKE
            fillPaint.strokeWidth = op.strokeWidth
            fillPaint.color = op.strokeColor
            canvas.drawRoundRect(rect, op.radius, op.radius, fillPaint)
        }
    }

    private fun drawGlassBackdrop(canvas: Canvas, rect: RectF, radius: Float) {
        val source = when (design.wallpaper) {
            is Wallpaper.Preset -> presetBitmap
            is Wallpaper.Image -> wallpaperBitmap
        } ?: return
        if (source.isRecycled) return
        if (glassSource !== source || glassBitmap == null) {
            glassBitmap?.recycle()
            val sampleWidth = 128
            val sampleHeight = (sampleWidth * backdropHeight / backdropWidth).toInt().coerceAtLeast(1)
            val blurred = Bitmap.createBitmap(sampleWidth, sampleHeight, Bitmap.Config.ARGB_8888)
            wallpaperPainter.drawCover(Canvas(blurred), source, sampleWidth.toFloat(), sampleHeight.toFloat())
            val pixels = IntArray(sampleWidth * sampleHeight)
            blurred.getPixels(pixels, 0, sampleWidth, 0, 0, sampleWidth, sampleHeight)
            var input = pixels
            repeat(3) {
                val output = IntArray(input.size)
                for (y in 0 until sampleHeight) for (x in 0 until sampleWidth) {
                    var red = 0
                    var green = 0
                    var blue = 0
                    var count = 0
                    for (dy in -2..2) for (dx in -2..2) {
                        val color = input[(y + dy).coerceIn(0, sampleHeight - 1) * sampleWidth +
                            (x + dx).coerceIn(0, sampleWidth - 1)]
                        red += (color ushr 16) and 255
                        green += (color ushr 8) and 255
                        blue += color and 255
                        count++
                    }
                    output[y * sampleWidth + x] = 0xFF000000.toInt() or
                        ((red / count) shl 16) or ((green / count) shl 8) or (blue / count)
                }
                input = output
            }
            blurred.setPixels(input, 0, sampleWidth, 0, 0, sampleWidth, sampleHeight)
            glassBitmap = blurred
            glassSource = source
        }
        val save = canvas.save()
        canvas.clipPath(Path().apply { addRoundRect(rect, radius, radius, Path.Direction.CW) })
        canvas.drawBitmap(glassBitmap!!, null, RectF(0f, 0f, backdropWidth, backdropHeight), bitmapPaint)
        canvas.restoreToCount(save)
    }

    private fun drawPoster(canvas: Canvas, op: DrawOp.Poster) {
        val rect = op.box.toRectF()
        val save = canvas.save()
        val clip = Path()
        clip.addRoundRect(rect, op.radius, op.radius, Path.Direction.CW)
        canvas.clipPath(clip)
        PosterScenes.draw(canvas, op.box, op.cardId, fillPaint)
        if (op.title.isNotEmpty()) {
            drawPosterCaption(canvas, op)
        } else {
            fillPaint.shader = LinearGradient(
                rect.left,
                rect.top + rect.height() * 0.42f,
                rect.left,
                rect.bottom,
                0x00000000,
                0xE6000000.toInt(),
                Shader.TileMode.CLAMP,
            )
            fillPaint.style = Paint.Style.FILL
            canvas.drawRect(rect.left, rect.top + rect.height() * 0.42f, rect.right, rect.bottom, fillPaint)
            fillPaint.shader = null
        }
        canvas.restoreToCount(save)
    }

    private fun drawPosterCaption(canvas: Canvas, op: DrawOp.Poster) {
        val box = op.box
        val bandTop = box.top + box.height * 0.62f
        fillPaint.shader = null
        fillPaint.style = Paint.Style.FILL
        fillPaint.color = 0xCC000000.toInt()
        canvas.drawRect(box.left, bandTop, box.right, box.bottom, fillPaint)
        val pad = box.width * 0.06f
        val titleSize = box.width * 0.09f
        val metaSize = box.width * 0.072f
        val maxText = (box.width - pad * 2f).coerceAtLeast(1f)
        val title = ellipsize(op.title, maxText) {
            measurer.measure(it, titleSize, FontRole.BODY, 0f).width
        }
        val meta = ellipsize(op.meta.ifEmpty { "Bilgi yok" }, maxText) {
            measurer.measure(it, metaSize, FontRole.BODY, 0f).width
        }
        val titleMetrics = measurer.measure(title, titleSize, FontRole.BODY, 0f)
        val metaMetrics = measurer.measure(meta, metaSize, FontRole.BODY, 0f)
        var y = bandTop + pad * 0.45f
        drawText(
            canvas,
            DrawOp.Text(title, box.left + pad, y + titleMetrics.ascent, titleSize, 0xFFFFFFFF.toInt(), FontRole.BODY, TextAlign.LEFT, 0f),
        )
        y += titleMetrics.height + box.height * 0.015f
        drawText(
            canvas,
            DrawOp.Text(meta, box.left + pad, y + metaMetrics.ascent, metaSize, 0xC8FFFFFF.toInt(), FontRole.BODY, TextAlign.LEFT, 0f),
        )
    }

    private fun brandWord(kind: AppMark): String? {
        return when (kind) {
            AppMark.YOUTUBE -> "YouTube"
            AppMark.NETFLIX -> "NETFLIX"
            AppMark.DISNEY -> "Disney+"
            AppMark.BLUTV -> "BluTV"
            AppMark.TABII -> "tabii"
            AppMark.AYARLAR -> null
            AppMark.LETTER -> null
        }
    }

    private fun drawMark(canvas: Canvas, op: DrawOp.Mark) {
        val installed = if (design.tiles == TileStyle.MARKA && design.logoColor == LogoColor.MARKA) {
            launcherIcons[op.kind]
        } else null
        if (installed != null && !installed.isRecycled) {
            val side = minOf(op.box.width, op.box.height)
            val left = op.box.left + (op.box.width - side) / 2f
            val top = op.box.top + (op.box.height - side) / 2f
            val rect = Box(left, top, left + side, top + side).toRectF()
            val save = canvas.save()
            val clip = Path()
            clip.addRoundRect(rect, side * 0.22f, side * 0.22f, Path.Direction.CW)
            canvas.clipPath(clip)
            canvas.drawBitmap(installed, null, rect, bitmapPaint)
            canvas.restoreToCount(save)
            return
        }
        val word = if (op.kind in listOf(AppMark.DISNEY, AppMark.BLUTV, AppMark.TABII)) brandWord(op.kind) else null
        if (word != null) {
            if (!op.glyphOnly) drawRound(canvas, DrawOp.RoundRect(op.box, op.fill, op.radius))
            val paint = Paint(bodyPaint).apply {
                typeface = if (op.kind == AppMark.DISNEY) Typeface.create("serif", Typeface.BOLD_ITALIC)
                    else Typeface.create("sans-serif", Typeface.BOLD)
                color = op.ink
                textAlign = Paint.Align.CENTER
                textSize = op.box.height * if (op.kind == AppMark.DISNEY) 0.48f else 0.58f
            }
            paint.textSize *= minOf(1f, op.box.width * 0.92f / paint.measureText(word).coerceAtLeast(1f))
            val metrics = paint.fontMetrics
            val baseline = op.box.top + (op.box.height - metrics.ascent - metrics.descent) / 2f
            canvas.drawText(word, op.box.left + op.box.width / 2f, baseline, paint)
            if (op.kind == AppMark.DISNEY) {
                paint.style = Paint.Style.STROKE
                paint.strokeWidth = (op.box.height * 0.025f).coerceAtLeast(1.5f)
                paint.strokeCap = Paint.Cap.ROUND
                val textWidth = paint.measureText(word)
                val center = op.box.left + op.box.width / 2f
                val arc = Path().apply {
                    moveTo(center - textWidth * 0.46f, baseline + metrics.ascent * 0.85f)
                    quadTo(center, baseline + metrics.ascent * 1.8f,
                        center + textWidth * 0.4f, baseline + metrics.ascent * 0.82f)
                }
                canvas.drawPath(arc, paint)
            }
            return
        }
        val drawable = markDrawable(op.kind, op.glyphOnly)
        if (drawable != null) {
            try {
                val left = op.box.left.toInt()
                val top = op.box.top.toInt()
                val right = op.box.right.toInt().coerceAtLeast(left + 1)
                val bottom = op.box.bottom.toInt().coerceAtLeast(top + 1)
                if (op.glyphOnly) {
                    drawable.setTint(op.ink)
                } else {
                    drawable.setTintList(null)
                }
                drawable.setBounds(left, top, right, bottom)
                drawable.draw(canvas)
                return
            } catch (_: Exception) {
                // A broken vector falls through to the letter tile.
            }
        }
        if (op.glyphOnly) {
            val metrics = measurer.measure(op.letter, op.letterSize, FontRole.BODY, 0f)
            drawText(
                canvas,
                DrawOp.Text(
                    text = op.letter,
                    x = op.box.left + op.box.width / 2f,
                    baseline = op.box.top + (op.box.height - metrics.height) / 2f + metrics.ascent,
                    size = op.letterSize,
                    color = op.ink,
                    role = FontRole.BODY,
                    align = TextAlign.CENTER,
                    trackingEm = 0f,
                ),
            )
            return
        }
        drawRound(canvas, DrawOp.RoundRect(op.box, op.fill, op.radius))
        val metrics = measurer.measure(op.letter, op.letterSize, FontRole.BODY, 0f)
        drawText(
            canvas,
            DrawOp.Text(
                text = op.letter,
                x = op.box.left + op.box.width / 2f,
                baseline = op.box.top + (op.box.height - metrics.height) / 2f + metrics.ascent,
                size = op.letterSize,
                color = op.ink,
                role = FontRole.BODY,
                align = TextAlign.CENTER,
                trackingEm = 0f,
            ),
        )
    }

    private fun drawText(canvas: Canvas, op: DrawOp.Text) {
        val paint = paintFor(op.role)
        paint.textSize = op.size
        paint.color = op.color
        paint.letterSpacing = op.trackingEm
        paint.fontFeatureSettings = "tnum"
        paint.textAlign = when (op.align) {
            TextAlign.LEFT -> Paint.Align.LEFT
            TextAlign.CENTER -> Paint.Align.CENTER
            TextAlign.RIGHT -> Paint.Align.RIGHT
        }
        canvas.drawText(op.text, op.x, op.baseline, paint)
    }

    private fun drawFocus(canvas: Canvas, scene: Scene, width: Float) {
        val key = focusKey ?: return
        val item = scene.items.firstOrNull { it.key == key } ?: return
        val scale = 1.045f
        val cx = item.box.left + item.box.width / 2f
        val cy = item.box.top + item.box.height / 2f
        val rect = RectF(
            cx + (item.box.left - cx) * scale,
            cy + (item.box.top - cy) * scale,
            cx + (item.box.right - cx) * scale,
            cy + (item.box.bottom - cy) * scale,
        )
        val radius = item.radius * scale
        fillPaint.shader = null
        fillPaint.style = Paint.Style.STROKE
        val layers = floatArrayOf(0.7f, 0.38f, 0.14f)
        val alphas = floatArrayOf(0.16f, 0.32f, 0.62f)
        for (index in layers.indices) {
            fillPaint.strokeWidth = cqw(width, layers[index])
            fillPaint.color = Palette.alpha(0xFFFFFFFF.toInt(), alphas[index])
            canvas.drawRoundRect(rect, radius, radius, fillPaint)
        }
        fillPaint.style = Paint.Style.FILL
    }

    private fun drawNotice(canvas: Canvas, width: Float, height: Float) {
        val message = notice ?: return
        val size = cqw(width, 1.35f)
        val pad = cqw(width, 1.4f)
        val lines = wrapText(message, width - pad * 2, 2) {
            measurer.measure(it, size, FontRole.BODY, 0f).width
        }
        if (lines.isEmpty()) {
            return
        }
        val lineHeight = measurer.measure(lines.first(), size, FontRole.BODY, 0f).height
        val barHeight = pad * 1.4f + lineHeight * lines.size
        val top = height - barHeight
        fillPaint.shader = null
        fillPaint.style = Paint.Style.FILL
        fillPaint.color = Palette.alpha(Palette.background, 0.92f)
        canvas.drawRect(0f, top, width, height, fillPaint)
        var baseline = top + pad * 0.55f
        for (line in lines) {
            val metrics = measurer.measure(line, size, FontRole.BODY, 0f)
            baseline += metrics.ascent
            drawText(
                canvas,
                DrawOp.Text(line, pad, baseline, size, Palette.foreground, FontRole.BODY, TextAlign.LEFT, 0f),
            )
            baseline += metrics.descent
        }
    }

    private fun drawOverlay(canvas: Canvas, width: Float, height: Float) {
        val current = overlay ?: return
        fillPaint.shader = null
        fillPaint.style = Paint.Style.FILL
        fillPaint.color = Palette.alpha(0xFF000000.toInt(), 0.5f)
        canvas.drawRect(0f, 0f, width, height, fillPaint)
        val cardWidth = width * 0.46f
        val pad = cqw(width, 2.1f)
        val titleSize = cqw(width, 3.1f)
        val bodySize = cqw(width, 1.45f)
        val maxText = cardWidth - pad * 2
        val title = ellipsize(current.title, maxText) {
            measurer.measure(it, titleSize, FontRole.DISPLAY, 0f).width
        }
        val body = wrapText(current.detail, maxText, 3) {
            measurer.measure(it, bodySize, FontRole.BODY, 0f).width
        }
        val hint = "Tamam veya Geri kapatır."
        val titleHeight = measurer.measure(title, titleSize, FontRole.DISPLAY, 0f).height
        val bodyHeight = body.sumOf { line ->
            measurer.measure(line, bodySize, FontRole.BODY, 0f).height.toDouble()
        }.toFloat()
        val hintHeight = measurer.measure(hint, bodySize * 0.9f, FontRole.BODY, 0f).height
        val gap = cqw(width, 0.8f)
        val cardHeight = pad * 2 + titleHeight + gap + bodyHeight + gap + hintHeight
        val left = (width - cardWidth) / 2f
        val top = (height - cardHeight) / 2f
        val card = Box(left, top, left + cardWidth, top + cardHeight)
        fillPaint.color = Palette.popover
        canvas.drawRoundRect(card.toRectF(), cqw(width, 1.2f), cqw(width, 1.2f), fillPaint)
        var y = top + pad
        val titleMetrics = measurer.measure(title, titleSize, FontRole.DISPLAY, 0f)
        drawText(
            canvas,
            DrawOp.Text(
                title,
                left + pad,
                y + titleMetrics.ascent,
                titleSize,
                Palette.foreground,
                FontRole.DISPLAY,
                TextAlign.LEFT,
                0f,
            ),
        )
        y += titleHeight + gap
        for (line in body) {
            val metrics = measurer.measure(line, bodySize, FontRole.BODY, 0f)
            drawText(
                canvas,
                DrawOp.Text(
                    line,
                    left + pad,
                    y + metrics.ascent,
                    bodySize,
                    Palette.foreground(0.82f),
                    FontRole.BODY,
                    TextAlign.LEFT,
                    0f,
                ),
            )
            y += metrics.height
        }
        y += gap
        val hintMetrics = measurer.measure(hint, bodySize * 0.9f, FontRole.BODY, 0f)
        drawText(
            canvas,
            DrawOp.Text(
                hint,
                left + pad,
                y + hintMetrics.ascent,
                bodySize * 0.9f,
                Palette.foreground(0.62f),
                FontRole.BODY,
                TextAlign.LEFT,
                0f,
            ),
        )
    }

    private fun readAppCatalog(): List<DockApp> = runCatching {
        val entries = JSONArray(preferences.getString("catalog", "[]") ?: "[]")
        buildList {
            for (index in 0 until minOf(entries.length(), 48)) {
                val app = entries.optJSONObject(index) ?: continue
                val color = AppColorId.fromWire(app.optString("colorId")) ?: continue
                val id = app.optString("id")
                val name = app.optString("name")
                if (id.isNotEmpty() && name.isNotEmpty()) add(DockApp(id, name, color))
            }
        }
    }.getOrDefault(emptyList())

    private fun settingsApps(): List<DockApp> = appCatalog

    private fun settingsRows(): List<Pair<String, String>> {
        val paper = (design.wallpaper as? Wallpaper.Preset)?.presetId
        return listOf(
            "Tasarım" to when (design.layout) {
                LayoutId.MOZAIK -> "Mozaik"
                LayoutId.SALON -> "Dock"
                LayoutId.SINEMA -> "Sinema"
                LayoutId.SAAT -> "Saat"
            },
            "Arka plan" to (paper?.let { WALLPAPER_NAMES[it] } ?: "Kendi fotoğrafım"),
            "Karolar" to if (design.tiles == TileStyle.MARKA) "Marka renkleri" else "Sade",
            "Etiketler" to when (design.labels) {
                LabelMode.LOGO_AD -> "Logo ve ad"
                LabelMode.LOGO -> "Yalnız logo"
                LabelMode.AD -> "Yalnız ad"
            },
            "Logo rengi" to if (design.logoColor == LogoColor.MARKA) "Marka renkleri" else "Tek renk",
            "Yazı tipi" to if (design.fontStyle == FontStyle.MODERN) "Modern" else "Yumuşak",
            "Saat" to if (design.showClock) "Göster" else "Gizle",
            "Lamba" to "%${design.lamp}",
        ) + settingsApps().map { app ->
            app.name to if (design.apps.any { it.id == app.id }) "Göster" else "Gizle"
        } + listOf(
            "Telefonla bağlan" to if (phoneConnected) "Bağlı" else if (phoneAvailable) "QR kodu göster" else "Bağlantıyı aç",
            "Tamam" to "Ekrana dön",
        )
    }

    private fun handleSettingsKey(code: Int, repeat: Int): Boolean {
        val rows = settingsRows()
        when (code) {
            KeyEvent.KEYCODE_BACK, KeyEvent.KEYCODE_ESCAPE -> settingsOpen = false
            KeyEvent.KEYCODE_DPAD_UP -> settingsIndex = (settingsIndex - 1).coerceAtLeast(0)
            KeyEvent.KEYCODE_DPAD_DOWN -> settingsIndex = (settingsIndex + 1).coerceAtMost(rows.lastIndex)
            KeyEvent.KEYCODE_DPAD_LEFT -> changeSetting(-1)
            KeyEvent.KEYCODE_DPAD_RIGHT -> changeSetting(1)
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_NUMPAD_ENTER, KeyEvent.KEYCODE_BUTTON_A -> if (repeat == 0) changeSetting(1)
            else -> return false
        }
        invalidate()
        return true
    }

    private fun changeSetting(delta: Int) {
        val selectedAppId = settingsApps().getOrNull(settingsIndex - 8)?.id
        fun <T> next(options: List<T>, current: T): T =
            options[Math.floorMod(options.indexOf(current) + delta, options.size)]
        val next = when (settingsIndex) {
            0 -> design.copy(layout = next(LayoutId.entries, design.layout))
            1 -> design.copy(wallpaper = Wallpaper.Preset(next(WallpaperPresetId.entries,
                (design.wallpaper as? Wallpaper.Preset)?.presetId ?: WallpaperPresetId.ISTANBUL_AKSAM)))
            2 -> design.copy(tiles = next(TileStyle.entries, design.tiles))
            3 -> design.copy(labels = next(LabelMode.entries, design.labels))
            4 -> design.copy(logoColor = next(LogoColor.entries, design.logoColor))
            5 -> design.copy(fontStyle = next(FontStyle.entries, design.fontStyle))
            6 -> design.copy(showClock = !design.showClock)
            7 -> design.copy(lamp = (design.lamp + delta * 5).coerceIn(0, 100))
            else -> {
                val apps = settingsApps()
                val index = settingsIndex - 8
                if (index in apps.indices) {
                    val app = apps[index]
                    val enabled = design.apps.any { it.id == app.id }
                    if (appMark(app) == AppMark.AYARLAR && enabled) return
                    design.copy(apps = if (enabled) design.apps.filter { it.id != app.id }
                        else (design.apps + app).take(dev.evekrani.a850c.core.Limits.apps))
                } else {
                    if (index == apps.size) {
                        settingsOpen = false
                        onPairRequested?.invoke()
                    } else settingsOpen = false
                    return
                }
            }
        }
        applyEditedDesign(next)
        if (selectedAppId != null) {
            settingsIndex = 8 + settingsApps().indexOfFirst { it.id == selectedAppId }.coerceAtLeast(0)
        }
    }

    private fun drawSettings(canvas: Canvas, width: Float, height: Float) {
        if (!settingsOpen) return
        val rows = settingsRows()
        settingsIndex = settingsIndex.coerceIn(0, rows.lastIndex)
        val panel = Box(width * 0.65f, 0f, width, height)
        fillPaint.shader = null
        fillPaint.style = Paint.Style.FILL
        fillPaint.color = 0x33040910
        canvas.drawRect(0f, 0f, width, height, fillPaint)
        drawGlassBackdrop(canvas, panel.toRectF(), 0f)
        drawRound(canvas, DrawOp.RoundRect(panel, 0xC215202D.toInt(), 0f, 0x45FFFFFF, cqw(width, 0.07f)))
        val pad = cqw(width, 2.5f)
        val x = panel.left + pad
        var y = panel.top + pad
        fun label(text: String, left: Float, top: Float, size: Float, color: Int, align: TextAlign = TextAlign.LEFT) {
            val metrics = measurer.measure(text, size, FontRole.BODY, 0f)
            drawText(canvas, DrawOp.Text(text, left, top + metrics.ascent, size, color, FontRole.BODY, align, 0f))
        }
        label("Kendin yap", x, y, cqw(width, 2.05f), 0xFFFFFFFF.toInt())
        y += cqw(width, 3.1f)
        label("Sol / Sağ: Seç · Geri: Kapat", x, y, cqw(width, 1.15f), 0xBBFFFFFF.toInt())
        y += cqw(width, 2.4f)
        val rowHeight = cqw(width, 4.5833f)
        val start = (settingsIndex - 3).coerceIn(0, (rows.size - 7).coerceAtLeast(0))
        for (index in start until minOf(rows.size, start + 7)) {
            val selected = index == settingsIndex
            if (selected) drawRound(canvas, DrawOp.RoundRect(
                Box(x - pad * 0.45f, y, panel.right - pad * 0.55f, y + rowHeight * 0.9f),
                0x22FFFFFF, cqw(width, 0.65f), 0x77FFFFFF, cqw(width, 0.06f)))
            val baselineTop = y + rowHeight * 0.22f
            val textSize = cqw(width, 1.3542f)
            val halfWidth = (panel.width - pad * 2f) * 0.48f
            val title = ellipsize(rows[index].first, halfWidth) { measurer.measure(it, textSize, FontRole.BODY, 0f).width }
            val value = ellipsize(rows[index].second, halfWidth) { measurer.measure(it, textSize, FontRole.BODY, 0f).width }
            label(title, x, baselineTop, textSize, 0xFFFFFFFF.toInt())
            label(value, panel.right - pad, baselineTop, textSize,
                if (selected) 0xFFFFFFFF.toInt() else 0xBBFFFFFF.toInt(), TextAlign.RIGHT)
            y += rowHeight
        }
        label("${settingsIndex + 1} / ${rows.size}   ·   Otomatik kaydedilir", x,
            panel.bottom - pad - cqw(width, 0.5f), cqw(width, 1f), 0x99FFFFFF.toInt())
    }

    private fun ensureBitmap(image: Wallpaper.Image) {
        if (image.dataUrl == wallpaperKey) {
            return
        }
        wallpaperKey = image.dataUrl
        val generation = ++decodeGeneration
        val dataUrl = image.dataUrl
        val target = width.coerceAtLeast(1280)
        decodeExecutor.execute {
            val bitmap = decodeJpeg(dataUrl, target)
            post {
                if (generation != decodeGeneration) {
                    bitmap?.recycle()
                    return@post
                }
                val previous = wallpaperBitmap
                wallpaperBitmap = bitmap
                previous?.recycle()
                invalidate()
            }
        }
    }

    private fun paintFor(role: FontRole): Paint {
        return when (role) {
            FontRole.DISPLAY -> displayPaint
            FontRole.BODY -> bodyPaint
        }
    }

    private fun contentFrame(viewWidth: Float, viewHeight: Float): Box {
        if (viewWidth <= 0f || viewHeight <= 0f) {
            return Box(0f, 0f, 0f, 0f)
        }
        val target = 16f / 9f
        val ratio = viewWidth / viewHeight
        if (abs(ratio - target) / target <= 0.02f) {
            return Box(0f, 0f, viewWidth, viewHeight)
        }
        return if (ratio > target) {
            val contentWidth = viewHeight * target
            val left = (viewWidth - contentWidth) / 2f
            Box(left, 0f, left + contentWidth, viewHeight)
        } else {
            val contentHeight = viewWidth / target
            val top = (viewHeight - contentHeight) / 2f
            Box(0f, top, viewWidth, top + contentHeight)
        }
    }

    private companion object {
        val WALLPAPER_NAMES = mapOf(
            WallpaperPresetId.ISTANBUL_AKSAM to "İstanbul akşamı",
            WallpaperPresetId.SONBAHAR_BAHCE to "Sonbahar bahçesi",
            WallpaperPresetId.SIYAH to "Siyah",
            WallpaperPresetId.BAKIR_LAMBA to "Bakır lamba",
            WallpaperPresetId.GECE_CAM to "Gece camı",
            WallpaperPresetId.SOMINE to "Şömine",
            WallpaperPresetId.ZEYTIN_GECE to "Zeytin gecesi",
            WallpaperPresetId.KIS_AKSAMI to "Kış akşamı",
        )
        val PACKAGES = mapOf(
            AppMark.YOUTUBE to listOf(
                "com.google.android.youtube.tv",
                "com.google.android.youtube",
            ),
            AppMark.NETFLIX to listOf(
                "com.netflix.ninja",
                "com.netflix.mediaclient",
            ),
            AppMark.DISNEY to listOf(
                "com.disney.disneyplus",
            ),
            AppMark.BLUTV to listOf(
                "com.blutv",
                "com.blutv.android",
            ),
            AppMark.TABII to listOf(
                "com.trt.tabii",
                "com.tabii",
            ),
        )
    }

    private data class Stamp(
        val width: Float,
        val height: Float,
        val design: HomeDesign,
        val time: String,
        val date: String,
        val focus: String?,
    )

    private data class Overlay(val title: String, val detail: String)

    private fun Box.toRectF(): RectF = RectF(left, top, right, bottom)

    private fun loadFont(context: Context, file: String, variation: String): Typeface? {
        if (Build.VERSION.SDK_INT >= 26) {
            try {
                val varied = Typeface.Builder(context.assets, file)
                    .setFontVariationSettings(variation)
                    .build()
                if (varied != null) {
                    return varied
                }
            } catch (_: Exception) {
                // A static cut still loads below.
            }
        }
        return try {
            Typeface.createFromAsset(context.assets, file)
        } catch (_: Exception) {
            null
        }
    }

    private fun decodeJpeg(dataUrl: String, targetWidth: Int): Bitmap? {
        val prefix = "data:image/jpeg;base64,"
        if (!dataUrl.startsWith(prefix)) {
            return null
        }
        val bytes = try {
            Base64.decode(dataUrl.substring(prefix.length), Base64.DEFAULT)
        } catch (_: IllegalArgumentException) {
            return null
        }
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
        val options = BitmapFactory.Options().apply {
            inSampleSize = sampleSize(bounds.outWidth, targetWidth)
            inPreferredConfig = Bitmap.Config.RGB_565
        }
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options)
    }

    private fun sampleSize(sourceWidth: Int, targetWidth: Int): Int {
        var sample = 1
        var width = sourceWidth.coerceAtLeast(1)
        while (width / 2 > targetWidth) {
            width /= 2
            sample *= 2
        }
        return sample
    }
}
