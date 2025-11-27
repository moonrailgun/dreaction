package com.moonrailgun.dreaction.example

import com.moonrailgun.dreaction.annotations.CustomCommand
import com.moonrailgun.dreaction.annotations.Param
import kotlinx.coroutines.delay

/**
 * Example class demonstrating annotation-based custom command registration
 * Commands in this class will be automatically registered when DReaction connects
 */
class AnnotatedCommands {

    @CustomCommand(
        command = "annotatedGetInfo",
        title = "Get Annotated Info",
        description = "Returns information using annotation-based registration"
    )
    fun getAnnotatedInfo(): Map<String, Any> {
        return mapOf(
            "method" to "annotation",
            "timestamp" to System.currentTimeMillis(),
            "message" to "This command was registered using @CustomCommand annotation"
        )
    }

    @CustomCommand(
        command = "annotatedEcho",
        title = "Annotated Echo",
        description = "Echoes back a message using annotations"
    )
    fun annotatedEcho(message: String): String {
        return "Annotated Echo: $message"
    }

    @CustomCommand(
        command = "annotatedCalculate",
        title = "Calculate Sum",
        description = "Calculates the sum of two numbers"
    )
    fun calculateSum(a: Int, b: Int): Map<String, Any> {
        return mapOf(
            "a" to a,
            "b" to b,
            "sum" to (a + b),
            "operation" to "addition"
        )
    }

    @CustomCommand(
        command = "annotatedSlowOp",
        title = "Slow Operation",
        description = "Simulates a slow async operation using annotations",
        responseViewType = "auto"
    )
    suspend fun slowOperation(): String {
        delay(2000)
        return "Annotated slow operation completed after 2 seconds"
    }

    @CustomCommand(
        command = "annotatedGreet",
        title = "Greet User",
        description = "Greets a user with a custom greeting"
    )
    fun greetUser(name: String, greeting: String): String {
        return "$greeting, $name! Welcome to DReaction."
    }
}
