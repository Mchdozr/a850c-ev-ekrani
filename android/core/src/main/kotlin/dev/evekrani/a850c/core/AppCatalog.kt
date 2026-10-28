package dev.evekrani.a850c.core

fun mergeAppCatalog(current: List<DockApp>, remembered: List<DockApp>): List<DockApp> =
    (current + remembered + createDefaultDesign().apps).distinctBy { it.id }
