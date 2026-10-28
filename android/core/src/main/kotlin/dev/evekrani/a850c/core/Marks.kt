package dev.evekrani.a850c.core

enum class AppMark {
    YOUTUBE,
    NETFLIX,
    DISNEY,
    BLUTV,
    TABII,
    AYARLAR,
    LETTER,
}

fun appMark(app: DockApp): AppMark {
    val haystack = "${app.id} ${app.name}".lowercase(TURKISH)
    return when {
        "youtube" in haystack -> AppMark.YOUTUBE
        "netflix" in haystack -> AppMark.NETFLIX
        "disney" in haystack -> AppMark.DISNEY
        "blutv" in haystack || "blu tv" in haystack -> AppMark.BLUTV
        "tabii" in haystack -> AppMark.TABII
        "ayarlar" in haystack || "settings" in haystack -> AppMark.AYARLAR
        else -> AppMark.LETTER
    }
}

fun focusKeyForMark(design: HomeDesign, mark: AppMark): String? {
    if (mark == AppMark.LETTER) {
        return null
    }
    val app = design.apps.firstOrNull { appMark(it) == mark } ?: return null
    val key = appKey(app.id)
    return if (focusMapHas(buildFocusMap(design), key)) key else null
}
