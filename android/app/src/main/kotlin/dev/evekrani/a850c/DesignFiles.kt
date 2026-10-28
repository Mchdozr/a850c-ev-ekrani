package dev.evekrani.a850c

import android.content.ContentUris
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import dev.evekrani.a850c.core.DesignParseException
import dev.evekrani.a850c.core.HomeDesign
import dev.evekrani.a850c.core.Limits
import dev.evekrani.a850c.core.createDefaultDesign
import dev.evekrani.a850c.core.parseDesign
import java.io.ByteArrayOutputStream
import java.io.File
import java.security.MessageDigest

data class LoadedDesign(
    val design: HomeDesign,
    val notice: String?,
    val fingerprint: String,
)

object DesignFiles {
    const val FILE_NAME = "a850c-ev-ekrani.json"
    private const val TAG = "Evekrani"

    fun load(context: Context): LoadedDesign {
        return when (val sidecar = readSidecar(context)) {
            Sidecar.Missing -> {
                Log.i(TAG, "Tasarım: yerleşik salon")
                LoadedDesign(createDefaultDesign(), null, "missing")
            }
            is Sidecar.TooBig -> {
                Log.i(TAG, "Tasarım okunamadı, dosya büyük: ${sidecar.where}")
                LoadedDesign(
                    createDefaultDesign(),
                    "İndirilenler dosyası çok büyük. Örnek salon ekranı gösteriliyor.",
                    "too-big:${sidecar.where}",
                )
            }
            is Sidecar.Text -> fromText(sidecar.text, sidecar.where)
        }
    }

    private fun fromText(text: String, where: String): LoadedDesign {
        val fingerprint = sha256(text)
        return try {
            val design = parseDesign(text)
            Log.i(TAG, "Tasarım dosyası: $where")
            LoadedDesign(design, null, fingerprint)
        } catch (error: DesignParseException) {
            Log.i(TAG, "Tasarım ayrıştırılamadı: ${error.message}")
            LoadedDesign(
                createDefaultDesign(),
                "İndirilenler dosyası açılamadı: ${error.message} Örnek salon ekranı gösteriliyor.",
                "bad:$fingerprint",
            )
        }
    }

    private fun readSidecar(context: Context): Sidecar {
        val direct = readDirect()
        if (direct !is Sidecar.Missing) {
            return direct
        }
        return readMediaStore(context)
    }

    private fun readDirect(): Sidecar {
        val files = buildList {
            add(File("/sdcard/Download/$FILE_NAME"))
            add(File("/storage/emulated/0/Download/$FILE_NAME"))
            val downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            if (downloads != null) {
                add(File(downloads, FILE_NAME))
            }
        }
        for (file in files) {
            try {
                if (!file.isFile) {
                    continue
                }
                if (file.length() > Limits.fileChars) {
                    return Sidecar.TooBig(file.absolutePath)
                }
                if (!file.canRead()) {
                    continue
                }
                return Sidecar.Text(file.absolutePath, file.readText(Charsets.UTF_8))
            } catch (_: Exception) {
                continue
            }
        }
        return Sidecar.Missing
    }

    private fun readMediaStore(context: Context): Sidecar {
        if (Build.VERSION.SDK_INT < 29) {
            return Sidecar.Missing
        }
        return try {
            val collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL)
            val projection = arrayOf(MediaStore.Downloads._ID, MediaStore.MediaColumns.DISPLAY_NAME)
            val selection = "${MediaStore.MediaColumns.DISPLAY_NAME}=?"
            context.contentResolver.query(
                collection,
                projection,
                selection,
                arrayOf(FILE_NAME),
                null,
            )?.use { cursor ->
                val idColumn = cursor.getColumnIndexOrThrow(MediaStore.Downloads._ID)
                if (!cursor.moveToFirst()) {
                    return Sidecar.Missing
                }
                val uri = ContentUris.withAppendedId(collection, cursor.getLong(idColumn))
                context.contentResolver.openInputStream(uri)?.use { input ->
                    val bytes = ByteArrayOutputStream()
                    val buffer = ByteArray(8192)
                    var total = 0
                    while (true) {
                        val count = input.read(buffer)
                        if (count < 0) {
                            break
                        }
                        total += count
                        if (total > Limits.fileChars) {
                            return Sidecar.TooBig(uri.toString())
                        }
                        bytes.write(buffer, 0, count)
                    }
                    Sidecar.Text(uri.toString(), bytes.toString(Charsets.UTF_8.name()))
                } ?: Sidecar.Missing
            } ?: Sidecar.Missing
        } catch (_: Exception) {
            Sidecar.Missing
        }
    }

    private fun sha256(text: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(text.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { byte -> "%02x".format(byte) }
    }

    private sealed interface Sidecar {
        data object Missing : Sidecar

        data class TooBig(val where: String) : Sidecar

        data class Text(val where: String, val text: String) : Sidecar
    }
}
