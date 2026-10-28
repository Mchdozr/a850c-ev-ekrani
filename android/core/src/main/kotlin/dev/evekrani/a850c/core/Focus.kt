package dev.evekrani.a850c.core

enum class Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT,
}

sealed class FocusTarget {
    data class App(val appId: String) : FocusTarget()

    data class Card(val rowId: String, val cardId: String) : FocusTarget()

    data class Hero(val rowId: String, val cardId: String) : FocusTarget()
}

sealed class FocusMap {
    data class Rows(val rows: List<List<String>>) : FocusMap()

    data class Columns(val columns: List<List<String>>) : FocusMap()
}

fun appKey(id: String): String = "app:$id"

fun cardKey(rowId: String, cardId: String): String = "card:$rowId:$cardId"

fun heroKey(rowId: String, cardId: String): String = "hero:$rowId:$cardId"

fun parseFocusKey(key: String): FocusTarget? {
    val parts = key.split(":")
    val kind = parts.getOrNull(0) ?: return null
    val first = parts.getOrNull(1) ?: return null
    if (first.isEmpty()) {
        return null
    }
    return when (kind) {
        "app" -> if (parts.size == 2) FocusTarget.App(first) else null
        "card" -> {
            val second = parts.getOrNull(2)
            if (parts.size == 3 && !second.isNullOrEmpty()) {
                FocusTarget.Card(first, second)
            } else {
                null
            }
        }
        "hero" -> {
            val second = parts.getOrNull(2)
            if (parts.size == 3 && !second.isNullOrEmpty()) {
                FocusTarget.Hero(first, second)
            } else {
                null
            }
        }
        else -> null
    }
}

fun buildFocusMap(design: HomeDesign): FocusMap {
    return when (design.layout) {
        LayoutId.MOZAIK -> FocusMap.Rows(mosaicRows(design))
        LayoutId.SALON -> FocusMap.Rows(salonRows(design))
        LayoutId.SINEMA -> FocusMap.Columns(sinemaColumns(design))
        LayoutId.SAAT -> FocusMap.Rows(
            if (design.apps.isNotEmpty()) {
                listOf(design.apps.map { appKey(it.id) })
            } else {
                emptyList()
            },
        )
    }
}

fun firstFocusKey(map: FocusMap): String? {
    return when (map) {
        is FocusMap.Rows -> map.rows.firstOrNull { it.isNotEmpty() }?.firstOrNull()
        is FocusMap.Columns -> map.columns.firstOrNull { it.isNotEmpty() }?.firstOrNull()
    }
}

fun focusMapHas(map: FocusMap, key: String): Boolean {
    return when (map) {
        is FocusMap.Rows -> map.rows.any { key in it }
        is FocusMap.Columns -> map.columns.any { key in it }
    }
}

fun moveFocus(map: FocusMap, current: String?, direction: Direction): String? {
    return when (map) {
        is FocusMap.Rows -> moveRows(map.rows, current, direction)
        is FocusMap.Columns -> moveColumns(map.columns, current, direction)
    }
}

fun focusTitle(design: HomeDesign, key: String): String {
    return when (val target = parseFocusKey(key)) {
        null -> "Seçim"
        is FocusTarget.App ->
            design.apps.firstOrNull { it.id == target.appId }?.name?.trim().orEmpty()
                .ifEmpty { "Adsız uygulama" }
        is FocusTarget.Card -> cardTitle(design, target.rowId, target.cardId)
        is FocusTarget.Hero -> cardTitle(design, target.rowId, target.cardId)
    }
}

private fun cardTitle(design: HomeDesign, rowId: String, cardId: String): String {
    val row = design.rows.firstOrNull { it.id == rowId }
    return row?.cards?.firstOrNull { it.id == cardId }?.title?.trim().orEmpty().ifEmpty { "Adsız kart" }
}

fun focusKindLabel(key: String): String {
    val target = parseFocusKey(key) ?: return "Öge"
    return when (target) {
        is FocusTarget.App -> "Uygulama"
        is FocusTarget.Card -> "İçerik kartı"
        is FocusTarget.Hero -> "Afiş"
    }
}

fun selectionCaption(key: String): String {
    return "${focusKindLabel(key)}. Bu yalnızca seçilen adı gösterir. Uygulama açılmaz."
}

