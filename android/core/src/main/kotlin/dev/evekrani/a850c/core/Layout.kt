package dev.evekrani.a850c.core

import kotlin.math.max

fun cqw(width: Float, value: Float): Float = width * value / 100f

fun layoutScene(
    design: HomeDesign,
    width: Float,
    height: Float,
    time: String,
    date: String,
    focusKey: String?,
    measurer: TextMeasurer,
): Scene {
    if (width < 8f || height < 8f) {
        return Scene(emptyList(), emptyList())
    }
    return when (design.layout) {
        LayoutId.MOZAIK -> layoutMosaic(design, width, height, time, date, measurer)
        LayoutId.SALON -> layoutSalon(design, width, height, time, date, focusKey, measurer)
        LayoutId.SINEMA -> layoutSinema(design, width, height, focusKey, measurer)
        LayoutId.SAAT -> layoutSaat(design, width, height, time, date, focusKey, measurer)
    }
}

private fun layoutMosaic(
    design: HomeDesign,
    width: Float,
    height: Float,
    time: String,
    date: String,
    measurer: TextMeasurer,
): Scene {
    val pad = cqw(width, 5f)
    val clockTop = height * 0.0593f
    val ops = mutableListOf<DrawOp>()
    val items = mutableListOf<FocusItem>()
    var cursor = pad
    if (design.showClock) {
        val timeSize = height * 112f / 1080f
        val dateSize = height * 28f / 1080f
        val (clockOps, clockBottom) = placeRuns(
            listOf(
                StyledRun(time, timeSize, 0xFFFFFFFF.toInt(), FontRole.DISPLAY, TextAlign.LEFT, 0f),
                StyledRun(date, dateSize, Palette.alpha(0xFFFFFFFF.toInt(), 0.88f), FontRole.BODY, TextAlign.LEFT, 0f),
            ),
            pad,
            clockTop,
            cqw(width, 0.2f),
            measurer,
        )
        ops += clockOps
        cursor = clockBottom
    } else {
        val (labelOps, labelBottom) = placeRuns(
            listOf(StyledRun("A 850 C", cqw(width, 1.05f), Palette.alpha(0xFFFFFFFF.toInt(), 0.7f), FontRole.BODY, TextAlign.LEFT, 0.16f)),
            pad,
            pad,
            0f,
            measurer,
        )
        ops += labelOps
        cursor = labelBottom
    }
    val board = Box(pad, cursor + cqw(width, 1.3f), width - pad, height - cqw(width, 2.1f))
    val slots = mosaicSlots(design.apps)
    if (slots.isEmpty() || board.width < 8f || board.height < 8f) {
        ops += placeRuns(
            listOf(StyledRun("Uygulama seçilmedi.", cqw(width, 1.6f), 0xFFFFFFFF.toInt(), FontRole.BODY, TextAlign.LEFT, 0f)),
            board.left,
            board.top,
            0f,
            measurer,
        ).first
        return Scene(ops, items)
    }
    val columns = slots.maxOf { it.column }
    val rows = slots.maxOf { if (it.tall) it.row + 1 else it.row }
    val gap = cqw(width, 0.9f)
    val weights = FloatArray(columns) { index ->
        when (index) {
            0 -> 1.45f
            1 -> 1.2f
            else -> 0.82f
        }
    }
    val weightSum = weights.sum()
    val colLeft = FloatArray(columns)
    val colWidth = FloatArray(columns)
    var x = board.left
    val inner = (board.width - gap * (columns - 1)).coerceAtLeast(1f)
    for (index in 0 until columns) {
        colLeft[index] = x
        colWidth[index] = inner * (weights[index] / weightSum)
        x += colWidth[index] + gap
    }
    val rowHeight = ((board.height - gap * (rows - 1)) / rows).coerceAtLeast(1f)
    val radius = cqw(width, 1.35f)
    val useFeaturedComposition = slots.count { it.featured } == 2 && rows == 2
    for (slot in slots) {
        val spec = if (useFeaturedComposition) mosaicSpecBox(slot, width, height) else null
        val left = spec?.left ?: colLeft[slot.column - 1]
        val tileWidth = spec?.width ?: colWidth[slot.column - 1]
        val top = spec?.top ?: (board.top + (slot.row - 1) * (rowHeight + gap))
        val tileHeight = spec?.height ?: if (slot.tall) rowHeight * 2f + gap else rowHeight
        val tile = Box(left, top, left + tileWidth, top + tileHeight)
        val fill = tileFill(slot.app, design.tiles, design.logoColor)
        val ink = tileInk(fill)
        val markInk = glyphInk(slot.app, design.tiles, design.logoColor)
        val key = appKey(slot.app.id)
        val label = textOr(slot.app.name, "Adsız")
        val children = mutableListOf<DrawOp>(DrawOp.RoundRect(tile, fill, radius))
        if (design.labels != LabelMode.AD) {
            val kind = appMark(slot.app)
            val word = brandWord(kind)
            val isWordmark = kind == AppMark.DISNEY || kind == AppMark.BLUTV || kind == AppMark.TABII
            val iconHeight = tile.height * if (design.labels == LabelMode.LOGO) 0.6f else 0.48f
            val icon = if (isWordmark) tile.width * 0.80f else iconHeight
            val iconLeft = tile.left + (tile.width - icon) / 2f
            val iconTop = tile.top + if (design.labels == LabelMode.LOGO) {
                (tile.height - iconHeight) / 2f
            } else {
                tile.height * 0.18f
            }
            children += DrawOp.Mark(
                box = Box(iconLeft, iconTop, iconLeft + icon, iconTop + iconHeight),
                radius = icon * 0.3f,
                kind = appMark(slot.app),
                letter = word ?: label.take(1).uppercase(TURKISH).ifEmpty { "·" },
                fill = fill,
                ink = markInk,
                letterSize = icon * 0.42f,
                glyphOnly = true,
            )
        }
        if (design.labels != LabelMode.LOGO) {
            val nameSize = if (design.labels == LabelMode.AD) cqw(width, 2.1f) else cqw(width, 1.25f)
            val shown = ellipsize(label, (tile.width * 0.84f).coerceAtLeast(1f)) {
                measureWidth(it, nameSize, FontRole.BODY, 0f, measurer)
            }
            val metrics = measurer.measure(shown, nameSize, FontRole.BODY, 0f)
            val baseline = if (design.labels == LabelMode.AD) {
                tile.top + tile.height * 0.28f + metrics.ascent
            } else {
                tile.bottom - cqw(width, 1.05f) - metrics.descent
            }
            children += DrawOp.Text(
                text = shown,
                x = tile.left + cqw(width, 1.05f),
                baseline = baseline,
                size = nameSize,
                color = ink,
                role = FontRole.BODY,
                align = TextAlign.LEFT,
                trackingEm = 0f,
            )
        }
        ops += DrawOp.Group(clip = null, children = children, liftKey = key)
        items += FocusItem(key, tile, radius)
    }
    return Scene(ops, items)
}

