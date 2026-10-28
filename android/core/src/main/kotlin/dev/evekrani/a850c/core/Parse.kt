package dev.evekrani.a850c.core

import kotlin.math.roundToInt
import org.json.JSONArray
import org.json.JSONObject

class DesignParseException(message: String) : IllegalArgumentException(message)

private val idPattern = Regex("^[\\w-]{1,80}$")
private val jpegPattern = Regex("^data:image/jpeg;base64,[A-Za-z0-9+/=]+$")

fun parseDesign(input: String): HomeDesign {
    val text = input.removePrefix("\uFEFF").trim()
    if (text.length > Limits.fileChars) {
        throw DesignParseException("Dosya çok büyük.")
    }
    val json = try {
        JSONObject(text)
    } catch (_: Exception) {
        throw DesignParseException("Dosya bir tasarım nesnesi değil.")
    }
    return parseDesign(json)
}

fun parseDesign(input: JSONObject): HomeDesign {
    val version = input.opt("version")
    val versionOk = when (version) {
        is Int -> version == 1
        is Long -> version == 1L
        is Double -> version == 1.0
        else -> false
    }
    if (!versionOk) {
        throw DesignParseException("Bu dosyanın sürümü desteklenmiyor. Sürüm 1 bekleniyor.")
    }
    val layoutWire = input.opt("layout")
    val layout = if (layoutWire is String) LayoutId.fromWire(layoutWire) else null
    if (layout == null) {
        throw DesignParseException("Düzen mozaik, salon, sinema veya saat olmalı.")
    }
    val showClock = input.opt("showClock")
    if (showClock !is Boolean) {
        throw DesignParseException("Saat görünürlüğü açık ya da kapalı olmalı.")
    }
    val lampRaw = input.opt("lamp")
    if (lampRaw !is Number) {
        throw DesignParseException("Lamba yoğunluğu 0 ile 100 arasında olmalı.")
    }
    val lamp = lampRaw.toDouble()
    if (!lamp.isFinite() || lamp < 0.0 || lamp > 100.0) {
        throw DesignParseException("Lamba yoğunluğu 0 ile 100 arasında olmalı.")
    }
    val appsValue = input.opt("apps")
    val rowsValue = input.opt("rows")
    if (appsValue !is JSONArray || rowsValue !is JSONArray) {
        throw DesignParseException("Uygulamalar ve içerik sıraları liste olmalı.")
    }
    if (appsValue.length() > Limits.apps) {
        throw DesignParseException("En fazla ${Limits.apps} uygulama olabilir.")
    }
    if (rowsValue.length() > Limits.rows) {
        throw DesignParseException("En fazla ${Limits.rows} içerik sırası olabilir.")
    }
    val seen = mutableSetOf<String>()
    val apps = buildList {
        for (index in 0 until appsValue.length()) {
            add(parseApp(appsValue.opt(index), seen))
        }
    }
    val rows = buildList {
        for (index in 0 until rowsValue.length()) {
            add(parseRow(rowsValue.opt(index), seen))
        }
    }
    return HomeDesign(
        version = 1,
        layout = layout,
        greeting = parseText(input.opt("greeting"), "Karşılama", Limits.greeting),
        profileName = parseText(input.opt("profileName"), "Profil adı", Limits.profileName),
        weatherLine = parseText(input.opt("weatherLine"), "Hava satırı", Limits.weatherLine),
        showClock = showClock,
        lamp = lamp.roundToInt(),
        wallpaper = parseWallpaper(input.opt("wallpaper")),
        tiles = parseOptional(input, "tiles", TileStyle::fromWire, TileStyle.MARKA, "Karolar marka veya sade olmalı."),
        labels = parseOptional(
            input,
            "labels",
            LabelMode::fromWire,
            LabelMode.LOGO_AD,
            "Etiketler logo ve ad, yalnız logo veya yalnız ad olmalı.",
        ),
        logoColor = parseOptional(
            input,
            "logoColor",
            LogoColor::fromWire,
            LogoColor.MARKA,
            "Logo rengi marka veya tek renk olmalı.",
        ),
        fontStyle = parseOptional(
            input,
            "fontStyle",
            FontStyle::fromWire,
            FontStyle.MODERN,
            "Yazı tipi modern veya yumuşak olmalı.",
        ),
        apps = apps,
        rows = rows,
    )
}

