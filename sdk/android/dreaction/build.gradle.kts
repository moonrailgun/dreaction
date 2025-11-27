plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    `maven-publish`
}

android {
    namespace = "com.moonrailgun.dreaction"
    compileSdk = 34

    defaultConfig {
        minSdk = 21
        targetSdk = 34

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles("consumer-rules.pro")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }

    publishing {
        singleVariant("release") {
            withSourcesJar()
            withJavadocJar()
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // WebSocket
    api("com.squareup.okhttp3:okhttp:4.12.0")

    // JSON
    implementation("com.google.code.gson:gson:2.10.1")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}

afterEvaluate {
    publishing {
        publications {
            create<MavenPublication>("release") {
                from(components["release"])

                groupId = "com.moonrailgun.dreaction"
                artifactId = "core"
                version = "1.0.0"

                pom {
                    name.set("DReaction Android SDK")
                    description.set("DReaction client for native Android applications")
                    url.set("https://github.com/moonrailgun/dreaction")

                    licenses {
                        license {
                            name.set("MIT License")
                            url.set("https://opensource.org/licenses/MIT")
                        }
                    }

                    developers {
                        developer {
                            id.set("moonrailgun")
                            name.set("moonrailgun")
                            email.set("moonrailgun@gmail.com")
                        }
                    }

                    scm {
                        connection.set("scm:git:git://github.com/moonrailgun/dreaction.git")
                        developerConnection.set("scm:git:ssh://git@github.com/moonrailgun/dreaction.git")
                        url.set("https://github.com/moonrailgun/dreaction")
                    }
                }
            }
        }
    }
}
