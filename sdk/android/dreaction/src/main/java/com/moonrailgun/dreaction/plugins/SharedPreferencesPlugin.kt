package com.moonrailgun.dreaction.plugins

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.moonrailgun.dreaction.Plugin
import com.moonrailgun.dreaction.models.Command

class SharedPreferencesPlugin(
    context: Context,
    prefsName: String? = null
) : Plugin() {

    private val sharedPreferences: SharedPreferences = if (prefsName != null) {
        context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
    } else {
        context.getSharedPreferences("${context.packageName}_preferences", Context.MODE_PRIVATE)
    }

    private val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
        key?.let { reportChange(it) }
    }

    override fun onConnect() {
        super.onConnect()
        sharedPreferences.registerOnSharedPreferenceChangeListener(listener)
        reportAllValues()
    }

    override fun onDisconnect() {
        super.onDisconnect()
        sharedPreferences.unregisterOnSharedPreferenceChangeListener(listener)
    }

    override fun onCommand(command: Command) {
        super.onCommand(command)

        when (command.type) {
            "asyncStorage.keys" -> {
                reportKeys()
            }
            "asyncStorage.values" -> {
                reportAllValues()
            }
        }
    }

    private fun reportKeys() {
        try {
            val keys = sharedPreferences.all.keys.toList()
            send("asyncStorage.keys", mapOf(
                "keys" to keys
            ))
        } catch (e: Exception) {
            Log.e(TAG, "Error reporting SharedPreferences keys", e)
        }
    }

    private fun reportAllValues() {
        try {
            val all = sharedPreferences.all
            val values = all.mapValues { (_, value) ->
                when (value) {
                    is Set<*> -> value.toList()
                    else -> value
                }
            }

            send("asyncStorage.values", mapOf(
                "values" to values
            ))
        } catch (e: Exception) {
            Log.e(TAG, "Error reporting SharedPreferences values", e)
        }
    }

    private fun reportChange(key: String) {
        try {
            val value = sharedPreferences.all[key]
            val convertedValue = when (value) {
                is Set<*> -> value.toList()
                else -> value
            }

            send("asyncStorage.mutation", mapOf(
                "operation" to "setItem",
                "key" to key,
                "value" to convertedValue
            ))
        } catch (e: Exception) {
            Log.e(TAG, "Error reporting SharedPreferences change", e)
        }
    }

    companion object {
        private const val TAG = "SharedPreferencesPlugin"
    }
}
