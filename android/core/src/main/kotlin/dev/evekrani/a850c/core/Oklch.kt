package dev.evekrani.a850c.core

import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sin

object Oklch {
    fun argb(
        lightness: Double,
        chroma: Double,
        hueDegrees: Double,
        alpha: Double = 1.0,
    ): Int {
        val hue = Math.toRadians(hueDegrees)
        val a = chroma * cos(hue)
        val b = chroma * sin(hue)
        val lCube = cube(lightness + 0.3963377774 * a + 0.2158037573 * b)
        val mCube = cube(lightness - 0.1055613458 * a - 0.0638541728 * b)
        val sCube = cube(lightness - 0.0894841775 * a - 1.2914855480 * b)
        val red = gamma(+4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube)
        val green = gamma(-1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube)
        val blue = gamma(-0.0041960863 * lCube - 0.7034186147 * mCube + 1.7076147010 * sCube)
        val alphaByte = (alpha.coerceIn(0.0, 1.0) * 255.0).roundToInt().coerceIn(0, 255)
        return (alphaByte shl 24) or (red shl 16) or (green shl 8) or blue
    }

    private fun cube(value: Double): Double = value * value * value

    private fun gamma(channel: Double): Int {
        val clamped = channel.coerceIn(0.0, 1.0)
        val encoded = if (clamped <= 0.0031308) {
            12.92 * clamped
        } else {
            1.055 * clamped.pow(1.0 / 2.4) - 0.055
        }
        return (encoded.coerceIn(0.0, 1.0) * 255.0).roundToInt().coerceIn(0, 255)
    }
}

fun posterStops(id: String): Pair<Int, Int> {
    var hash = 0L
    for (char in id) {
        hash = (hash * 31 + char.code.toLong()) and 0xFFFF_FFFFL
    }
    val hue = (hash % 360).toDouble()
    val light = 0.34 + (hash % 5).toDouble() / 50.0
    return Oklch.argb(light, 0.08, hue) to Oklch.argb(0.16, 0.03, hue)
}
