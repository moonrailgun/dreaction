package com.moonrailgun.dreaction.plugins

import android.util.Log
import com.moonrailgun.dreaction.Plugin

class LoggerPlugin : Plugin() {

    fun log(level: String, message: String, args: List<Any?>? = null) {
        val payload = mutableMapOf<String, Any?>(
            "level" to level,
            "message" to message
        )

        if (!args.isNullOrEmpty()) {
            payload["args"] = args
        }

        send("log", payload)
    }

    fun debug(message: String, vararg args: Any?) {
        log("debug", message, if (args.isNotEmpty()) args.toList() else null)
        Log.d(TAG, message)
    }

    fun info(message: String, vararg args: Any?) {
        log("info", message, if (args.isNotEmpty()) args.toList() else null)
        Log.i(TAG, message)
    }

    fun warn(message: String, vararg args: Any?) {
        log("warn", message, if (args.isNotEmpty()) args.toList() else null)
        Log.w(TAG, message)
    }

    fun error(message: String, throwable: Throwable? = null, vararg args: Any?) {
        val allArgs = mutableListOf<Any?>()
        if (args.isNotEmpty()) {
            allArgs.addAll(args)
        }
        if (throwable != null) {
            allArgs.add(mapOf(
                "name" to throwable.javaClass.simpleName,
                "message" to throwable.message,
                "stack" to throwable.stackTraceToString()
            ))
        }

        log("error", message, allArgs)

        if (throwable != null) {
            Log.e(TAG, message, throwable)
        } else {
            Log.e(TAG, message)
        }
    }

    companion object {
        private const val TAG = "DReaction"
    }
}
