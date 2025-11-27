package com.moonrailgun.dreaction.example

import android.content.SharedPreferences
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.moonrailgun.dreaction.DReaction
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request

class MainActivity : AppCompatActivity() {

    private lateinit var sharedPreferences: SharedPreferences
    private val httpClient = OkHttpClient.Builder()
        .addInterceptor(DReaction.network?.getInterceptor() ?: error("Network plugin not initialized"))
        .build()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        sharedPreferences = getSharedPreferences("${packageName}_preferences", MODE_PRIVATE)

        setupViews()

        DReaction.logger?.info("MainActivity created")
    }

    private fun setupViews() {
        val textView = findViewById<TextView>(R.id.textView)
        val editText = findViewById<EditText>(R.id.editText)
        val btnLog = findViewById<Button>(R.id.btnLog)
        val btnNetwork = findViewById<Button>(R.id.btnNetwork)
        val btnPrefs = findViewById<Button>(R.id.btnPrefs)
        val btnError = findViewById<Button>(R.id.btnError)

        btnLog.setOnClickListener {
            val message = editText.text.toString().ifEmpty {
                "Current time: ${System.currentTimeMillis()}"
            }
            DReaction.logger?.info(message)
            textView.text = "Logged: $message"
            editText.text.clear()
        }

        btnNetwork.setOnClickListener {
            textView.text = "Making network request..."
            makeNetworkRequest { result ->
                textView.text = "Response: ${result.take(100)}..."
            }
        }

        btnPrefs.setOnClickListener {
            val count = sharedPreferences.getInt("click_count", 0) + 1
            sharedPreferences.edit().putInt("click_count", count).apply()
            sharedPreferences.edit().putString("last_click", System.currentTimeMillis().toString()).apply()
            textView.text = "SharedPreferences updated: click_count = $count"
            DReaction.logger?.debug("Preferences updated", "count" to count)
        }

        btnError.setOnClickListener {
            try {
                throw RuntimeException("This is a test error")
            } catch (e: Exception) {
                DReaction.logger?.error("An error occurred", e)
                textView.text = "Error logged to DReaction"
            }
        }
    }

    private fun makeNetworkRequest(callback: (String) -> Unit) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val request = Request.Builder()
                    .url("https://jsonplaceholder.typicode.com/posts/1")
                    .build()

                val response = httpClient.newCall(request).execute()
                val body = response.body?.string() ?: "No body"

                withContext(Dispatchers.Main) {
                    callback(body)
                }
            } catch (e: Exception) {
                DReaction.logger?.error("Network request failed", e)
                withContext(Dispatchers.Main) {
                    callback("Error: ${e.message}")
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        DReaction.logger?.info("MainActivity destroyed")
    }
}