private fun <T> parseOptional(
    input: JSONObject,
    key: String,
    parse: (String) -> T?,
    fallback: T,
    error: String,
): T {
    if (!input.has(key) || input.isNull(key)) {
        return fallback
    }
    val raw = input.opt(key)
    val parsed = if (raw is String) parse(raw) else null
    return parsed ?: throw DesignParseException(error)
}

private fun parseText(value: Any?, field: String, max: Int): String {
    if (value !is String) {
        throw DesignParseException("$field metin olmalı.")
    }
    if (value.length > max) {
        throw DesignParseException("$field en fazla $max karakter olabilir.")
    }
    return value
}

private fun parseId(value: Any?, field: String, seen: MutableSet<String>): String {
    if (value !is String || !idPattern.matches(value)) {
        throw DesignParseException("$field kimliği geçersiz.")
    }
    if (!seen.add(value)) {
        throw DesignParseException("$field kimliği yineleniyor.")
    }
    return value
}

private fun parseWallpaper(value: Any?): Wallpaper {
    if (value !is JSONObject) {
        throw DesignParseException("Duvar kâğıdı eksik.")
    }
    return when (val type = value.opt("type")) {
        "preset" -> {
            val preset = value.opt("presetId")
            val id = if (preset is String) WallpaperPresetId.fromWire(preset) else null
            if (id == null) {
                throw DesignParseException(
                    "Duvar kâğıdı hazır bahçelerden biri olmalı.",
                )
            }
            Wallpaper.Preset(id)
        }
        "image" -> {
            val dataUrl = value.opt("dataUrl")
            if (dataUrl !is String || !jpegPattern.matches(dataUrl)) {
                throw DesignParseException("Görsel duvar kâğıdı sıkıştırılmış JPEG olmalı.")
            }
            if (dataUrl.length > Limits.imageChars) {
                throw DesignParseException("Görsel duvar kâğıdı çok büyük.")
            }
            Wallpaper.Image(
                dataUrl = dataUrl,
                name = parseText(value.opt("name"), "Görsel adı", Limits.imageName),
            )
        }
        else -> throw DesignParseException("Duvar kâğıdı hazır renk ya da görsel olmalı.")
    }
}

private fun parseApp(value: Any?, seen: MutableSet<String>): DockApp {
    if (value !is JSONObject) {
        throw DesignParseException("Uygulama kaydı bozuk.")
    }
    val colorWire = value.opt("colorId")
    val color = if (colorWire is String) AppColorId.fromWire(colorWire) else null
    if (color == null) {
        throw DesignParseException("Uygulama rengi hazır paletten seçilmeli.")
    }
    return DockApp(
        id = parseId(value.opt("id"), "Uygulama", seen),
        name = parseText(value.opt("name"), "Uygulama adı", Limits.appName),
        colorId = color,
    )
}

private fun parseCard(value: Any?, seen: MutableSet<String>): ContentCard {
    if (value !is JSONObject) {
        throw DesignParseException("Kart kaydı bozuk.")
    }
    return ContentCard(
        id = parseId(value.opt("id"), "Kart", seen),
        title = parseText(value.opt("title"), "Kart başlığı", Limits.cardTitle),
        meta = parseText(value.opt("meta"), "Kart bilgisi", Limits.cardMeta),
    )
}

private fun parseRow(value: Any?, seen: MutableSet<String>): ContentRow {
    if (value !is JSONObject) {
        throw DesignParseException("İçerik sırası bozuk.")
    }
    val cardsValue = value.opt("cards")
    if (cardsValue !is JSONArray) {
        throw DesignParseException("İçerik sırası bozuk.")
    }
    if (cardsValue.length() > Limits.cards) {
        throw DesignParseException("Bir sırada en fazla ${Limits.cards} kart olabilir.")
    }
    val cards = buildList {
        for (index in 0 until cardsValue.length()) {
            add(parseCard(cardsValue.opt(index), seen))
        }
    }
    return ContentRow(
        id = parseId(value.opt("id"), "Sıra", seen),
        title = parseText(value.opt("title"), "Sıra başlığı", Limits.rowTitle),
        cards = cards,
    )
}