private fun textOr(value: String, fallback: String): String = value.trim().ifEmpty { fallback }

private fun measureWidth(
    text: String,
    size: Float,
    role: FontRole,
    trackingEm: Float,
    measurer: TextMeasurer,
): Float = measurer.measure(text, size, role, trackingEm).width

private data class Stack(
    val ops: List<DrawOp>,
    val items: List<FocusItem>,
    val width: Float,
    val height: Float,
)

private fun layoutSalon(
    design: HomeDesign,
    width: Float,
    height: Float,
    time: String,
    date: String,
    focusKey: String?,
    measurer: TextMeasurer,
): Scene {
    val ops = mutableListOf<DrawOp>()
    if (design.showClock) {
        ops += placeRuns(listOf(
            StyledRun(time, cqw(width, 5.83f), Palette.foreground, FontRole.DISPLAY, TextAlign.LEFT, 0f),
            StyledRun(date, cqw(width, 1.46f), 0xFFC5CED8.toInt(), FontRole.BODY, TextAlign.LEFT, 0f),
        ), width * 0.05f, height * 0.0593f, cqw(width, 0.2f), measurer).first
    }
    val apps = bottomAppsScene(design, width, height, focusKey, measurer)
    return Scene(ops + apps.ops, apps.items)
}

private fun bottomAppsScene(
    design: HomeDesign,
    width: Float,
    height: Float,
    focusKey: String?,
    measurer: TextMeasurer,
): Scene {
    val strip = layoutAppStrip(design, width, thin = false, vertical = false, measurer)
    val available = width * 0.9f
    val focused = strip.items.firstOrNull { it.key == focusKey }
    val offset = if (focused != null && strip.width > available) {
        offsetToReveal(focused.box.left, focused.box.right, available, cqw(width, 0.4f))
    } else 0f
    val x = width * 0.05f + (available - strip.width).coerceAtLeast(0f) / 2f - offset
    val y = height * 0.874f - strip.height
    val clip = Box(width * 0.05f, y, width * 0.95f, height * 0.874f).outset(cqw(width, 1.2f))
    return Scene(listOf(DrawOp.Group(clip, strip.ops.map { shiftOp(it, x, y) })),
        strip.items.map { it.translate(x, y) })
}

