package dev.evekrani.a850c.core

import java.util.Calendar
import java.util.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class CoreTest {
    private val measurer = TextMeasurer { text, size, _, _ ->
        TextMetrics(text.length * size * 0.5f, size * 0.8f, size * 0.2f)
    }

    @Test
    fun defaultDesignMatchesExportedJson() {
        assertEquals(createDefaultDesign(), parseDesign(DEFAULT_JSON))
    }

    @Test
    fun rejectsUnsupportedVersionAndForeignImage() {
        val broken = DEFAULT_JSON.replace("\"version\": 1", "\"version\": 2")
        val version = runCatching { parseDesign(broken) }.exceptionOrNull()
        assertTrue(version is DesignParseException)
        assertEquals(
            "Bu dosyanın sürümü desteklenmiyor. Sürüm 1 bekleniyor.",
            version?.message,
        )
        val png = DEFAULT_JSON.replace(
            """"type": "preset", "presetId": "istanbul-aksam"""",
            """"type": "image", "dataUrl": "data:image/png;base64,aaaa", "name": "duvar"""",
        )
        assertTrue(runCatching { parseDesign(png) }.exceptionOrNull() is DesignParseException)
    }

    @Test
    fun roundsLampAndAcceptsJpegWallpaper() {
        val json = DEFAULT_JSON
            .replace("\"lamp\": 10", "\"lamp\": 10.4")
            .replace(
                """"type": "preset", "presetId": "istanbul-aksam"""",
                """"type": "image", "dataUrl": "data:image/jpeg;base64,aaaa", "name": "lamba"""",
            )
        val design = parseDesign(json)
        assertEquals(10, design.lamp)
        val wallpaper = design.wallpaper
        assertTrue(wallpaper is Wallpaper.Image)
        assertEquals("lamba", (wallpaper as Wallpaper.Image).name)
    }

    @Test
    fun duplicateIdsFail() {
        val json = DEFAULT_JSON.replace("\"card-mahalle\"", "\"card-bogaz\"")
        assertTrue(runCatching { parseDesign(json) }.exceptionOrNull() is DesignParseException)
    }

    @Test
    fun istanbulClockUsesFixedZone() {
        val afternoon = utc(2026, Calendar.OCTOBER, 27, 15, 5)
        assertEquals("18:05", formatIstanbulTime(afternoon))
        assertEquals("27 Ekim Salı", formatIstanbulDate(afternoon))
        val midnight = utc(2026, Calendar.OCTOBER, 27, 21, 30)
        assertEquals("00:30", formatIstanbulTime(midnight))
        assertEquals("28 Ekim Çarşamba", formatIstanbulDate(midnight))
    }

    @Test
    fun paletteIsNearBlack() {
        assertEquals(Oklch.argb(0.96, 0.004, 260.0), Palette.primary)
        assertEquals(Oklch.argb(0.16, 0.006, 260.0), Palette.background)
        assertEquals(0xFF0C0D10.toInt(), Palette.background)
        val bogaz = posterStops("card-bogaz")
        val mahalle = posterStops("card-mahalle")
        assertNotEquals(bogaz, mahalle)
        assertEquals(0xFF, bogaz.first ushr 24)
    }

    @Test
    fun knownAppsUseMarksAndShortcuts() {
        val design = createDefaultDesign()
        assertEquals(AppMark.YOUTUBE, appMark(design.apps[0]))
        assertEquals(AppMark.NETFLIX, appMark(design.apps[1]))
        assertEquals(AppMark.DISNEY, appMark(design.apps[2]))
        assertEquals(AppMark.BLUTV, appMark(design.apps[3]))
        assertEquals(AppMark.TABII, appMark(design.apps[4]))
        assertEquals(AppMark.AYARLAR, appMark(design.apps[5]))
        assertEquals(appKey("app-youtube"), focusKeyForMark(design, AppMark.YOUTUBE))
        assertEquals(appKey("app-netflix"), focusKeyForMark(design, AppMark.NETFLIX))
        val scene = layoutScene(design.copy(layout = LayoutId.SALON), 1920f, 1080f, "18:05", "27 Ekim Salı", null, measurer)
        assertEquals(
            listOf(
                AppMark.YOUTUBE,
                AppMark.NETFLIX,
                AppMark.DISNEY,
                AppMark.BLUTV,
                AppMark.TABII,
                AppMark.AYARLAR,
            ),
            collectMarks(scene.ops).map { it.kind },
        )
        val poster = collectPosters(scene.ops).first { it.cardId == "card-bogaz" }
        assertEquals("Boğaz ışıkları", poster.title)
        assertTrue(poster.meta.contains("48"))
    }

    @Test
    fun mosaicOpensOnTheGardenWithNetflixFirst() {
        val design = createDefaultDesign()
        assertEquals(LayoutId.MOZAIK, design.layout)
        val paper = design.wallpaper
        assertTrue(paper is Wallpaper.Preset)
        assertEquals(WallpaperPresetId.ISTANBUL_AKSAM, (paper as Wallpaper.Preset).presetId)
        assertEquals(TileStyle.MARKA, design.tiles)
        assertEquals(LabelMode.LOGO_AD, design.labels)
        val map = buildFocusMap(design)
        assertEquals(appKey("app-youtube"), firstFocusKey(map))
        assertEquals(appKey("app-netflix"), moveFocus(map, appKey("app-youtube"), Direction.RIGHT))
        val scene = layoutScene(design, 1920f, 1080f, "18:05", "27 Ekim Salı", null, measurer)
        assertCovered(design, scene)
        val netflix = scene.items.first { it.key == appKey("app-netflix") }
        val youtube = scene.items.first { it.key == appKey("app-youtube") }
        val disney = scene.items.first { it.key == appKey("app-disney") }
        assertEquals(youtube.box.height, netflix.box.height, 1f)
        assertTrue(youtube.box.left < netflix.box.left)
        assertTrue(youtube.box.width > disney.box.width)
    }

    @Test
    fun dpadWalksSalonThenStopsAtTheEdge() {
        val design = createDefaultDesign().copy(layout = LayoutId.SALON)
        val map = buildFocusMap(design)
        val first = firstFocusKey(map)
        assertEquals(cardKey("row-continue", "card-bogaz"), first)
        val right = moveFocus(map, first, Direction.RIGHT)
        assertEquals(cardKey("row-continue", "card-mahalle"), right)
        val down = moveFocus(map, right, Direction.DOWN)
        assertEquals(cardKey("row-evening", "card-cocuk"), down)
        val apps = moveFocus(map, cardKey("row-evening", "card-anadolu"), Direction.DOWN)
        assertEquals(appKey("app-youtube"), apps)
        assertEquals(first, moveFocus(map, first, Direction.LEFT))
        assertEquals("Netflix", focusTitle(design, appKey("app-netflix")))
        val caption = selectionCaption(appKey("app-netflix"))
        assertTrue(caption.contains("açılmaz"))
        assertFalse(caption.contains("açılıyor"))
        assertEquals("Uygulama", focusKindLabel(appKey("app-netflix")))
    }

    @Test
    fun sinemaAndSaatMapsMatchTheLayouts() {
        val sinema = createDefaultDesign().copy(layout = LayoutId.SINEMA)
        val columns = buildFocusMap(sinema) as FocusMap.Columns
        assertEquals(heroKey("row-continue", "card-bogaz"), columns.columns[0].single())
        assertEquals(
            cardKey("row-continue", "card-mahalle"),
            moveFocus(buildFocusMap(sinema), columns.columns[0].single(), Direction.RIGHT),
        )
        val saat = createDefaultDesign().copy(layout = LayoutId.SAAT)
        val rows = buildFocusMap(saat) as FocusMap.Rows
        assertEquals(1, rows.rows.size)
        assertEquals(appKey("app-youtube"), firstFocusKey(rows))
        assertNull(moveFocus(buildFocusMap(saat.copy(apps = emptyList(), rows = emptyList())), null, Direction.DOWN))
    }

    @Test
    fun scenesPlaceEveryFocusTarget() {
        val design = createDefaultDesign().copy(layout = LayoutId.SALON)
        val salon = layoutScene(design, 1920f, 1080f, "18:05", "27 Ekim Salı", null, measurer)
        assertCovered(design, salon)
        val card = salon.items.first { it.key == cardKey("row-continue", "card-bogaz") }
        val nextCard = salon.items.first { it.key == cardKey("row-continue", "card-mahalle") }
        val app = salon.items.first { it.key == appKey("app-youtube") }
        val netflix = salon.items.first { it.key == appKey("app-netflix") }
        val disney = salon.items.first { it.key == appKey("app-disney") }
        assertTrue(nextCard.box.left > card.box.left)
        assertTrue(app.box.top > card.box.bottom)
        assertTrue(app.box.width > disney.box.width)
        assertTrue(app.box.height > disney.box.height)
        assertTrue(netflix.box.width > disney.box.width)
        assertTrue(app.box.left < netflix.box.left)

        val sinemaDesign = design.copy(layout = LayoutId.SINEMA)
        val sinema = layoutScene(sinemaDesign, 1920f, 1080f, "18:05", "27 Ekim Salı", null, measurer)
        assertCovered(sinemaDesign, sinema)
        val hero = sinema.items.first { it.key == heroKey("row-continue", "card-bogaz") }
        val side = sinema.items.first { it.key == cardKey("row-continue", "card-mahalle") }
        assertTrue(side.box.left > hero.box.right)

        val saatDesign = design.copy(layout = LayoutId.SAAT)
        val saat = layoutScene(saatDesign, 1920f, 1080f, "18:05", "27 Ekim Salı", null, measurer)
        assertCovered(saatDesign, saat)
        assertTrue(saat.items.all { it.key.startsWith("app:") })
    }

    @Test
    fun revealOffsetKeepsTheFocusedItemInside() {
        assertEquals(0f, offsetToReveal(0f, 30f, 100f), 0.01f)
        assertEquals(10f, offsetToReveal(80f, 110f, 100f), 0.01f)
        assertEquals(50f, offsetToReveal(120f, 150f, 100f), 0.01f)
    }

    private fun collectMarks(ops: List<DrawOp>): List<DrawOp.Mark> {
        val found = mutableListOf<DrawOp.Mark>()
        for (op in ops) {
            when (op) {
                is DrawOp.Mark -> found += op
                is DrawOp.Group -> found += collectMarks(op.children)
                is DrawOp.RoundRect, is DrawOp.Poster, is DrawOp.Text -> Unit
            }
        }
        return found
    }

    private fun collectPosters(ops: List<DrawOp>): List<DrawOp.Poster> {
        val found = mutableListOf<DrawOp.Poster>()
        for (op in ops) {
            when (op) {
                is DrawOp.Poster -> found += op
                is DrawOp.Group -> found += collectPosters(op.children)
                is DrawOp.RoundRect, is DrawOp.Mark, is DrawOp.Text -> Unit
            }
        }
        return found
    }

    private fun assertCovered(design: HomeDesign, scene: Scene) {
        val map = buildFocusMap(design)
        val keys = scene.items.map { it.key }.toSet()
        val expected = when (map) {
            is FocusMap.Rows -> map.rows.flatten()
            is FocusMap.Columns -> map.columns.flatten()
        }
        assertEquals(expected.toSet(), keys)
        assertEquals(expected.size, scene.items.size)
    }

    private fun utc(year: Int, month: Int, day: Int, hour: Int, minute: Int): Long {
        val calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        calendar.set(Calendar.YEAR, year)
        calendar.set(Calendar.MONTH, month)
        calendar.set(Calendar.DAY_OF_MONTH, day)
        calendar.set(Calendar.HOUR_OF_DAY, hour)
        calendar.set(Calendar.MINUTE, minute)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        return calendar.timeInMillis
    }
}

