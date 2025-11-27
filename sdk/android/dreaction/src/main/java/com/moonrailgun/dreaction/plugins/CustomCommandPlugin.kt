package com.moonrailgun.dreaction.plugins

import android.util.Log
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.moonrailgun.dreaction.Plugin
import com.moonrailgun.dreaction.models.Command
import com.moonrailgun.dreaction.models.CustomCommand
import com.moonrailgun.dreaction.models.CustomCommandArg
import com.moonrailgun.dreaction.models.CustomCommandRegisterPayload
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class CustomCommandPlugin : Plugin() {

    private val commands = mutableMapOf<String, CustomCommand>()
    private var currentId = 1
    private val gson = Gson()
    private val scope = CoroutineScope(Dispatchers.Main)

    fun registerCommand(
        command: String,
        title: String? = null,
        description: String? = null,
        args: List<CustomCommandArg>? = null,
        responseViewType: String? = null,
        handler: suspend (Map<String, String>) -> Any?
    ): () -> Unit {
        val id = currentId++

        val customCommand = CustomCommand(
            id = id,
            command = command,
            title = title,
            description = description,
            args = args,
            responseViewType = responseViewType,
            handler = handler
        )

        commands[command] = customCommand

        send("customCommand.register", CustomCommandRegisterPayload(
            id = id,
            command = command,
            title = title,
            description = description,
            args = args,
            responseViewType = responseViewType
        ))

        return {
            unregisterCommand(command)
        }
    }

    fun unregisterCommand(command: String) {
        val customCommand = commands.remove(command)
        if (customCommand != null) {
            send("customCommand.unregister", mapOf(
                "id" to customCommand.id,
                "command" to command
            ))
        }
    }

    override fun onCommand(command: Command) {
        super.onCommand(command)

        if (command.type == "custom") {
            handleCustomCommand(command)
        }
    }

    private fun handleCustomCommand(command: Command) {
        try {
            val payload = command.payload

            val commandName: String
            val args: Map<String, String>

            if (payload is JsonObject) {
                if (payload.has("command")) {
                    commandName = payload.get("command").asString
                    args = if (payload.has("args")) {
                        gson.fromJson(payload.get("args"), Map::class.java) as Map<String, String>
                    } else {
                        emptyMap()
                    }
                } else {
                    return
                }
            } else {
                commandName = payload?.asString ?: return
                args = emptyMap()
            }

            val customCommand = commands[commandName]
            if (customCommand != null) {
                scope.launch {
                    try {
                        val result = customCommand.handler(args)
                        if (result != null) {
                            send("customCommand.response", mapOf(
                                "command" to commandName,
                                "payload" to result
                            ))
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error executing custom command: $commandName", e)
                        send("customCommand.response", mapOf(
                            "command" to commandName,
                            "payload" to mapOf(
                                "error" to e.message
                            )
                        ))
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling custom command", e)
        }
    }

    companion object {
        private const val TAG = "CustomCommandPlugin"
    }
}