private fun layoutAppStrip(
    design: HomeDesign,
    screenW: Float,
    thin: Boolean,
    vertical: Boolean,
    measurer: TextMeasurer,
): Stack {
    val apps = design.apps
    if (apps.isEmpty()) {
        val size = cqw(screenW, 1.3f)
        val (ops, bottom) = placeRuns(
            listOf(
                StyledRun(
                    "Uygulama şeridi boş.",
                    size,
                    Palette.foreground(0.7f),
                    FontRole.BODY,
                    TextAlign.LEFT,
                    0f,
                ),
            ),
            0f,
            0f,
            0f,
            measurer,
        )
        val width = measureWidth("Uygulama şeridi boş.", size, FontRole.BODY, 0f, measurer)
        return Stack(ops, emptyList(), width, bottom)
    }
    val gap = cqw(screenW, if (vertical) 0.85f else 1.25f)
    val chips = apps.mapIndexed { index, app ->
        layoutAppChip(app, design, screenW, thin, index < 2, measurer)
    }
    val ops = mutableListOf<DrawOp>()
    val items = mutableListOf<FocusItem>()
    var cursor = 0f
    val cross = chips.maxOf { chip -> if (vertical) chip.width else chip.height }
    chips.forEach { chip ->
        if (vertical) {
            val dx = (cross - chip.width) / 2f
            ops += chip.ops.map { shiftOp(it, dx, cursor) }
            items += chip.item.translate(dx, cursor)
            cursor += chip.height + gap
        } else {
            val dy = cross - chip.height
            ops += chip.ops.map { shiftOp(it, cursor, dy) }
            items += chip.item.translate(cursor, dy)
            cursor += chip.width + gap
        }
    }
    val length = (cursor - gap).coerceAtLeast(0f)
    return if (vertical) {
        Stack(ops, items, cross, length)
    } else {
        Stack(ops, items, length, cross)
    }
}

private data class Chip(
    val ops: List<DrawOp>,
    val item: FocusItem,
    val width: Float,
    val height: Float,
)

