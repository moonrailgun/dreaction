# DReaction Android SDK

DReaction client for native Android applications with powerful debugging tools.

## Features

- 📜 **Logging** - Send logs to DReaction desktop client
- 🌐 **Network Monitoring** - Track all HTTP requests and responses with OkHttp interceptor
- 📈 **Performance Monitoring** - Monitor FPS and memory usage in real-time
- 🔧 **Custom Commands** - Register custom commands that can be triggered from desktop client
  - ⭐ **Annotation Support** - Use `@CustomCommand` for automatic registration (Kotlin & Java)
  - 🚀 **Zero Runtime Overhead** - Compile-time code generation with KSP
- 💾 **SharedPreferences Monitoring** - Watch SharedPreferences changes live
- 🔌 **Plugin System** - Easy to extend with custom plugins

## Installation

### Using JitPack

Add JitPack repository to your root `build.gradle` or `settings.gradle.kts`:

```kotlin
dependencyResolutionManagement {
    repositories {
        maven { url = uri("https://jitpack.io") }
    }
}
```

Add the dependencies (use `android-` prefixed tag):

```gradle
dependencies {
    debugImplementation("com.github.moonrailgun:dreaction:android-1.0.0")
    
    // If using @CustomCommand annotation for automatic command registration
    ksp("com.github.moonrailgun:dreaction-compiler:android-1.0.0")
}
```

> **Note**: Android SDK releases use the `android-` prefix to distinguish from other packages in the monorepo.
> 
> **KSP Compiler**: The `dreaction-compiler` is only needed if you use the `@CustomCommand` annotation for automatic command registration. If you register commands manually, you can skip this dependency.

### Using Local Maven

Build and publish to local Maven:

```bash
cd sdk/android
./gradlew publishToMavenLocal
```

Then in your project:

```gradle
dependencies {
    debugImplementation("com.github.moonrailgun:dreaction:1.0.0")
    
    // If using @CustomCommand annotation
    ksp("com.github.moonrailgun:dreaction-compiler:1.0.0")
}
```

## Quick Start

### 1. Initialize in Application class

```kotlin
import com.moonrailgun.dreaction.DReaction
import com.moonrailgun.dreaction.DReactionConfig

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        if (BuildConfig.DEBUG) {
            DReaction.configure(
                DReactionConfig(
                    host = "192.168.1.100", // Your dev machine IP, optional
                    port = 9600,
                    name = "My Android App"
                )
            )
            .useLogger()
            .useNetwork()
            .usePerformance(this)
            .useCustomCommand()
            .useSharedPreferences(this)
            .connect()
            
            // Start performance monitoring
            DReaction.performance?.startMonitoring()
        }
    }
}
```

### 2. Use Logger

```kotlin
DReaction.logger?.info("User logged in")
DReaction.logger?.warn("Low battery")
DReaction.logger?.error("API call failed", exception)
DReaction.logger?.debug("Debug info", "key" to "value")
```

### 3. Monitor Network Requests

Add the interceptor to your OkHttp client:

```kotlin
val client = OkHttpClient.Builder()
    .addInterceptor(DReaction.network?.getInterceptor() ?: error("Network plugin not initialized"))
    .build()
```

All HTTP requests made with this client will be logged to DReaction.

### 4. Register Custom Commands

#### Using Annotations (Recommended) ⭐

The easiest way to register custom commands is using annotations with automatic registration.

**Prerequisites**: Add KSP plugin and dreaction-compiler dependency to your app's `build.gradle.kts`:

```kotlin
plugins {
    id("com.google.devtools.ksp") version "1.9.20-1.0.14"
}

dependencies {
    ksp("com.github.moonrailgun:dreaction-compiler:android-1.0.0")
}
```

**Usage**:

```kotlin
// 1. Pass context when enabling custom commands
DReaction.configure(config)
    .useCustomCommand(this) // Pass context for auto-registration
    .connect()

// 2. Create a class with annotated methods
class MyCommands {
    @CustomCommand(
        command = "getInfo",
        title = "Get App Info",
        description = "Returns app information"
    )
    fun getAppInfo(): Map<String, Any> {
        return mapOf("version" to "1.0.0")
    }
    
    @CustomCommand(command = "echo")
    fun echo(message: String): String {
        return "Echo: $message"
    }
    
    // Supports suspend functions!
    @CustomCommand(command = "asyncOp")
    suspend fun asyncOperation(): String {
        delay(1000)
        return "Done!"
    }
}
```

**Java Support**: Use `@Param` annotation for parameters in Java:

```java
public class JavaCommands {
    @CustomCommand(command = "javaEcho", title = "Java Echo")
    public String echo(@Param("message") String msg) {
        return "Java Echo: " + msg;
    }
}
```

Commands are automatically discovered and registered at compile-time with zero runtime overhead! See [ANNOTATION_GUIDE.md](ANNOTATION_GUIDE.md) for details.

#### Manual Registration (Still Supported)

