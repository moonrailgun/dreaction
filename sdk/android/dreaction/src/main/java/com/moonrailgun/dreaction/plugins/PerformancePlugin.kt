package com.moonrailgun.dreaction.plugins

import android.app.ActivityManager
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.Choreographer
import com.moonrailgun.dreaction.Plugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class PerformancePlugin(private val context: Context) : Plugin() {

    private var monitoringJob: Job? = null
    private val handler = Handler(Looper.getMainLooper())
    private var isMonitoring = false

    fun startMonitoring(intervalMs: Long = 1000) {
        if (isMonitoring) return

        isMonitoring = true
        monitorFPS()
//        monitorMemory(intervalMs)
    }

    fun stopMonitoring() {
        isMonitoring = false
        monitoringJob?.cancel()
        monitoringJob = null
    }

    private fun monitorFPS() {
        handler.post(object : Runnable {
            private var frameCount = 0
            private var startTime = System.nanoTime()

            override fun run() {
                if (!isMonitoring) return

                Choreographer.getInstance().postFrameCallback {
                    frameCount++
                    val currentTime = System.nanoTime()
                    val elapsed = (currentTime - startTime) / 1_000_000_000.0

                    if (elapsed >= 1.0) {
                        val fps = frameCount / elapsed

                        send("profiler.fps", mapOf(
                            "fps" to fps
                        ))

                        frameCount = 0
                        startTime = currentTime
                    }

                    if (isMonitoring) {
                        handler.post(this)
                    }
                }
            }
        })
    }

    private fun monitorMemory(intervalMs: Long) {
        monitoringJob = CoroutineScope(Dispatchers.Default).launch {
            val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val memInfo = ActivityManager.MemoryInfo()

            while (isActive && isMonitoring) {
                try {
                    activityManager.getMemoryInfo(memInfo)

                    val runtime = Runtime.getRuntime()
                    val usedMemory = runtime.totalMemory() - runtime.freeMemory()
                    val maxMemory = runtime.maxMemory()
                    val availableMemory = memInfo.availMem
                    val totalMemory = memInfo.totalMem

                    send("profiler.memory", mapOf(
                        "usedMemoryMB" to (usedMemory / 1024 / 1024),
                        "maxMemoryMB" to (maxMemory / 1024 / 1024),
                        "availableMemoryMB" to (availableMemory / 1024 / 1024),
                        "totalMemoryMB" to (totalMemory / 1024 / 1024)
                    ))
                } catch (e: Exception) {
                    // Ignore errors
                }

                delay(intervalMs)
            }
        }
    }

    override fun onDisconnect() {
        super.onDisconnect()
        stopMonitoring()
    }
}