private fun layoutAppChip(
    app: DockApp,
    design: HomeDesign,
    screenW: Float,
    thin: Boolean,
    lead: Boolean,
    measurer: TextMeasurer,
): Chip {
    val width = cqw(screenW, if (thin) 7.8f else if (lead) 18.75f else 11.25f)
    val height = cqw(screenW, if (thin) 7.2f else if (lead) 10.833f else 9.169f)
    val box = Box(0f, 0f, width, height)
    val radius = cqw(screenW, 1.46f)
    val labelSize = cqw(screenW, if (thin) 0.95f else if (lead) 1.55f else 1.22f)
    val pad = cqw(screenW, if (thin) 0.45f else 0.8f)
    val gap = cqw(screenW, if (thin) 0.2f else 0.45f)
    val label = textOr(app.name, "Adsız")
    val shown = ellipsize(label, width - pad * 2f) {
        measureWidth(it, labelSize, FontRole.BODY, 0f, measurer)
    }
    val metrics = measurer.measure(shown, labelSize, FontRole.BODY, 0f)
    val kind = appMark(app)
    val fill = tileFill(app, design.tiles, design.logoColor)
    val ink = glyphInk(app, design.tiles, design.logoColor)
    val children = mutableListOf<DrawOp>(DrawOp.RoundRect(box, fill, radius,
        Palette.foreground(0.15f), cqw(screenW, 0.05f)))
    if (design.labels != LabelMode.AD) {
        val markHeight = height - pad * 2f - if (design.labels == LabelMode.LOGO_AD) metrics.height + gap else 0f
        val markWidth = when (kind) {
            AppMark.AYARLAR, AppMark.CANLI_TV -> minOf(markHeight, width * 0.4f)
            AppMark.YOUTUBE, AppMark.NETFLIX -> width * 0.65f
            else -> width * 0.91f
        }
        val drawnHeight = if (kind == AppMark.AYARLAR || kind == AppMark.CANLI_TV) markWidth else markHeight
        val markTop = pad + (markHeight - drawnHeight) / 2f
        children += DrawOp.Mark(
            Box((width - markWidth) / 2f, markTop, (width + markWidth) / 2f, markTop + drawnHeight),
            radius, kind, label.take(1).uppercase(TURKISH).ifEmpty { "·" }, fill, ink,
            markHeight * 0.42f, glyphOnly = true,
        )
    }
    if (design.labels != LabelMode.LOGO) {
        children += DrawOp.Text(shown, width / 2f,
            if (design.labels == LabelMode.AD) (height - metrics.height) / 2f + metrics.ascent
                else height - pad - metrics.descent,
            labelSize, tileInk(fill), FontRole.BODY, TextAlign.CENTER, 0f)
    }
    val key = appKey(app.id)
    return Chip(listOf(DrawOp.Group(null, children, key)), FocusItem(key, box, radius), width, height)
}

private fun layoutSinema(
    design: HomeDesign,
    width: Float,
    height: Float,
    focusKey: String?,
    measurer: TextMeasurer,
): Scene {
    val pad = cqw(width, 2.6f)
    val gap = cqw(width, 1.4f)
    val contentW = width - pad * 2
    val sideW = contentW * 0.28f
    val dockW = cqw(width, 9.2f)
    val heroW = (contentW - sideW - dockW - gap * 2).coerceAtLeast(cqw(width, 12f))
    val top = pad
    val bottom = height - pad
    val heroBox = Box(pad, top, pad + heroW, bottom)
    val sideBox = Box(heroBox.right + gap, top, heroBox.right + gap + sideW, bottom)
    val dockBox = Box(width - pad - dockW, top, width - pad, bottom)
    val cards = design.rows.flatMap { row -> row.cards.map { card -> row to card } }
    val ops = mutableListOf<DrawOp>()
    val items = mutableListOf<FocusItem>()
    val hero = cards.firstOrNull()
    if (hero == null) {
        ops += DrawOp.RoundRect(
            heroBox,
            Palette.alpha(0xFFFFFFFF.toInt(), 0.04f),
            cqw(width, 1.4f),
            Palette.alpha(0xFFFFFFFF.toInt(), 0.1f),
            cqw(width, 0.06f),
        )
        ops += centeredLines(
            "Sinema düzeni için bir kart ekleyin. A 850 C afişi burada durur.",
            heroBox.inset(cqw(width, 2f)),
            cqw(width, 1.6f),
            Palette.foreground(0.75f),
            FontRole.BODY,
            measurer,
        )
    } else {
        val heroKey = heroKey(hero.first.id, hero.second.id)
        ops += DrawOp.Group(
            clip = null,
            children = heroOps(hero.second, heroBox, width, measurer),
            liftKey = heroKey,
        )
        items += FocusItem(heroKey, heroBox, cqw(width, 1.4f))
    }
    val side = layoutSideList(cards.drop(1), sideBox, width, focusKey, measurer)
    ops += side.ops
    items += side.items
    val dock = layoutAppStrip(design, width, thin = true, vertical = true, measurer)
    val dockPlaced = placeVerticalStrip(dock, dockBox, focusKey, cqw(width, 0.9f))
    ops += dockPlaced.ops
    items += dockPlaced.items
    return Scene(ops, items)
}

