package com.zoltrok.billx.pos

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.zoltrok.billx.printer.BillxPrinterPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(BillxPrinterPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
