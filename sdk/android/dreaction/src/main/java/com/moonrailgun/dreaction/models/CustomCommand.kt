package com.moonrailgun.dreaction.models

data class CustomCommand(
    val id: Int,
    val command: String,
    val title: String? = null,
    val description: String? = null,
    val args: List<CustomCommandArg>? = null,
    val responseViewType: String? = null,
    val handler: suspend (Map<String, String>) -> Any?
)

data class CustomCommandArg(
    val name: String,
    val type: String = "string",
    val options: List<CustomCommandOption>? = null
)

data class CustomCommandOption(
    val label: String,
    val value: String
)

data class CustomCommandRegisterPayload(
    val id: Int,
    val command: String,
    val title: String? = null,
    val description: String? = null,
    val args: List<CustomCommandArg>? = null,
    val responseViewType: String? = null
)

data class CustomCommandResponsePayload(
    val command: String,
    val payload: Any?
)
