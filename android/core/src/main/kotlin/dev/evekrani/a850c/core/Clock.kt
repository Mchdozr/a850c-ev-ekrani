package dev.evekrani.a850c.core

import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

internal val TURKISH: Locale = Locale.Builder().setLanguage("tr").setRegion("TR").build()

private val ISTANBUL: TimeZone = TimeZone.getTimeZone("Europe/Istanbul")

private val WEEKDAYS = arrayOf(
    "",
    "Pazar",
    "Pazartesi",
    "Salı",
    "Çarşamba",
    "Perşembe",
    "Cuma",
    "Cumartesi",
)

private val MONTHS = arrayOf(
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
)

fun formatIstanbulTime(epochMillis: Long): String {
    val calendar = istanbulCalendar(epochMillis)
    val hour = calendar.get(Calendar.HOUR_OF_DAY)
    val minute = calendar.get(Calendar.MINUTE)
    return String.format(Locale.US, "%02d:%02d", hour, minute)
}

fun formatIstanbulDate(epochMillis: Long): String {
    val calendar = istanbulCalendar(epochMillis)
    val day = calendar.get(Calendar.DAY_OF_MONTH)
    val month = MONTHS[calendar.get(Calendar.MONTH)]
    val weekday = WEEKDAYS[calendar.get(Calendar.DAY_OF_WEEK)]
    return "$day $month $weekday · İstanbul"
}

private fun istanbulCalendar(epochMillis: Long): Calendar {
    return Calendar.getInstance(ISTANBUL, TURKISH).apply {
        timeInMillis = epochMillis
    }
}
