package com.moonrailgun.dreaction

import android.os.Build
import android.util.Log
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.moonrailgun.dreaction.models.Command
import com.moonrailgun.dreaction.models.OutgoingCommand
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.TimeUnit

class DReactionClient(private val config: DReactionConfig) {
    private var webSocket: WebSocket? = null
    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private val plugins = mutableListOf<Plugin>()
    private val messageQueue = mutableListOf<String>()
    private val gson: Gson = GsonBuilder()
        .serializeNulls()
        .create()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var lastMessageTime = System.currentTimeMillis()
    private var shouldReconnect = true

    var isConnected = false
        private set

    var isReady = false
        private set

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    fun connect() {
        if (config.host.isEmpty()) {
            Log.w(TAG, "Host is not configured, skipping connection")
            return
        }

        shouldReconnect = true
        connectInternal()
    }

    private fun connectInternal() {
        val protocol = if (config.secure) "wss" else "ws"
        val url = "$protocol://${config.host}:${config.port}"

        Log.d(TAG, "Connecting to $url")

        val request = Request.Builder()
            .url(url)
            .build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket connected")
                isConnected = true
                onConnected()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "WebSocket closed: $code - $reason")
                handleDisconnect()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket failure: ${t.message}", t)
                handleDisconnect()
            }
        })
    }

    private fun onConnected() {
        isReady = true
        sendIntro()
        plugins.forEach { it.onConnect() }
        flushMessageQueue()
    }

    private fun handleDisconnect() {
        val wasConnected = isConnected
        isConnected = false
        isReady = false

        if (wasConnected) {
            plugins.forEach { it.onDisconnect() }
        }

        if (shouldReconnect && config.reconnect) {
            scope.launch {
                delay(config.reconnectDelay)
                if (shouldReconnect) {
                    Log.d(TAG, "Attempting to reconnect...")
                    connectInternal()
                }
            }
        }
    }

    private fun sendIntro() {
        val introPayload = mutableMapOf<String, Any>(
            "name" to config.name,
            "environment" to config.environment,
            "platform" to "android",
            "androidVersion" to Build.VERSION.SDK_INT,
            "model" to Build.MODEL,
            "manufacturer" to Build.MANUFACTURER,
            "brand" to Build.BRAND,
            "device" to Build.DEVICE,
            "dreactionCoreClientVersion" to "1.0.0"
        )

        introPayload.putAll(config.clientInfo)

        send("client.intro", introPayload)
    }

    private fun flushMessageQueue() {
        synchronized(messageQueue) {
            while (messageQueue.isNotEmpty()) {
                val message = messageQueue.removeAt(0)
                webSocket?.send(message)
            }
        }
    }

    private fun handleMessage(text: String) {
        try {
            val command = gson.fromJson(text, Command::class.java)
            plugins.forEach { plugin ->
                try {
                    plugin.onCommand(command)
                } catch (e: Exception) {
                    Log.e(TAG, "Error in plugin ${plugin::class.simpleName} handling command", e)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing command: $text", e)
        }
    }

    fun send(type: String, payload: Any? = null, important: Boolean = false) {
        val now = System.currentTimeMillis()
        val deltaTime = now - lastMessageTime
        lastMessageTime = now

        val command = OutgoingCommand(
            type = type,
            payload = payload,
            date = dateFormat.format(Date(now)),
            deltaTime = deltaTime,
            important = important
        )

        val message = gson.toJson(command)

        if (isReady) {
            try {
                webSocket?.send(message)
            } catch (e: Exception) {
                Log.e(TAG, "Error sending message", e)
                isReady = false
            }
        } else {
            synchronized(messageQueue) {
                messageQueue.add(message)
            }
        }
    }

    fun use(plugin: Plugin): DReactionClient {
        plugins.add(plugin)
        plugin.onAttach(this)
        return this
    }

    fun disconnect() {
        shouldReconnect = false
        isConnected = false
        isReady = false
        webSocket?.close(1000, "Client disconnect")
        webSocket = null
    }

    companion object {
        private const val TAG = "DReactionClient"
    }
}
