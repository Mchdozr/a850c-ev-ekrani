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
    val pad = cqw(width, 3.1f)
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
            pad,
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
    for (slot in slots) {
        val spec = mosaicSpecBox(slot, width, height)
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
            val word = brandWord(appMark(slot.app))
            val icon = if (word != null) tile.width * 0.86f else when {
                slot.tall -> cqw(width, 8.6f)
                slot.featured -> cqw(width, 6.4f)
                else -> cqw(width, 4.1f)
            }
            val iconHeight = if (word != null) tile.height * 0.46f else icon
            val iconLeft = tile.left + (tile.width - icon) / 2f
            val iconTop = tile.top + if (design.labels == LabelMode.LOGO || word != null) {
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
    val padX = cqw(width, 3.4f)
    val padTop = cqw(width, 2.3f)
    val padBottom = cqw(width, 2f)
    val innerLeft = padX
    val innerRight = width - padX
    val innerTop = padTop
    val innerBottom = height - padBottom
    val innerW = innerRight - innerLeft
    val sectionGap = cqw(width, 0.32f)
    val columnGap = cqw(width, 2.4f)
    val ring = cqw(width, 1.2f)
    val ops = mutableListOf<DrawOp>()
    val items = mutableListOf<FocusItem>()

    val timeSize = cqw(width, 5.8f)
    val dateSize = cqw(width, 1.15f)
    val clockWidth = if (design.showClock) {
        max(
            measureWidth(time, timeSize, FontRole.DISPLAY, 0f, measurer),
            measureWidth(date, dateSize, FontRole.BODY, 0f, measurer),
        )
    } else {
        0f
    }
    val columnWidth = if (design.showClock) {
        (innerW - clockWidth - columnGap).coerceAtLeast(cqw(width, 24f))
    } else {
        innerW
    }

    val eyebrow = "A 850 C".uppercase(TURKISH)
    val greeting = textOr(design.greeting, "İyi akşamlar")
    val profile = textOr(design.profileName, "Ev")
    val weather = textOr(design.weatherLine, "Hava satırı boş")
    val greetingSize = cqw(width, 2.7f)
    val greetingLines = wrapText(greeting, columnWidth, 2) {
        measureWidth(it, greetingSize, FontRole.DISPLAY, 0f, measurer)
    }.ifEmpty { listOf(greeting) }

    var cursor = innerTop
    val headerOps = mutableListOf<DrawOp>()
    fun addBlock(runs: List<StyledRun>, gapAfter: Float) {
        val (blockOps, bottom) = placeRuns(runs, innerLeft, cursor, 0f, measurer)
        headerOps += blockOps
        cursor = bottom + gapAfter
    }
    addBlock(
        listOf(StyledRun(eyebrow, cqw(width, 0.95f), Palette.foreground(0.45f), FontRole.BODY, TextAlign.LEFT, 0.16f)),
        sectionGap,
    )
    addBlock(
        greetingLines.map {
            StyledRun(it, greetingSize, Palette.foreground, FontRole.DISPLAY, TextAlign.LEFT, 0f)
        },
        sectionGap,
    )
    addBlock(
        listOf(
            StyledRun(
                ellipsize(profile, columnWidth) {
                    measureWidth(it, cqw(width, 1.22f), FontRole.BODY, 0f, measurer)
                },
                cqw(width, 1.22f),
                Palette.foreground(0.6f),
                FontRole.BODY,
                TextAlign.LEFT,
                0f,
            ),
        ),
        sectionGap,
    )
    addBlock(
        listOf(
            StyledRun(
                ellipsize(weather, columnWidth) {
                    measureWidth(it, cqw(width, 1.12f), FontRole.BODY, 0f, measurer)
                },
                cqw(width, 1.12f),
                Palette.foreground(0.45f),
                FontRole.BODY,
                TextAlign.LEFT,
                0f,
            ),
        ),
        0f,
    )
    var headerBottom = cursor
    if (design.showClock) {
        val (clockOps, clockBottom) = placeRuns(
            listOf(
                StyledRun(time, timeSize, Palette.foreground, FontRole.DISPLAY, TextAlign.RIGHT, 0f),
                StyledRun(date, dateSize, Palette.foreground(0.45f), FontRole.BODY, TextAlign.RIGHT, 0f),
            ),
            innerRight,
            innerTop,
            cqw(width, 0.35f),
            measurer,
        )
        headerOps += clockOps
        headerBottom = max(headerBottom, clockBottom)
    }
    ops += headerOps

    val dock = layoutAppStrip(design.apps, width, thin = false, vertical = false, measurer)
    val outerGap = cqw(width, 0.9f)
    val dockTop = innerBottom - dock.height
    val middleTop = headerBottom + outerGap
    val middleBottom = dockTop - outerGap
    val middle = layoutSalonRows(design, width, innerW, focusKey, ring, measurer)
    val viewportH = (middleBottom - middleTop).coerceAtLeast(0f)
    val focusedRow = middle.items.firstOrNull { it.key == focusKey }
    val yOffset = if (focusedRow != null && middle.height > viewportH) {
        offsetToReveal(focusedRow.box.top, focusedRow.box.bottom, viewportH, ring)
    } else {
        0f
    }
    val shiftY = middleTop - yOffset
    val middleClip = Box(innerLeft, middleTop, innerRight, middleBottom.coerceAtLeast(middleTop))
    ops += DrawOp.Group(
        middleClip,
        middle.ops.map { shiftOp(it, innerLeft, shiftY) },
    )
    items += middle.items.map { it.translate(innerLeft, shiftY) }

    val dockFocus = dock.items.firstOrNull { it.key == focusKey }
    val dockOffset = if (dockFocus != null && dock.width > innerW) {
        offsetToReveal(dockFocus.box.left, dockFocus.box.right, innerW, ring)
    } else {
        0f
    }
    val dockClip = Box(innerLeft, dockTop, innerRight, innerBottom).outset(cqw(width, 1.3f))
    ops += DrawOp.Group(
        dockClip,
        dock.ops.map { shiftOp(it, innerLeft - dockOffset, dockTop) },
    )
    items += dock.items.map { it.translate(innerLeft - dockOffset, dockTop) }
    return Scene(ops, items)
}

private fun layoutSalonRows(
    design: HomeDesign,
    screenW: Float,
    innerW: Float,
    focusKey: String?,
    ring: Float,
    measurer: TextMeasurer,
): Stack {
    if (design.rows.isEmpty()) {
        val size = cqw(screenW, 1.45f)
        val message = "İçerik sırası yok. Tasarımcıdan bir sıra ekleyin."
        val (ops, bottom) = placeRuns(
            listOf(
                StyledRun(
                    ellipsize(message, innerW) { measureWidth(it, size, FontRole.BODY, 0f, measurer) },
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
        return Stack(ops, emptyList(), innerW, bottom)
    }
    val ops = mutableListOf<DrawOp>()
    val items = mutableListOf<FocusItem>()
    var y = 0f
    val rowGap = cqw(screenW, 0.85f)
    design.rows.forEachIndexed { index, row ->
        val block = layoutCardRow(row, screenW, innerW, focusKey, ring, measurer)
        ops += block.ops.map { shiftOp(it, 0f, y) }
        items += block.items.map { it.translate(0f, y) }
        y += block.height
        if (index != design.rows.lastIndex) {
            y += rowGap
        }
    }
    return Stack(ops, items, innerW, y)
}

private fun layoutCardRow(
    row: ContentRow,
    screenW: Float,
    innerW: Float,
    focusKey: String?,
    ring: Float,
    measurer: TextMeasurer,
): Stack {
    val titleSize = cqw(screenW, 1.15f)
    val title = ellipsize(textOr(row.title, "Adsız sıra"), innerW) {
        measureWidth(it, titleSize, FontRole.BODY, 0f, measurer)
    }
    val (titleOps, titleBottom) = placeRuns(
        listOf(
            StyledRun(title, titleSize, Palette.foreground(0.7f), FontRole.BODY, TextAlign.LEFT, 0f),
        ),
        0f,
        0f,
        0f,
        measurer,
    )
    if (row.cards.isEmpty()) {
        val noteSize = cqw(screenW, 1.2f)
        val (noteOps, noteBottom) = placeRuns(
            listOf(
                StyledRun(
                    "Bu sırada kart yok.",
                    noteSize,
                    Palette.foreground(0.45f),
                    FontRole.BODY,
                    TextAlign.LEFT,
                    0f,
                ),
            ),
            0f,
            titleBottom + cqw(screenW, 0.55f),
            0f,
            measurer,
        )
        return Stack(titleOps + noteOps, emptyList(), innerW, noteBottom)
    }
    val gap = cqw(screenW, 0.9f)
    val cardsTop = titleBottom + cqw(screenW, 0.55f)
    var x = 0f
    val cardOps = mutableListOf<DrawOp>()
    val cardItems = mutableListOf<FocusItem>()
    var cardHeight = 0f
    for (card in row.cards) {
        val laid = layoutPosterCard(row.id, card, screenW, x, measurer)
        cardOps += laid.ops
        cardItems += laid.item
        cardHeight = max(cardHeight, laid.height)
        x += laid.width + gap
    }
    val contentW = (x - gap).coerceAtLeast(0f)
    val focused = cardItems.firstOrNull { it.key == focusKey }
    val offset = if (focused != null) {
        offsetToReveal(focused.box.left, focused.box.right, innerW, ring)
    } else {
        0f
    }
    val shiftedOps = cardOps.map { shiftOp(it, -offset, cardsTop) }
    val shiftedItems = cardItems.map { it.translate(-offset, cardsTop) }
    val clip = Box(-ring, cardsTop - ring, innerW + ring, cardsTop + cardHeight + ring)
    return Stack(
        ops = titleOps + DrawOp.Group(clip, shiftedOps),
        items = shiftedItems,
        width = contentW,
        height = cardsTop + cardHeight,
    )
}

private data class LaidCard(
    val ops: List<DrawOp>,
    val item: FocusItem,
    val width: Float,
    val height: Float,
)

private fun layoutPosterCard(
    rowId: String,
    card: ContentCard,
    screenW: Float,
    x: Float,
    measurer: TextMeasurer,
): LaidCard {
    val cardW = cqw(screenW, 14.8f)
    val posterH = cardW * 9f / 16f
    val radius = cqw(screenW, 1.2f)
    val titleSize = cardW * 0.09f
    val metaSize = cardW * 0.072f
    val textWidth = cardW * 0.88f
    val title = ellipsize(textOr(card.title, "Adsız kart"), textWidth) {
        measureWidth(it, titleSize, FontRole.BODY, 0f, measurer)
    }
    val meta = ellipsize(textOr(card.meta, "Bilgi yok"), textWidth) {
        measureWidth(it, metaSize, FontRole.BODY, 0f, measurer)
    }
    val poster = Box(x, 0f, x + cardW, posterH)
    val key = cardKey(rowId, card.id)
    val ops = listOf(
        DrawOp.Group(
            clip = null,
            children = listOf(
                DrawOp.Poster(poster, radius, card.id, title, meta),
            ),
            liftKey = key,
        ),
    )
    val height = posterH
    return LaidCard(
        ops = ops,
        item = FocusItem(key, poster, radius),
        width = cardW,
        height = height,
    )
}

private fun layoutAppStrip(
    apps: List<DockApp>,
    screenW: Float,
    thin: Boolean,
    vertical: Boolean,
    measurer: TextMeasurer,
): Stack {
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
    val gap = cqw(screenW, if (vertical) 0.85f else 1.45f)
    val chips = apps.mapIndexed { index, app ->
        layoutAppChip(app, screenW, thin, index < 2, measurer)
    }
    val ops = mutableListOf<DrawOp>()
    val items = mutableListOf<FocusItem>()
    var cursor = 0f
    val cross = chips.maxOf { chip -> if (vertical) chip.width else chip.height }
    chips.forEachIndexed { index, chip ->
        val extra = if (index == 1 && apps.size > 2) gap * 1.25f else 0f
        if (vertical) {
            val dx = (cross - chip.width) / 2f
            ops += chip.ops.map { shiftOp(it, dx, cursor) }
            items += chip.item.translate(dx, cursor)
            cursor += chip.height + gap + extra
        } else {
            val dy = cross - chip.height
            ops += chip.ops.map { shiftOp(it, cursor, dy) }
            items += chip.item.translate(cursor, dy)
            cursor += chip.width + gap + extra
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
    screenW: Float,
    thin: Boolean,
    lead: Boolean,
    measurer: TextMeasurer,
): Chip {
    val icon = cqw(
        screenW,
        when {
            thin && lead -> 4.7f
            thin -> 3.15f
            lead -> 6.7f
            else -> 4.15f
        },
    )
    val radius = icon * 0.3f
    val letterSize = icon * 0.36f
    val labelSize = cqw(screenW, if (lead && !thin) 1.18f else 1f)
    val gap = cqw(screenW, 0.42f)
    val labelMax = cqw(screenW, if (lead) 8.4f else 6.4f)
    val label = textOr(app.name, "Adsız")
    val shown = ellipsize(label, labelMax) {
        measureWidth(it, labelSize, FontRole.BODY, 0f, measurer)
    }
    val letter = label.take(1).uppercase(TURKISH).ifEmpty { "·" }
    val labelMetrics = measurer.measure(shown, labelSize, FontRole.BODY, 0f)
    val blockW = max(icon, labelMetrics.width)
    val iconLeft = (blockW - icon) / 2f
    val iconBox = Box(iconLeft, 0f, iconLeft + icon, icon)
    val key = appKey(app.id)
    val ops = listOf(
        DrawOp.Group(
            clip = null,
            children = listOf(
                DrawOp.Mark(
                    box = iconBox,
                    radius = radius,
                    kind = appMark(app),
                    letter = letter,
                    fill = app.colorId.swatch,
                    ink = app.colorId.ink,
                    letterSize = letterSize,
                ),
                DrawOp.Text(
                    text = shown,
                    x = blockW / 2f,
                    baseline = icon + gap + labelMetrics.ascent,
                    size = labelSize,
                    color = if (lead) Palette.foreground(0.9f) else Palette.foreground(0.5f),
                    role = FontRole.BODY,
                    align = TextAlign.CENTER,
                    trackingEm = 0f,
                ),
            ),
            liftKey = key,
        ),
    )
    val height = icon + gap + labelMetrics.height
    return Chip(
        ops = ops,
        item = FocusItem(key, iconBox, radius),
        width = blockW,
        height = height,
    )
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
    val dock = layoutAppStrip(design.apps, width, thin = true, vertical = true, measurer)
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
    val padX = cqw(width, 3f)
    val padY = cqw(width, 3.2f)
    val ops = mutableListOf<DrawOp>()
    val profile = textOr(design.profileName, "Ev")
    val eyebrow = "A 850 C · $profile".uppercase(TURKISH)
    val eyebrowSize = cqw(width, 1.2f)
    val eyebrowText = ellipsize(eyebrow, width - padX * 2) {
        measureWidth(it, eyebrowSize, FontRole.BODY, 0.16f, measurer)
    }
    val (topOps, topBottom) = placeRuns(
        listOf(
            StyledRun(
                eyebrowText,
                eyebrowSize,
                Palette.foreground(0.45f),
                FontRole.BODY,
                TextAlign.CENTER,
                0.16f,
            ),
        ),
        width / 2f,
        padY,
        0f,
        measurer,
    )
    ops += topOps
    val dock = layoutAppStrip(design.apps, width, thin = true, vertical = false, measurer)
    val dockTop = height - padY - dock.height
    val middleOps = mutableListOf<DrawOp>()
    var middleH = 0f
    val weather = textOr(design.weatherLine, "Hava satırı boş")
    val blockGap = cqw(width, 1f)
    if (design.showClock) {
        val timeSize = cqw(width, 15f)
        val dateSize = cqw(width, 1.15f)
        val (clockOps, clockBottom) = placeRuns(
            listOf(
                StyledRun(time, timeSize, Palette.foreground, FontRole.DISPLAY, TextAlign.CENTER, 0f),
                StyledRun(date, dateSize, Palette.foreground(0.45f), FontRole.BODY, TextAlign.CENTER, 0f),
            ),
            width / 2f,
            0f,
            cqw(width, 0.45f),
            measurer,
        )
        middleOps += clockOps
        middleH = clockBottom
        val greetSize = cqw(width, 2.8f)
        val greet = ellipsize(textOr(design.greeting, "İyi akşamlar"), width - padX * 2) {
            measureWidth(it, greetSize, FontRole.DISPLAY, 0f, measurer)
        }
        val (greetOps, greetBottom) = placeRuns(
            listOf(StyledRun(greet, greetSize, Palette.foreground, FontRole.DISPLAY, TextAlign.CENTER, 0f)),
            width / 2f,
            middleH + blockGap,
            0f,
            measurer,
        )
        middleOps += greetOps
        middleH = greetBottom
    } else {
        val greetSize = cqw(width, 8f)
        val greet = ellipsize(textOr(design.greeting, "İyi akşamlar"), width - padX * 2) {
            measureWidth(it, greetSize, FontRole.DISPLAY, 0f, measurer)
        }
        val (greetOps, greetBottom) = placeRuns(
            listOf(StyledRun(greet, greetSize, Palette.foreground, FontRole.DISPLAY, TextAlign.CENTER, 0f)),
            width / 2f,
            0f,
            0f,
            measurer,
        )
        middleOps += greetOps
        middleH = greetBottom
        val (hiddenOps, hiddenBottom) = placeRuns(
            listOf(
                StyledRun(
                    "Saat gizli.",
                    cqw(width, 1.5f),
                    Palette.foreground(0.7f),
                    FontRole.BODY,
                    TextAlign.CENTER,
                    0f,
                ),
            ),
            width / 2f,
            middleH + blockGap,
            0f,
            measurer,
        )
        middleOps += hiddenOps
        middleH = hiddenBottom
    }
    val weatherSize = cqw(width, 1.5f)
    val weatherText = ellipsize(weather, width - padX * 2) {
        measureWidth(it, weatherSize, FontRole.BODY, 0f, measurer)
    }
    val (weatherOps, weatherBottom) = placeRuns(
        listOf(
            StyledRun(
                weatherText,
                weatherSize,
                Palette.foreground(0.75f),
                FontRole.BODY,
                TextAlign.CENTER,
                0f,
            ),
        ),
        width / 2f,
        middleH + blockGap,
        0f,
        measurer,
    )
    middleOps += weatherOps
    middleH = weatherBottom
    val freeTop = topBottom
    val freeBottom = dockTop - cqw(width, 1.2f)
    val middleTop = freeTop + ((freeBottom - freeTop - middleH).coerceAtLeast(0f) / 2f)
    ops += middleOps.map { shiftOp(it, 0f, middleTop) }

    val available = width - padX * 2
    val dockFocus = dock.items.firstOrNull { it.key == focusKey }
    val offset = if (dockFocus != null && dock.width > available) {
        offsetToReveal(dockFocus.box.left, dockFocus.box.right, available, cqw(width, 0.4f))
    } else {
        0f
    }
    val originX = if (dock.width <= available && offset == 0f) {
        padX + (available - dock.width) / 2f
    } else {
        padX - offset
    }
    val viewport = Box(padX, dockTop, width - padX, height - padY).outset(cqw(width, 1.2f))
    ops += DrawOp.Group(viewport, dock.ops.map { shiftOp(it, originX, dockTop) })
    val items = dock.items.map { it.translate(originX, dockTop) }
    return Scene(ops, items)
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
