package com.moonrailgun.dreaction

data class DReactionConfig(
    val host: String = "localhost",
    val port: Int = 9600,
    val secure: Boolean = false,
    val name: String = "Android App",
    val environment: String = "development",
    val clientInfo: Map<String, Any> = emptyMap(),
    val reconnect: Boolean = true,
    val reconnectDelay: Long = 2000
)