```kotlin
DReaction.customCommand?.registerCommand(
    command = "clearCache",
    title = "Clear Cache",
    description = "Clears the app cache"
) {
    cacheDir.deleteRecursively()
    "Cache cleared successfully"
}

// With arguments
DReaction.customCommand?.registerCommand(
    command = "setFeatureFlag",
    title = "Set Feature Flag",
    description = "Enable or disable a feature flag",
    args = listOf(
        CustomCommandArg(
            name = "flag",
            type = "string"
        ),
        CustomCommandArg(
            name = "enabled",
            type = "string",
            options = listOf(
                CustomCommandOption("Enabled", "true"),
                CustomCommandOption("Disabled", "false")
            )
        )
    )
) { args ->
    val flag = args["flag"]
    val enabled = args["enabled"].toBoolean()
    // Set feature flag
    "Feature flag '$flag' set to $enabled"
}
```

### 5. Monitor SharedPreferences

SharedPreferences changes are automatically tracked when you use `useSharedPreferences()`:

```kotlin
val prefs = getSharedPreferences("my_prefs", MODE_PRIVATE)
prefs.edit()
    .putString("username", "john")
    .putInt("count", 42)
    .apply()
// These changes will appear in DReaction desktop client
```

## Configuration

### DReactionConfig Options

```kotlin
DReactionConfig(
    host = "localhost",              // Server host (use 10.0.2.2 for emulator)
    port = 9600,                     // Server port
    secure = false,                  // Use wss:// instead of ws://
    name = "Android App",            // App name displayed in DReaction
    environment = "development",     // Environment name
    clientInfo = mapOf(              // Additional client info
        "build" to "debug"
    ),
    reconnect = true,                // Auto reconnect on disconnect
    reconnectDelay = 2000            // Reconnect delay in milliseconds
)
```

### Network Tips

- **Android Emulator**: Use `10.0.2.2` to reach the host machine
- **Physical Device**: Use your dev machine's IP address (e.g., `192.168.1.100`)
- **Make sure both devices are on the same network**

## API Reference

### DReaction

Main API entry point.

```kotlin
DReaction.configure(config)  // Configure and get builder
    .useLogger()            // Enable logger plugin
    .useNetwork()           // Enable network monitoring
    .usePerformance(context) // Enable performance monitoring
    .useCustomCommand(context) // Enable custom commands (pass context for annotations)
    .useSharedPreferences(context, prefsName) // Enable SharedPreferences monitoring
    .use(customPlugin)      // Add custom plugin
    .connect()              // Connect to server

DReaction.disconnect()      // Disconnect and cleanup
```

### LoggerPlugin

```kotlin
DReaction.logger?.debug(message, ...args)
DReaction.logger?.info(message, ...args)
DReaction.logger?.warn(message, ...args)
DReaction.logger?.error(message, throwable?, ...args)
```

### NetworkPlugin

```kotlin
val interceptor = DReaction.network?.getInterceptor()
// Add to OkHttpClient.Builder
```

### PerformancePlugin

```kotlin
DReaction.performance?.startMonitoring(intervalMs = 1000)
DReaction.performance?.stopMonitoring()
```

### CustomCommandPlugin

```kotlin
val unregister = DReaction.customCommand?.registerCommand(
    command = "myCommand",
    title = "My Command",
    description = "Does something useful",
    args = listOf(...),
    responseViewType = "auto" // or "table"
) { args ->
    // Handler logic
    return "Result"
}

// Unregister when done
unregister()
```

## Custom Plugins

Create your own plugin by extending the `Plugin` class:

```kotlin
import com.moonrailgun.dreaction.Plugin
import com.moonrailgun.dreaction.models.Command

class MyCustomPlugin : Plugin() {
    override fun onConnect() {
        // Called when connected to server
        send("myPlugin.hello", mapOf("message" to "Hello!"))
    }
    
    override fun onDisconnect() {
        // Called when disconnected
    }
    
    override fun onCommand(command: Command) {
        // Handle incoming commands
        if (command.type == "myPlugin.doSomething") {
            // Handle command
        }
    }
    
    fun customMethod() {
        send("myPlugin.event", mapOf("data" to "value"))
    }
}

// Use it
DReaction.configure(config)
    .use(MyCustomPlugin())
    .connect()
```

## Example App

Check out the example app in the `example/` directory for a complete working example.

To run the example:

1. Start the DReaction desktop client
2. Open the project in Android Studio
3. Update the host IP in `ExampleApplication.kt`
4. Run the app

## Building

```bash
# Build the library
./gradlew :dreaction:assembleRelease

# Run tests
./gradlew :dreaction:test

# Build example app
./gradlew :example:assembleDebug

# Publish to local Maven
./gradlew :dreaction:publishToMavenLocal
```

## Requirements

- Android API 21+ (Android 5.0 Lollipop)
- Kotlin 1.9+
- OkHttp 4.12+

## License

MIT License

## Credits

This project is inspired by [Reactotron](https://github.com/infinitered/reactotron) and is part of the [DReaction](https://github.com/moonrailgun/dreaction) project.
