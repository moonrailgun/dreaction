package com.moonrailgun.dreaction

import com.moonrailgun.dreaction.models.Command

abstract class Plugin {
    protected var client: DReactionClient? = null

    open fun onAttach(client: DReactionClient) {
        this.client = client
    }

    open fun onConnect() {}

    open fun onDisconnect() {}

    open fun onCommand(command: Command) {}

    protected fun send(type: String, payload: Any? = null, important: Boolean = false) {
        client?.send(type, payload, important)
    }
}
