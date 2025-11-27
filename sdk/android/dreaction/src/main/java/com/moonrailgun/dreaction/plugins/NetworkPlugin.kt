package com.moonrailgun.dreaction.plugins

import android.util.Log
import com.moonrailgun.dreaction.Plugin
import okhttp3.Headers
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response
import okio.Buffer
import java.io.IOException
import java.nio.charset.Charset

class NetworkPlugin : Plugin() {

    private val interceptor = DReactionInterceptor(this)

    fun getInterceptor(): Interceptor = interceptor

    internal fun reportRequest(
        request: Request,
        startTime: Long,
        endTime: Long,
        response: Response?,
        error: Throwable? = null
    ) {
        try {
            val duration = endTime - startTime

            val requestHeaders = request.headers.toMap()
            val requestBody = request.body?.let { body ->
                try {
                    val buffer = Buffer()
                    body.writeTo(buffer)
                    buffer.readString(Charset.forName("UTF-8"))
                } catch (e: Exception) {
                    "[Unable to read body]"
                }
            }

            val responseHeaders = response?.headers?.toMap()
            val responseBody = response?.body?.let { body ->
                try {
                    val source = body.source()
                    source.request(Long.MAX_VALUE)
                    val buffer = source.buffer
                    buffer.clone().readString(Charset.forName("UTF-8"))
                } catch (e: Exception) {
                    "[Unable to read body]"
                }
            }

            val payload = mutableMapOf<String, Any?>(
                "url" to request.url.toString(),
                "method" to request.method,
                "duration" to duration,
                "request" to mapOf(
                    "headers" to requestHeaders,
                    "body" to requestBody
                )
            )

            if (response != null) {
                payload["status"] = response.code
                payload["response"] = mapOf(
                    "headers" to responseHeaders,
                    "body" to responseBody
                )
            }

            if (error != null) {
                payload["error"] = mapOf(
                    "message" to error.message,
                    "type" to error.javaClass.simpleName
                )
            }

            send("api.response", payload)
        } catch (e: Exception) {
            Log.e(TAG, "Error reporting network request", e)
        }
    }

    private fun Headers.toMap(): Map<String, String> {
        val map = mutableMapOf<String, String>()
        for (i in 0 until size) {
            map[name(i)] = value(i)
        }
        return map
    }

    companion object {
        private const val TAG = "NetworkPlugin"
    }
}

class DReactionInterceptor internal constructor(
    private val plugin: NetworkPlugin
) : Interceptor {

    @Throws(IOException::class)
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val startTime = System.currentTimeMillis()

        return try {
            val response = chain.proceed(request)
            val endTime = System.currentTimeMillis()

            plugin.reportRequest(request, startTime, endTime, response)

            response
        } catch (e: IOException) {
            val endTime = System.currentTimeMillis()
            plugin.reportRequest(request, startTime, endTime, null, e)
            throw e
        }
    }
}
