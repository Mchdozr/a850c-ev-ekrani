plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "dev.evekrani.a850c"
    compileSdk = 35

    buildFeatures {
        buildConfig = true
    }

    defaultConfig {
        applicationId = "dev.evekrani.a850c"
        minSdk = 24
        val remoteUrl = (System.getenv("EV_REMOTE_URL") ?: "")
            .trim()
            .replace("\\", "")
            .replace("\"", "")
        buildConfigField("String", "EV_REMOTE_URL", "\"$remoteUrl\"")
        // 29 keeps the legacy read of /sdcard/Download on Google TV after the storage grant.
        targetSdk = 29
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation(project(":core"))
}
