package dev.evekrani.a850c.core

enum class FontRole {
    DISPLAY,
    BODY,
}

enum class TextAlign {
    LEFT,
    CENTER,
    RIGHT,
}

data class TextMetrics(
    val width: Float,
    val ascent: Float,
    val descent: Float,
) {
    val height: Float get() = ascent + descent
}

fun interface TextMeasurer {
    fun measure(text: String, size: Float, role: FontRole, trackingEm: Float): TextMetrics
}

data class StyledRun(
    val text: String,
    val size: Float,
    val color: Int,
    val role: FontRole,
    val align: TextAlign,
    val trackingEm: Float = 0f,
)

fun ellipsize(text: String, maxWidth: Float, measure: (String) -> Float): String {
    if (text.isEmpty() || measure(text) <= maxWidth) {
        return text
    }
    val ellipsis = "…"
    var end = text.length
    while (end > 0) {
        val candidate = text.substring(0, end).trimEnd() + ellipsis
        if (measure(candidate) <= maxWidth) {
            return candidate
        }
        end -= 1
    }
    return ellipsis
}

fun wrapText(
    text: String,
    maxWidth: Float,
    maxLines: Int,
    measure: (String) -> Float,
): List<String> {
    if (maxLines <= 0) {
        return emptyList()
    }
    val words = text.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }
    if (words.isEmpty()) {
        return emptyList()
    }
    val lines = mutableListOf<String>()
    var index = 0
    while (index < words.size && lines.size < maxLines) {
        if (lines.size == maxLines - 1) {
            lines.add(ellipsize(words.subList(index, words.size).joinToString(" "), maxWidth, measure))
            break
        }
        if (measure(words[index]) > maxWidth) {
            lines.add(ellipsize(words[index], maxWidth, measure))
            index += 1
            continue
        }
        var end = index
        var current = words[index]
        while (end + 1 < words.size) {
            val candidate = words.subList(index, end + 2).joinToString(" ")
            if (measure(candidate) > maxWidth) {
                break
            }
            end += 1
            current = candidate
        }
        lines.add(current)
        index = end + 1
    }
    return lines
}

fun placeRuns(
    runs: List<StyledRun>,
    x: Float,
    top: Float,
    gap: Float,
    measurer: TextMeasurer,
): Pair<List<DrawOp>, Float> {
    if (runs.isEmpty()) {
        return emptyList<DrawOp>() to top
    }
    val ops = mutableListOf<DrawOp>()
    var cursor = top
    runs.forEachIndexed { index, run ->
        val metrics = measurer.measure(run.text, run.size, run.role, run.trackingEm)
        ops.add(
            DrawOp.Text(
                text = run.text,
                x = x,
                baseline = cursor + metrics.ascent,
                size = run.size,
                color = run.color,
                role = run.role,
                align = run.align,
                trackingEm = run.trackingEm,
            ),
        )
        cursor += metrics.height
        if (index != runs.lastIndex) {
            cursor += gap
        }
    }
    return ops to cursor
}
