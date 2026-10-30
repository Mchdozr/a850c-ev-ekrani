package dev.evekrani.a850c.core

import org.json.JSONArray
import org.json.JSONObject

fun serializeDesign(design: HomeDesign): String = JSONObject().apply {
    put("version", design.version)
    put("layout", design.layout.wire)
    put("greeting", design.greeting)
    put("profileName", design.profileName)
    put("weatherLine", design.weatherLine)
    put("showClock", design.showClock)
    put("lamp", design.lamp)
    put("tiles", design.tiles.wire)
    put("labels", design.labels.wire)
    put("logoColor", design.logoColor.wire)
    put("fontStyle", design.fontStyle.wire)
    put("wallpaper", JSONObject().apply {
        when (val wallpaper = design.wallpaper) {
            is Wallpaper.Preset -> {
                put("type", "preset")
                put("presetId", wallpaper.presetId.wire)
            }
            is Wallpaper.Image -> {
                put("type", "image")
                put("dataUrl", wallpaper.dataUrl)
                put("name", wallpaper.name)
            }
        }
    })
    put("apps", JSONArray().apply {
        design.apps.forEach { app -> put(JSONObject().apply {
            put("id", app.id)
            put("name", app.name)
            put("colorId", app.colorId.wire)
            app.packageName?.let { put("packageName", it) }
        }) }
    })
    put("rows", JSONArray().apply {
        design.rows.forEach { row -> put(JSONObject().apply {
            put("id", row.id)
            put("title", row.title)
            put("cards", JSONArray().apply {
                row.cards.forEach { card -> put(JSONObject().apply {
                    put("id", card.id)
                    put("title", card.title)
                    put("meta", card.meta)
                }) }
            })
        }) }
    })
}.toString()
