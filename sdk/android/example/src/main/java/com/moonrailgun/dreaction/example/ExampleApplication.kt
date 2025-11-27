package com.moonrailgun.dreaction.example

import android.app.Application
import com.moonrailgun.dreaction.DReaction
import com.moonrailgun.dreaction.DReactionConfig
import com.moonrailgun.dreaction.models.CustomCommandArg
import kotlinx.coroutines.delay

class ExampleApplication : Application() {

    override fun onCreate() {
        super.onCreate()

        if (BuildConfig.DEBUG) {
            setupDReaction()
        }
    }

    private fun setupDReaction() {
        DReaction.configure(
            DReactionConfig(
                host = "10.0.2.2", // For Android emulator, use 10.0.2.2 to reach host machine
                // host = "192.168.1.100", // Replace with your dev machine IP for physical device
                port = 9600,
                name = "DReaction Example App",
                environment = "development"
            )
        )
        .useLogger()
        .useNetwork()
        .usePerformance(this)
        .useCustomCommand()
        .useSharedPreferences(this)
        .connect()

        // Example: Log some messages
        DReaction.logger?.info("Application started")
        DReaction.logger?.debug("Debug mode enabled")

        // Example: Register custom commands
        DReaction.customCommand?.registerCommand(
            command = "getAppInfo",
            title = "Get App Info",
            description = "Returns information about the app"
        ) {
            mapOf(
                "packageName" to packageName,
                "versionName" to BuildConfig.VERSION_NAME,
                "versionCode" to BuildConfig.VERSION_CODE,
                "isDebug" to BuildConfig.DEBUG
            )
        }

        DReaction.customCommand?.registerCommand(
            command = "echo",
            title = "Echo Command",
            description = "Echoes back the input message",
            args = listOf(
                CustomCommandArg(
                    name = "message",
                    type = "string"
                )
            )
        ) { args ->
            "Echo: ${args["message"]}"
        }

        DReaction.customCommand?.registerCommand(
            command = "slowOperation",
            title = "Slow Operation",
            description = "Simulates a slow async operation",
            responseViewType = "auto"
        ) {
            delay(2000)
            "Operation completed after 2 seconds"
        }

        // Start performance monitoring
        DReaction.performance?.startMonitoring()
    }
}