private fun heroOps(
    card: ContentCard,
    box: Box,
    screenW: Float,
    measurer: TextMeasurer,
): List<DrawOp> {
    val inset = cqw(screenW, 2f)
    val poster = if (box.width > inset * 2 && box.height > inset * 2) box.inset(inset) else box
    val pad = cqw(screenW, 1.4f)
    val kickerSize = cqw(screenW, 1.15f)
    val titleSize = cqw(screenW, 4.2f)
    val metaSize = cqw(screenW, 1.45f)
    val innerW = (poster.width - pad * 2).coerceAtLeast(1f)
    val kicker = "Öne çıkan".uppercase(TURKISH)
    val titleLines = wrapText(textOr(card.title, "Adsız kart"), innerW, 2) {
        measureWidth(it, titleSize, FontRole.DISPLAY, 0f, measurer)
    }.ifEmpty { listOf(textOr(card.title, "Adsız kart")) }
    val meta = ellipsize(textOr(card.meta, "Bilgi yok"), innerW) {
        measureWidth(it, metaSize, FontRole.BODY, 0f, measurer)
    }
    val kickerMetrics = measurer.measure(kicker, kickerSize, FontRole.BODY, 0.16f)
    val titleHeights = titleLines.sumOf { line ->
        measurer.measure(line, titleSize, FontRole.DISPLAY, 0f).height.toDouble()
    }.toFloat()
    val metaMetrics = measurer.measure(meta, metaSize, FontRole.BODY, 0f)
    val gap = cqw(screenW, 0.6f)
    val blockH = kickerMetrics.height + gap + titleHeights + gap + metaMetrics.height
    var y = poster.bottom - pad - blockH
    val ops = mutableListOf<DrawOp>(
        DrawOp.Poster(poster, cqw(screenW, 1.2f), card.id),
    )
    ops += DrawOp.Text(
        kicker,
        poster.left + pad,
        y + kickerMetrics.ascent,
        kickerSize,
        Palette.foreground(0.6f),
        FontRole.BODY,
        TextAlign.LEFT,
        0.16f,
    )
    y += kickerMetrics.height + gap
    for (line in titleLines) {
        val metrics = measurer.measure(line, titleSize, FontRole.DISPLAY, 0f)
        ops += DrawOp.Text(
            line,
            poster.left + pad,
            y + metrics.ascent,
            titleSize,
            Palette.foreground,
            FontRole.DISPLAY,
            TextAlign.LEFT,
            0f,
        )
        y += metrics.height
    }
    y += gap
    ops += DrawOp.Text(
        meta,
        poster.left + pad,
        y + metaMetrics.ascent,
        metaSize,
        Palette.foreground(0.75f),
        FontRole.BODY,
        TextAlign.LEFT,
        0f,
    )
    return ops
}

