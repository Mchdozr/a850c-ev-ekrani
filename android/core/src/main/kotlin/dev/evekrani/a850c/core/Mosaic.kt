package dev.evekrani.a850c.core

data class MosaicSlot(
    val app: DockApp,
    val column: Int,
    val row: Int,
    val tall: Boolean,
    val featured: Boolean,
)

private data class Place(val column: Int, val row: Int)

private val smallPlaces = listOf(
    Place(3, 1),
    Place(2, 2),
    Place(4, 1),
    Place(3, 2),
    Place(4, 2),
)

fun mosaicSlots(apps: List<DockApp>): List<MosaicSlot> {
    val netflix = apps.firstOrNull { appMark(it) == AppMark.NETFLIX }
    val youtube = apps.firstOrNull { appMark(it) == AppMark.YOUTUBE }
    val rest = apps.filter { it != netflix && it != youtube }
    if (netflix == null && youtube == null) {
        return apps.mapIndexed { index, app ->
            MosaicSlot(
                app = app,
                column = (index % 4) + 1,
                row = index / 4 + 1,
                tall = false,
                featured = false,
            )
        }
    }
    val slots = mutableListOf<MosaicSlot>()
    var lead = 1
    if (youtube != null) {
        slots += MosaicSlot(youtube, column = lead, row = 1, tall = false, featured = true)
        lead += 1
    }
    if (netflix != null) {
        slots += MosaicSlot(netflix, column = lead, row = 1, tall = false, featured = true)
    }
    rest.forEachIndexed { index, app ->
        if (netflix != null && youtube != null && index < 4) {
            slots += MosaicSlot(app, column = index + 1, row = 2, tall = false, featured = false)
        } else {
            val placed = smallPlaces.getOrNull(index)
            if (placed != null && netflix == null) {
                slots += MosaicSlot(app, placed.column, placed.row, tall = false, featured = false)
            } else {
                val column = (index % 4) + 1
                val row = index / 4 + 2
                slots += MosaicSlot(app, column, row, tall = false, featured = false)
            }
        }
    }
    return slots
}

fun tileFill(app: DockApp, tiles: TileStyle, logo: LogoColor): Int {
    if (tiles == TileStyle.SADE) {
        return 0xF22A2A2E.toInt()
    }
    if (logo == LogoColor.TEK) {
        return 0xFFF4F4F5.toInt()
    }
    return when (appMark(app)) {
        AppMark.YOUTUBE -> 0xFFFFFFFF.toInt()
        AppMark.NETFLIX -> 0xFFFFFFFF.toInt()
        AppMark.DISNEY -> 0xFF1236C9.toInt()
        AppMark.BLUTV -> 0xFF0A4DFF.toInt()
        AppMark.TABII -> 0xFF0E8F62.toInt()
        AppMark.AYARLAR -> 0xFF3A3A3E.toInt()
        AppMark.LETTER -> app.colorId.swatch
    }
}

fun tileInk(fill: Int): Int {
    val red = (fill shr 16) and 0xFF
    val green = (fill shr 8) and 0xFF
    val blue = fill and 0xFF
    val luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue
    return if (luma > 160.0) 0xFF141414.toInt() else 0xFFFFFFFF.toInt()
}

fun glyphInk(app: DockApp, tiles: TileStyle, logo: LogoColor): Int {
    val plate = tileInk(tileFill(app, tiles, logo))
    if (logo == LogoColor.TEK) {
        return plate
    }
    if (tiles == TileStyle.SADE) {
        return when (appMark(app)) {
            AppMark.YOUTUBE -> 0xFFFF0000.toInt()
            AppMark.NETFLIX -> 0xFFE50914.toInt()
            AppMark.DISNEY -> 0xFF8EB6FF.toInt()
            AppMark.BLUTV -> 0xFFB9D4FF.toInt()
            AppMark.TABII -> 0xFF7DFFC3.toInt()
            AppMark.AYARLAR -> 0xFFF4F4F6.toInt()
            AppMark.LETTER -> app.colorId.ink
        }
    }
    return when (appMark(app)) {
        AppMark.YOUTUBE -> 0xFFFF0000.toInt()
        AppMark.NETFLIX -> 0xFFE50914.toInt()
        AppMark.DISNEY, AppMark.BLUTV, AppMark.TABII, AppMark.AYARLAR -> 0xFFFFFFFF.toInt()
        AppMark.LETTER -> app.colorId.ink
    }
}
