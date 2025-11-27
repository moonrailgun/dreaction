package com.moonrailgun.dreaction.annotations

@Target(AnnotationTarget.VALUE_PARAMETER)
@Retention(AnnotationRetention.BINARY)
annotation class Param(
    val value: String,
    val type: String = "string"
)
