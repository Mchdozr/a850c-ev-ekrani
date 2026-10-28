package dev.evekrani.a850c.core

import kotlin.math.roundToInt

enum class LayoutId(val wire: String) {
    MOZAIK("mozaik"),
    SALON("salon"),
    SINEMA("sinema"),
    SAAT("saat"),
    ;

    companion object {
        fun fromWire(value: String): LayoutId? = entries.firstOrNull { it.wire == value }
    }
}

enum class TileStyle(val wire: String) {
    MARKA("marka"),
    SADE("sade"),
    ;

    companion object {
        fun fromWire(value: String): TileStyle? = entries.firstOrNull { it.wire == value }
    }
}

enum class LabelMode(val wire: String) {
    LOGO_AD("logo-ad"),
    LOGO("logo"),
    AD("ad"),
    ;

    companion object {
        fun fromWire(value: String): LabelMode? = entries.firstOrNull { it.wire == value }
    }
}

enum class LogoColor(val wire: String) {
    MARKA("marka"),
    TEK("tek"),
    ;

    companion object {
        fun fromWire(value: String): LogoColor? = entries.firstOrNull { it.wire == value }
    }
}

enum class FontStyle(val wire: String) {
    MODERN("modern"),
    YUMUSAK("yumusak"),
    ;

    companion object {
        fun fromWire(value: String): FontStyle? = entries.firstOrNull { it.wire == value }
    }
}

enum class WallpaperPresetId(val wire: String) {
    ISTANBUL_AKSAM("istanbul-aksam"),
    SONBAHAR_BAHCE("sonbahar-bahce"),
    SIYAH("siyah"),
    BAKIR_LAMBA("bakir-lamba"),
    GECE_CAM("gece-cam"),
    SOMINE("somine"),
    ZEYTIN_GECE("zeytin-gece"),
    KIS_AKSAMI("kis-aksami"),
    ;

    companion object {
        fun fromWire(value: String): WallpaperPresetId? =
            entries.firstOrNull { it.wire == value }
    }
}

enum class AppColorId(
    val wire: String,
    val swatch: Int,
    val ink: Int,
) {
    BAKIR("bakir", Oklch.argb(0.62, 0.12, 55.0), Oklch.argb(0.97, 0.02, 85.0)),
    AMBER("amber", Oklch.argb(0.78, 0.13, 78.0), Oklch.argb(0.22, 0.04, 50.0)),
    KREM("krem", Oklch.argb(0.9, 0.03, 85.0), Oklch.argb(0.24, 0.03, 50.0)),
    ZEYTIN("zeytin", Oklch.argb(0.52, 0.06, 115.0), Oklch.argb(0.96, 0.02, 90.0)),
    BORDO("bordo", Oklch.argb(0.57, 0.22, 27.0), Oklch.argb(0.98, 0.005, 260.0)),
    GECE("gece", Oklch.argb(0.18, 0.02, 260.0), Oklch.argb(0.97, 0.005, 260.0)),
    TAS("tas", Oklch.argb(0.68, 0.02, 70.0), Oklch.argb(0.18, 0.02, 45.0)),
    ;

    companion object {
        fun fromWire(value: String): AppColorId? = entries.firstOrNull { it.wire == value }
    }
}

sealed class Wallpaper {
    data class Preset(val presetId: WallpaperPresetId) : Wallpaper()

    data class Image(val dataUrl: String, val name: String) : Wallpaper()
}

data class DockApp(
    val id: String,
    val name: String,
    val colorId: AppColorId,
)

data class ContentCard(
    val id: String,
    val title: String,
    val meta: String,
)

data class ContentRow(
    val id: String,
    val title: String,
    val cards: List<ContentCard>,
)

data class HomeDesign(
    val version: Int,
    val layout: LayoutId,
    val greeting: String,
    val profileName: String,
    val weatherLine: String,
    val showClock: Boolean,
    val lamp: Int,
    val wallpaper: Wallpaper,
    val tiles: TileStyle,
    val labels: LabelMode,
    val logoColor: LogoColor,
    val fontStyle: FontStyle,
    val apps: List<DockApp>,
    val rows: List<ContentRow>,
)

object Limits {
    const val greeting = 80
    const val profileName = 32
    const val weatherLine = 80
    const val appName = 24
    const val rowTitle = 36
    const val cardTitle = 42
    const val cardMeta = 42
    const val imageName = 80
    const val apps = 12
    const val rows = 4
    const val cards = 8
    const val imageChars = 1_200_000
    const val fileChars = 2_000_000
}

object Palette {
    val background: Int = Oklch.argb(0.16, 0.006, 260.0)
    val foreground: Int = Oklch.argb(0.97, 0.004, 260.0)
    val primary: Int = Oklch.argb(0.96, 0.004, 260.0)
    val popover: Int = Oklch.argb(0.2, 0.008, 260.0)

    fun alpha(color: Int, opacity: Float): Int {
        val channel = (opacity.coerceIn(0f, 1f) * 255f).roundToInt().coerceIn(0, 255)
        return (color and 0x00FFFFFF) or (channel shl 24)
    }

    fun foreground(opacity: Float): Int = alpha(foreground, opacity)
}

fun createDefaultDesign(): HomeDesign {
    return HomeDesign(
        version = 1,
        layout = LayoutId.MOZAIK,
        greeting = "İyi akşamlar",
        profileName = "Ev",
        weatherLine = "İstanbul · serin bir akşam",
        showClock = true,
        lamp = 35,
        wallpaper = Wallpaper.Preset(WallpaperPresetId.ISTANBUL_AKSAM),
        tiles = TileStyle.MARKA,
        labels = LabelMode.LOGO_AD,
        logoColor = LogoColor.MARKA,
        fontStyle = FontStyle.MODERN,
        apps = listOf(
            DockApp("app-youtube", "YouTube", AppColorId.BORDO),
            DockApp("app-netflix", "Netflix", AppColorId.GECE),
            DockApp("app-disney", "Disney+", AppColorId.TAS),
            DockApp("app-blutv", "BluTV", AppColorId.BAKIR),
            DockApp("app-tabii", "tabii", AppColorId.ZEYTIN),
            DockApp("app-ayarlar", "Ayarlar", AppColorId.KREM),
        ),
        rows = listOf(
            ContentRow(
                id = "row-continue",
                title = "Kaldığın yer",
                cards = listOf(
                    ContentCard("card-bogaz", "Boğaz ışıkları", "Film · 48. dk"),
                    ContentCard("card-mahalle", "Mahalle kahvesi", "Dizi · S2 B6"),
                    ContentCard("card-mutfak", "Gece mutfağı", "Program · 22 dk"),
                ),
            ),
            ContentRow(
                id = "row-evening",
                title = "Bu akşam salonda",
                cards = listOf(
                    ContentCard("card-anadolu", "Anadolu yolları", "Belgesel"),
                    ContentCard("card-cocuk", "Çocuk odası", "Aile"),
                    ContentCard("card-konser", "Cuma konseri", "Müzik"),
                ),
            ),
        ),
    )
}
