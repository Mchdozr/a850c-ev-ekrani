package dev.evekrani.a850c.core

data class Box(
    val left: Float,
    val top: Float,
    val right: Float,
    val bottom: Float,
) {
    val width: Float get() = right - left
    val height: Float get() = bottom - top

    fun translate(dx: Float, dy: Float): Box = Box(left + dx, top + dy, right + dx, bottom + dy)

    fun inset(amount: Float): Box = Box(left + amount, top + amount, right - amount, bottom - amount)

    fun outset(amount: Float): Box = Box(left - amount, top - amount, right + amount, bottom + amount)
}

data class FocusItem(
    val key: String,
    val box: Box,
    val radius: Float,
) {
    fun translate(dx: Float, dy: Float): FocusItem = copy(box = box.translate(dx, dy))
}

sealed interface DrawOp {
    data class RoundRect(
        val box: Box,
        val color: Int,
        val radius: Float,
        val strokeColor: Int = 0,
        val strokeWidth: Float = 0f,
    ) : DrawOp

    data class Poster(
        val box: Box,
        val radius: Float,
        val cardId: String,
        val title: String = "",
        val meta: String = "",
    ) : DrawOp

    data class Mark(
        val box: Box,
        val radius: Float,
        val kind: AppMark,
        val letter: String,
        val fill: Int,
        val ink: Int,
        val letterSize: Float,
        val glyphOnly: Boolean = false,
    ) : DrawOp

    data class Text(
        val text: String,
        val x: Float,
        val baseline: Float,
        val size: Float,
        val color: Int,
        val role: FontRole,
        val align: TextAlign,
        val trackingEm: Float,
    ) : DrawOp

    data class Group(
        val clip: Box?,
        val children: List<DrawOp>,
        val liftKey: String? = null,
    ) : DrawOp
}

data class Scene(
    val ops: List<DrawOp>,
    val items: List<FocusItem>,
)

fun shiftOp(op: DrawOp, dx: Float, dy: Float): DrawOp {
    return when (op) {
        is DrawOp.RoundRect -> op.copy(box = op.box.translate(dx, dy))
        is DrawOp.Poster -> op.copy(box = op.box.translate(dx, dy))
        is DrawOp.Mark -> op.copy(box = op.box.translate(dx, dy))
        is DrawOp.Text -> op.copy(x = op.x + dx, baseline = op.baseline + dy)
        is DrawOp.Group -> op.copy(
            clip = op.clip?.translate(dx, dy),
            children = op.children.map { shiftOp(it, dx, dy) },
        )
    }
}

fun offsetToReveal(itemStart: Float, itemEnd: Float, viewport: Float, pad: Float = 0f): Float {
    if (viewport <= 0f) {
        return 0f
    }
    val start = itemStart - pad
    val end = itemEnd + pad
    if (end <= viewport && start >= 0f) {
        return 0f
    }
    val alignEnd = end - viewport
    val alignStart = start.coerceAtLeast(0f)
    return alignEnd.coerceAtLeast(0f).coerceAtMost(alignStart)
}