private const val DEFAULT_JSON = """
{
  "version": 1,
  "layout": "mozaik",
  "greeting": "İyi akşamlar",
  "profileName": "Ev",
  "weatherLine": "İstanbul · serin bir akşam",
  "showClock": true,
  "lamp": 10,
  "wallpaper": { "type": "preset", "presetId": "istanbul-aksam" },
  "tiles": "marka",
  "labels": "logo-ad",
  "logoColor": "marka",
  "fontStyle": "modern",
  "apps": [
    { "id": "app-youtube", "name": "YouTube", "colorId": "bordo" },
    { "id": "app-netflix", "name": "Netflix", "colorId": "gece" },
    { "id": "app-disney", "name": "Disney+", "colorId": "tas" },
    { "id": "app-blutv", "name": "BluTV", "colorId": "bakir" },
    { "id": "app-tabii", "name": "tabii", "colorId": "zeytin" },
    { "id": "app-ayarlar", "name": "Ayarlar", "colorId": "krem" }
  ],
  "rows": [
    {
      "id": "row-continue",
      "title": "Kaldığın yer",
      "cards": [
        { "id": "card-bogaz", "title": "Boğaz ışıkları", "meta": "Film · 48. dk" },
        { "id": "card-mahalle", "title": "Mahalle kahvesi", "meta": "Dizi · S2 B6" },
        { "id": "card-mutfak", "title": "Gece mutfağı", "meta": "Program · 22 dk" }
      ]
    },
    {
      "id": "row-evening",
      "title": "Bu akşam salonda",
      "cards": [
        { "id": "card-anadolu", "title": "Anadolu yolları", "meta": "Belgesel" },
        { "id": "card-cocuk", "title": "Çocuk odası", "meta": "Aile" },
        { "id": "card-konser", "title": "Cuma konseri", "meta": "Müzik" }
      ]
    }
  ]
}
"""