private fun mosaicRows(design: HomeDesign): List<List<String>> {
    val grouped = linkedMapOf<Int, MutableList<Pair<Int, String>>>()
    for (slot in mosaicSlots(design.apps)) {
        val row = grouped.getOrPut(slot.row) { mutableListOf() }
        row += slot.column to appKey(slot.app.id)
    }
    return grouped.toSortedMap().values.map { row ->
        row.sortedBy { it.first }.map { it.second }
    }
}

private fun mosaicColumns(design: HomeDesign): List<List<String>> {
    val grouped = linkedMapOf<Int, MutableList<Pair<Int, String>>>()
    for (slot in mosaicSlots(design.apps)) {
        val column = grouped.getOrPut(slot.column) { mutableListOf() }
        column += slot.row to appKey(slot.app.id)
    }
    return grouped.toSortedMap().values.map { column ->
        column.sortedBy { it.first }.map { it.second }
    }
}

private fun salonRows(design: HomeDesign): List<List<String>> =
    if (design.apps.isEmpty()) emptyList() else listOf(design.apps.map { appKey(it.id) })

private fun sinemaColumns(design: HomeDesign): List<List<String>> {
    val cards = design.rows.flatMap { row ->
        row.cards.map { card -> row.id to card.id }
    }
    val columns = mutableListOf<List<String>>()
    val hero = cards.firstOrNull()
    if (hero != null) {
        columns.add(listOf(heroKey(hero.first, hero.second)))
    }
    val side = cards.drop(1).map { cardKey(it.first, it.second) }
    if (side.isNotEmpty()) {
        columns.add(side)
    }
    if (design.apps.isNotEmpty()) {
        columns.add(design.apps.map { appKey(it.id) })
    }
    return columns
}

private fun moveRows(
    rows: List<List<String>>,
    current: String?,
    direction: Direction,
): String? {
    val filled = rows.filter { it.isNotEmpty() }
    if (filled.isEmpty()) {
        return null
    }
    var rowIndex = 0
    var columnIndex = 0
    var found = false
    if (current != null) {
        for (index in filled.indices) {
            val column = filled[index].indexOf(current)
            if (column >= 0) {
                rowIndex = index
                columnIndex = column
                found = true
                break
            }
        }
    }
    if (!found) {
        return filled.firstOrNull()?.firstOrNull()
    }
    val row = filled[rowIndex]
    return when (direction) {
        Direction.LEFT -> row[(columnIndex - 1).coerceAtLeast(0)]
        Direction.RIGHT -> row[(columnIndex + 1).coerceAtMost(row.lastIndex)]
        Direction.UP -> {
            val next = filled[(rowIndex - 1).coerceAtLeast(0)]
            next[columnIndex.coerceAtMost(next.lastIndex)]
        }
        Direction.DOWN -> {
            val next = filled[(rowIndex + 1).coerceAtMost(filled.lastIndex)]
            next[columnIndex.coerceAtMost(next.lastIndex)]
        }
    }
}

private fun moveColumns(
    columns: List<List<String>>,
    current: String?,
    direction: Direction,
): String? {
    val filled = columns.filter { it.isNotEmpty() }
    if (filled.isEmpty()) {
        return null
    }
    var columnIndex = 0
    var rowIndex = 0
    var found = false
    if (current != null) {
        for (index in filled.indices) {
            val row = filled[index].indexOf(current)
            if (row >= 0) {
                columnIndex = index
                rowIndex = row
                found = true
                break
            }
        }
    }
    if (!found) {
        return filled.firstOrNull()?.firstOrNull()
    }
    val column = filled[columnIndex]
    return when (direction) {
        Direction.UP -> column[(rowIndex - 1).coerceAtLeast(0)]
        Direction.DOWN -> column[(rowIndex + 1).coerceAtMost(column.lastIndex)]
        Direction.LEFT -> {
            val next = filled[(columnIndex - 1).coerceAtLeast(0)]
            next[rowIndex.coerceAtMost(next.lastIndex)]
        }
        Direction.RIGHT -> {
            val next = filled[(columnIndex + 1).coerceAtMost(filled.lastIndex)]
            next[rowIndex.coerceAtMost(next.lastIndex)]
        }
    }
}