private fun layoutSideList(
    cards: List<Pair<ContentRow, ContentCard>>,
    box: Box,
    screenW: Float,
    focusKey: String?,
    measurer: TextMeasurer,
): Stack {
    val labelSize = cqw(screenW, 1.15f)
    val (labelOps, labelBottom) = placeRuns(
        listOf(
            StyledRun(
                "A 850 C",
                labelSize,
                Palette.foreground(0.45f),
                FontRole.BODY,
                TextAlign.LEFT,
                0.14f,
            ),
        ),
        box.left,
        box.top,
        0f,
        measurer,
    )
    val listTop = labelBottom + cqw(screenW, 0.7f)
    val listBox = Box(box.left, listTop, box.right, box.bottom)
    if (cards.isEmpty()) {
        val (noteOps, _) = placeRuns(
            listOf(
                StyledRun(
                    "Yan liste boş.",
                    cqw(screenW, 1.3f),
                    Palette.foreground(0.7f),
                    FontRole.BODY,
                    TextAlign.LEFT,
                    0f,
                ),
            ),
            box.left,
            listTop,
            0f,
            measurer,
        )
        return Stack(labelOps + noteOps, emptyList(), box.width, box.height)
    }
    val gap = cqw(screenW, 0.7f)
    val localOps = mutableListOf<DrawOp>()
    val localItems = mutableListOf<FocusItem>()
    var y = 0f
    for ((row, card) in cards) {
        val item = layoutSideItem(row, card, screenW, box.width, measurer)
        localOps += item.ops.map { shiftOp(it, 0f, y) }
        localItems += item.item.translate(0f, y)
        y += item.height + gap
    }
    val contentH = (y - gap).coerceAtLeast(0f)
    val focused = localItems.firstOrNull { it.key == focusKey }
    val offset = if (focused != null) {
        offsetToReveal(focused.box.top, focused.box.bottom, listBox.height, cqw(screenW, 0.35f))
    } else {
        0f
    }
    val placedOps = localOps.map { shiftOp(it, box.left, listTop - offset) }
    val placedItems = localItems.map { it.translate(box.left, listTop - offset) }
    return Stack(
        ops = labelOps + listOf(DrawOp.Group(listBox.outset(cqw(screenW, 0.7f)), placedOps)),
        items = placedItems,
        width = box.width,
        height = contentH,
    )
}

private data class SideItem(
    val ops: List<DrawOp>,
    val item: FocusItem,
    val height: Float,
)

private fun layoutSideItem(
    row: ContentRow,
    card: ContentCard,
    screenW: Float,
    columnW: Float,
    measurer: TextMeasurer,
): SideItem {
    val padX = cqw(screenW, 0.9f)
    val padY = cqw(screenW, 0.7f)
    val titleSize = cqw(screenW, 1.5f)
    val metaSize = cqw(screenW, 1.15f)
    val innerW = (columnW - padX * 2).coerceAtLeast(1f)
    val title = ellipsize(textOr(card.title, "Adsız kart"), innerW) {
        measureWidth(it, titleSize, FontRole.DISPLAY, 0f, measurer)
    }
    val metaSource = card.meta.trim().ifEmpty { textOr(row.title, "Bilgi yok") }
    val meta = ellipsize(metaSource, innerW) {
        measureWidth(it, metaSize, FontRole.BODY, 0f, measurer)
    }
    val titleMetrics = measurer.measure(title, titleSize, FontRole.DISPLAY, 0f)
    val metaMetrics = measurer.measure(meta, metaSize, FontRole.BODY, 0f)
    val gap = cqw(screenW, 0.2f)
    val height = padY + titleMetrics.height + gap + metaMetrics.height + padY
    val box = Box(0f, 0f, columnW, height)
    val radius = cqw(screenW, 0.7f)
    val ops = listOf(
        DrawOp.RoundRect(
            box,
            Palette.alpha(0xFFFFFFFF.toInt(), 0.06f),
            radius,
            Palette.alpha(0xFFFFFFFF.toInt(), 0.1f),
            cqw(screenW, 0.06f),
        ),
        DrawOp.Text(
            title,
            padX,
            padY + titleMetrics.ascent,
            titleSize,
            Palette.foreground,
            FontRole.DISPLAY,
            TextAlign.LEFT,
            0f,
        ),
        DrawOp.Text(
            meta,
            padX,
            padY + titleMetrics.height + gap + metaMetrics.ascent,
            metaSize,
            Palette.foreground(0.5f),
            FontRole.BODY,
            TextAlign.LEFT,
            0f,
        ),
    )
    val key = cardKey(row.id, card.id)
    return SideItem(
        ops = listOf(DrawOp.Group(clip = null, children = ops, liftKey = key)),
        item = FocusItem(key, box, radius),
        height = height,
    )
}

