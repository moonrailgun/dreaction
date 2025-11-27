package com.moonrailgun.dreaction

import android.content.Context
import com.moonrailgun.dreaction.plugins.CustomCommandPlugin
import com.moonrailgun.dreaction.plugins.LoggerPlugin
import com.moonrailgun.dreaction.plugins.NetworkPlugin
import com.moonrailgun.dreaction.plugins.PerformancePlugin
import com.moonrailgun.dreaction.plugins.SharedPreferencesPlugin

object DReaction {
    private var client: DReactionClient? = null

    var logger: LoggerPlugin? = null
        private set

    var network: NetworkPlugin? = null
        private set

    var performance: PerformancePlugin? = null
        private set

    var customCommand: CustomCommandPlugin? = null
        private set

    var sharedPreferences: SharedPreferencesPlugin? = null
        private set

    fun configure(config: DReactionConfig = DReactionConfig()): Builder {
        client = DReactionClient(config)
        return Builder(client!!)
    }

    fun disconnect() {
        client?.disconnect()
        client = null
        logger = null
        network = null
        performance = null
        customCommand = null
        sharedPreferences = null
    }

    class Builder internal constructor(private val client: DReactionClient) {

        fun useLogger(): Builder {
            logger = LoggerPlugin()
            client.use(logger!!)
            return this
        }

        fun useNetwork(): Builder {
            network = NetworkPlugin()
            client.use(network!!)
            return this
        }

        fun usePerformance(context: Context): Builder {
            performance = PerformancePlugin(context)
            client.use(performance!!)
            return this
        }

        fun useCustomCommand(): Builder {
            customCommand = CustomCommandPlugin()
            client.use(customCommand!!)
            return this
        }

        fun useSharedPreferences(context: Context, prefsName: String? = null): Builder {
            sharedPreferences = SharedPreferencesPlugin(context, prefsName)
            client.use(sharedPreferences!!)
            return this
        }

        fun use(plugin: Plugin): Builder {
            client.use(plugin)
            return this
        }

        fun connect(): DReactionClient {
            client.connect()
            return client
        }
    }
}
