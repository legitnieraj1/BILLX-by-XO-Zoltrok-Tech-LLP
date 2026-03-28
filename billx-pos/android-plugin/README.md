# BillxPrinter Capacitor Plugin

Native Android plugin for ESC/POS thermal printer support via Bluetooth and USB.

## Installation

After running `npx cap add android`, register this plugin in `MainActivity.kt`:

```kotlin
// android/app/src/main/java/com/zoltrok/billx/pos/MainActivity.kt

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
```

## Android Manifest Permissions

Add these to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<uses-feature android:name="android.hardware.bluetooth" android:required="false" />
<uses-feature android:name="android.hardware.usb.host" android:required="false" />
```

## Plugin Methods

| Method | Description |
|---|---|
| `scanBluetoothDevices()` | List paired Bluetooth devices |
| `connectBluetoothPrinter({ deviceAddress })` | Connect to BT printer |
| `connectUSBPrinter()` | Auto-detect and connect USB printer |
| `disconnectPrinter()` | Disconnect current printer |
| `printReceipt({ data })` | Print base64-encoded ESC/POS data |
| `getPrinterStatus()` | Get connection status |
| `getDefaultPrinter()` | Get saved default printer |
| `setDefaultPrinter({ address, type })` | Save default printer |
| `testPrint()` | Print a test page |
