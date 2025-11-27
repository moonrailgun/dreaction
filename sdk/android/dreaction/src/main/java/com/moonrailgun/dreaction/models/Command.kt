package com.moonrailgun.dreaction.models

import com.google.gson.JsonElement

data class Command(
    val type: String,
    val payload: JsonElement? = null,
    val date: String? = null,
    val deltaTime: Long = 0,
    val important: Boolean = false
)

data class OutgoingCommand(
    val type: String,
    val payload: Any? = null,
    val date: String,
    val deltaTime: Long = 0,
    val important: Boolean = false
)