private fun placeVerticalStrip(
    strip: Stack,
    viewport: Box,
    focusKey: String?,
    ring: Float,
): Stack {
    val focused = strip.items.firstOrNull { it.key == focusKey }
    val offset = if (focused != null && strip.height > viewport.height) {
        offsetToReveal(focused.box.top, focused.box.bottom, viewport.height, ring)
    } else {
        0f
    }
    val dx = viewport.left + (viewport.width - strip.width).coerceAtLeast(0f) / 2f
    val dy = viewport.top - offset
    return Stack(
        ops = listOf(
            DrawOp.Group(
                viewport.outset(ring),
                strip.ops.map { shiftOp(it, dx, dy) },
            ),
        ),
        items = strip.items.map { it.translate(dx, dy) },
        width = strip.width,
        height = strip.height,
    )
}

private fun layoutSaat(
    design: HomeDesign,
    width: Float,
    height: Float,
    time: String,
    date: String,
    focusKey: String?,
    measurer: TextMeasurer,
): Scene {
    val text = if (design.showClock) time else "Saat gizli."
    val size = cqw(width, if (design.showClock) 8.33f else 4f)
    val metrics = measurer.measure(text, size, FontRole.DISPLAY, 0f)
    val clock = DrawOp.Text(text, width / 2f, (height - metrics.height) / 2f + metrics.ascent,
        size, Palette.foreground, FontRole.DISPLAY, TextAlign.CENTER, 0f)
    val apps = if (focusKey != null) bottomAppsScene(design, width, height, focusKey, measurer)
        else Scene(emptyList(), emptyList())
    return Scene(listOf(clock) + apps.ops, apps.items)
}

private fun brandWord(kind: AppMark): String? {
    return when (kind) {
        AppMark.YOUTUBE -> "YouTube"
        AppMark.NETFLIX -> "NETFLIX"
        AppMark.DISNEY -> "Disney+"
        AppMark.BLUTV -> "BluTV"
        AppMark.TABII -> "tabii"
        AppMark.AYARLAR -> null
        AppMark.CANLI_TV -> null
        AppMark.LETTER -> null
    }
}

private fun mosaicSpecBox(slot: MosaicSlot, width: Float, height: Float): Box? {
    if (!slot.featured && slot.row != 2) {
        return null
    }
    val originX = width * 96f / 1920f
    val originY = height * 456f / 1080f
    val gapX = width * 24f / 1920f
    val leadW = width * 852f / 1920f
    val leadH = height * 256f / 1080f
    val smallW = width * 414f / 1920f
    val smallH = height * 184f / 1080f
    val index = (slot.column - 1).coerceAtLeast(0)
    if (slot.featured) {
        val left = originX + index * (leadW + gapX)
        return Box(left, originY, left + leadW, originY + leadH)
    }
    val left = originX + index * (smallW + gapX)
    val top = originY + leadH + height * 24f / 1080f
    return Box(left, top, left + smallW, top + smallH)
}

private fun centeredLines(
    text: String,
    box: Box,
    size: Float,
    color: Int,
    role: FontRole,
    measurer: TextMeasurer,
): List<DrawOp> {
    val lines = wrapText(text, box.width, 4) {
        measureWidth(it, size, role, 0f, measurer)
    }.ifEmpty { listOf(text) }
    val (ops, bottom) = placeRuns(
        lines.map { StyledRun(it, size, color, role, TextAlign.CENTER, 0f) },
        box.left + box.width / 2f,
        0f,
        cqw(box.width, 1.5f),
        measurer,
    )
    val dy = box.top + (box.height - bottom).coerceAtLeast(0f) / 2f
    return ops.map { shiftOp(it, 0f, dy) }
}
