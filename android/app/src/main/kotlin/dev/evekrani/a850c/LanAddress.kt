package dev.evekrani.a850c

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import java.net.Inet4Address
import java.net.NetworkInterface

/** Wi-Fi and wired LAN only: never put a mobile-data or VPN address into the QR. */
internal fun findLanAddress(context: Context): String? {
    val manager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        ?: return null
    return try {
        manager.allNetworks
            .mapNotNull { network ->
                val capabilities = manager.getNetworkCapabilities(network) ?: return@mapNotNull null
                val wifi = capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                val ethernet = capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
                if ((!wifi && !ethernet) || capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) {
                    return@mapNotNull null
                }
                val properties = manager.getLinkProperties(network) ?: return@mapNotNull null
                val addresses = properties.interfaceName?.let { name ->
                    NetworkInterface.getByName(name)?.inetAddresses?.toList()
                } ?: properties.linkAddresses.map { it.address }
                val address = addresses
                    ?.filterIsInstance<Inet4Address>()
                    ?.firstOrNull { !it.isLoopbackAddress && !it.isLinkLocalAddress && !it.isAnyLocalAddress }
                    ?.hostAddress ?: return@mapNotNull null
                (if (wifi) 0 else 1) to address
            }
            .sortedBy { it.first }
            .firstOrNull()?.second
    } catch (_: SecurityException) {
        null
    } catch (_: java.net.SocketException) {
        null
    }
}
