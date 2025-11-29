plugins {
    kotlin("jvm")
    id("maven-publish")
}

dependencies {
    implementation("com.google.devtools.ksp:symbol-processing-api:1.9.20-1.0.14")
    implementation("com.squareup:kotlinpoet:1.15.3")
    implementation("com.squareup:kotlinpoet-ksp:1.15.3")
}

java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
    withSourcesJar()
    withJavadocJar()
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions {
        jvmTarget = "11"
    }
}

// Read version from gradle.properties
val VERSION_NAME: String by project

publishing {
    publications {
        create<MavenPublication>("release") {
            from(components["java"])

            groupId = "com.github.moonrailgun"
            artifactId = "dreaction-compiler"
            version = VERSION_NAME

            pom {
                name.set("DReaction Compiler")
                description.set("KSP compiler for DReaction Android SDK annotation processing")
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

    repositories {
        maven {
            url = uri(layout.buildDirectory.dir("repo"))
        }
    }
}
