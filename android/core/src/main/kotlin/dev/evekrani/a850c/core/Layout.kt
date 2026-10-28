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
