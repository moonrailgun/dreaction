# Add project specific ProGuard rules here.
# Keep DReaction public API
-keep public class com.moonrailgun.dreaction.DReaction { *; }
-keep public class com.moonrailgun.dreaction.DReactionConfig { *; }
-keep public class com.moonrailgun.dreaction.Plugin { *; }
-keep public class com.moonrailgun.dreaction.plugins.** { *; }

# Keep WebSocket classes
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }

# Keep Gson classes
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Keep model classes for Gson
-keepclassmembers,allowobfuscation class com.moonrailgun.dreaction.models.** {
    <fields>;
}
