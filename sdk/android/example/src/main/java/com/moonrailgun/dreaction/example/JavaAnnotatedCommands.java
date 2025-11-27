package com.moonrailgun.dreaction.example;

import com.moonrailgun.dreaction.annotations.CustomCommand;
import com.moonrailgun.dreaction.annotations.Param;

import java.util.HashMap;
import java.util.Map;

/**
 * Example class demonstrating Java annotation-based custom command registration
 * Note: Java methods MUST use @Param annotation for parameters
 */
public class JavaAnnotatedCommands {

    @CustomCommand(
            command = "javaGetInfo",
            title = "Java Get Info",
            description = "Returns information from Java using annotations"
    )
    public Map<String, Object> getJavaInfo() {
        Map<String, Object> result = new HashMap<>();
        result.put("language", "Java");
        result.put("method", "annotation");
        result.put("timestamp", System.currentTimeMillis());
        result.put("message", "This command was registered from Java using @CustomCommand");
        return result;
    }

    @CustomCommand(
            command = "javaEcho",
            title = "Java Echo",
            description = "Echoes back a message from Java"
    )
    public String javaEcho(@Param("message") String msg) {
        return "Java Echo: " + msg;
    }

    @CustomCommand(
            command = "javaMultiply",
            title = "Multiply Numbers",
            description = "Multiplies two numbers in Java"
    )
    public Map<String, Object> multiply(@Param("x") String xStr, @Param("y") String yStr) {
        int x = Integer.parseInt(xStr);
        int y = Integer.parseInt(yStr);

        Map<String, Object> result = new HashMap<>();
        result.put("x", x);
        result.put("y", y);
        result.put("product", x * y);
        result.put("operation", "multiplication");
        return result;
    }

    @CustomCommand(
            command = "javaConcat",
            title = "Concatenate Strings",
            description = "Concatenates multiple strings in Java"
    )
    public String concatenate(@Param("first") String first, @Param("second") String second) {
        return first + " " + second;
    }
}
