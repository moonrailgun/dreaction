package com.moonrailgun.dreaction.annotations

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.BINARY)
annotation class CustomCommand(
    val command: String,
    val title: String = "",
    val description: String = "",
    val responseViewType: String = ""
)
