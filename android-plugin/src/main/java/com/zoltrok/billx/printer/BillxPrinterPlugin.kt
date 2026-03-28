package com.zoltrok.billx.printer

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Base64
import android.util.Log
import androidx.core.app.ActivityCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import java.io.IOException
import java.io.OutputStream
import java.util.UUID

@CapacitorPlugin(
    name = "BillxPrinter",
    permissions = [
        Permission(
            strings = [
                Manifest.permission.BLUETOOTH,
                Manifest.permission.BLUETOOTH_ADMIN,
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.ACCESS_FINE_LOCATION,
            ],
            alias = "bluetooth"
        )
    ]
)
class BillxPrinterPlugin : Plugin() {

    companion object {
        private const val TAG = "BillxPrinter"
        // Standard SPP UUID for Bluetooth serial communication
        private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
        private const val PREFS_NAME = "billx_printer_prefs"
        private const val KEY_DEFAULT_ADDRESS = "default_printer_address"
        private const val KEY_DEFAULT_TYPE = "default_printer_type"
    }

    private var bluetoothSocket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private var connectedDevice: BluetoothDevice? = null
    private var connectedType: String? = null // "bluetooth" or "usb"
    private var usbOutputStream: OutputStream? = null

    // ── Bluetooth Scanning ──────────────────────────────────────

    @PluginMethod
    fun scanBluetoothDevices(call: PluginCall) {
        if (!hasBluetoothPermissions()) {
            requestPermissionForAlias("bluetooth", call, "handleBluetoothPermission")
            return
        }

        try {
            val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
            val adapter = bluetoothManager.adapter

            if (adapter == null || !adapter.isEnabled) {
                call.reject("Bluetooth is not enabled")
                return
            }

            val devices = JSArray()
            val pairedDevices = adapter.bondedDevices

            for (device in pairedDevices) {
                val deviceObj = JSObject()
                deviceObj.put("id", device.address)
                deviceObj.put("name", device.name ?: "Unknown Device")
                deviceObj.put("address", device.address)
                deviceObj.put("type", "bluetooth")
                deviceObj.put("paired", true)
                devices.put(deviceObj)
            }

            val result = JSObject()
            result.put("devices", devices)
            call.resolve(result)

        } catch (e: SecurityException) {
            call.reject("Bluetooth permission denied: ${e.message}")
        } catch (e: Exception) {
            call.reject("Scan failed: ${e.message}")
        }
    }

    @PermissionCallback
    private fun handleBluetoothPermission(call: PluginCall) {
        if (hasBluetoothPermissions()) {
            scanBluetoothDevices(call)
        } else {
            call.reject("Bluetooth permission denied")
        }
    }

    // ── Bluetooth Connection ────────────────────────────────────

    @PluginMethod
    fun connectBluetoothPrinter(call: PluginCall) {
        val deviceAddress = call.getString("deviceAddress")
        if (deviceAddress.isNullOrEmpty()) {
            call.reject("Device address is required")
            return
        }

        if (!hasBluetoothPermissions()) {
            requestPermissionForAlias("bluetooth", call, "handleBluetoothPermission")
            return
        }

        Thread {
            try {
                // Disconnect existing connection
                disconnectInternal()

                val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
                val adapter = bluetoothManager.adapter
                val device = adapter.getRemoteDevice(deviceAddress)

                // Cancel discovery to speed up connection
                try { adapter.cancelDiscovery() } catch (_: SecurityException) {}

                val socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                socket.connect()

                bluetoothSocket = socket
                outputStream = socket.outputStream
                connectedDevice = device
                connectedType = "bluetooth"

                Log.i(TAG, "Connected to ${device.name} (${device.address})")

                val result = JSObject()
                result.put("success", true)
                activity.runOnUiThread { call.resolve(result) }

            } catch (e: IOException) {
                Log.e(TAG, "Connection failed: ${e.message}")
                activity.runOnUiThread {
                    val result = JSObject()
                    result.put("success", false)
                    result.put("error", "Connection failed: ${e.message}")
                    call.resolve(result)
                }
            } catch (e: SecurityException) {
                activity.runOnUiThread { call.reject("Bluetooth permission denied") }
            }
        }.start()
    }

    // ── USB Connection ──────────────────────────────────────────

    @PluginMethod
    fun connectUSBPrinter(call: PluginCall) {
        try {
            val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
            val deviceList = usbManager.deviceList

            // Find first printer-class USB device
            var printerDevice: UsbDevice? = null
            for ((_, device) in deviceList) {
                for (i in 0 until device.interfaceCount) {
                    val iface = device.getInterface(i)
                    if (iface.interfaceClass == UsbConstants.USB_CLASS_PRINTER) {
                        printerDevice = device
                        break
                    }
                }
                if (printerDevice != null) break
            }

            if (printerDevice == null) {
                val result = JSObject()
                result.put("success", false)
                result.put("error", "No USB printer found")
                call.resolve(result)
                return
            }

            val connection = usbManager.openDevice(printerDevice)
            if (connection == null) {
                val result = JSObject()
                result.put("success", false)
                result.put("error", "Cannot open USB device — permission may be required")
                call.resolve(result)
                return
            }

            // Find the bulk OUT endpoint
            val iface = printerDevice.getInterface(0)
            var outEndpoint: android.hardware.usb.UsbEndpoint? = null
            for (i in 0 until iface.endpointCount) {
                val ep = iface.getEndpoint(i)
                if (ep.type == UsbConstants.USB_ENDPOINT_XFER_BULK && ep.direction == UsbConstants.USB_DIR_OUT) {
                    outEndpoint = ep
                    break
                }
            }

            if (outEndpoint == null) {
                val result = JSObject()
                result.put("success", false)
                result.put("error", "No output endpoint found on USB printer")
                call.resolve(result)
                return
            }

            connection.claimInterface(iface, true)
            connectedType = "usb"

            // Store connection for printing
            // Note: USB printing uses UsbDeviceConnection.bulkTransfer directly
            // We store references for use in printReceipt
            usbConnectionRef = connection
            usbEndpointRef = outEndpoint

            val result = JSObject()
            result.put("success", true)
            call.resolve(result)

        } catch (e: Exception) {
            val result = JSObject()
            result.put("success", false)
            result.put("error", "USB connection error: ${e.message}")
            call.resolve(result)
        }
    }

    private var usbConnectionRef: android.hardware.usb.UsbDeviceConnection? = null
    private var usbEndpointRef: android.hardware.usb.UsbEndpoint? = null

    // ── Disconnect ──────────────────────────────────────────────

    @PluginMethod
    fun disconnectPrinter(call: PluginCall) {
        disconnectInternal()
        val result = JSObject()
        result.put("success", true)
        call.resolve(result)
    }

    private fun disconnectInternal() {
        try {
            outputStream?.close()
            bluetoothSocket?.close()
            usbConnectionRef?.close()
        } catch (_: Exception) {}

        outputStream = null
        bluetoothSocket = null
        connectedDevice = null
        usbConnectionRef = null
        usbEndpointRef = null
        connectedType = null
    }

    // ── Print Receipt ───────────────────────────────────────────

    @PluginMethod
    fun printReceipt(call: PluginCall) {
        val base64Data = call.getString("data")
        if (base64Data.isNullOrEmpty()) {
            call.reject("Print data is required")
            return
        }

        Thread {
            try {
                val bytes = Base64.decode(base64Data, Base64.DEFAULT)

                when (connectedType) {
                    "bluetooth" -> {
                        val os = outputStream
                        if (os == null) {
                            activity.runOnUiThread {
                                val result = JSObject()
                                result.put("success", false)
                                result.put("error", "Printer not connected")
                                call.resolve(result)
                            }
                            return@Thread
                        }
                        os.write(bytes)
                        os.flush()
                    }
                    "usb" -> {
                        val conn = usbConnectionRef
                        val ep = usbEndpointRef
                        if (conn == null || ep == null) {
                            activity.runOnUiThread {
                                val result = JSObject()
                                result.put("success", false)
                                result.put("error", "USB printer not connected")
                                call.resolve(result)
                            }
                            return@Thread
                        }
                        // Send in chunks to avoid buffer overflow
                        val chunkSize = ep.maxPacketSize
                        var offset = 0
                        while (offset < bytes.size) {
                            val length = minOf(chunkSize, bytes.size - offset)
                            val chunk = bytes.copyOfRange(offset, offset + length)
                            conn.bulkTransfer(ep, chunk, chunk.size, 5000)
                            offset += length
                        }
                    }
                    else -> {
                        activity.runOnUiThread {
                            val result = JSObject()
                            result.put("success", false)
                            result.put("error", "No printer connected")
                            call.resolve(result)
                        }
                        return@Thread
                    }
                }

                Log.i(TAG, "Printed ${bytes.size} bytes successfully")
                activity.runOnUiThread {
                    val result = JSObject()
                    result.put("success", true)
                    call.resolve(result)
                }

            } catch (e: IOException) {
                Log.e(TAG, "Print failed: ${e.message}")
                // Attempt reconnect
                connectedType = null
                activity.runOnUiThread {
                    val result = JSObject()
                    result.put("success", false)
                    result.put("error", "Print failed: ${e.message}")
                    call.resolve(result)
                }
            }
        }.start()
    }

    // ── Printer Status ──────────────────────────────────────────

    @PluginMethod
    fun getPrinterStatus(call: PluginCall) {
        val result = JSObject()

        val isConnected = when (connectedType) {
            "bluetooth" -> bluetoothSocket?.isConnected == true
            "usb" -> usbConnectionRef != null
            else -> false
        }

        result.put("status", if (isConnected) "CONNECTED" else "DISCONNECTED")

        if (isConnected && connectedType == "bluetooth" && connectedDevice != null) {
            try {
                result.put("deviceName", connectedDevice!!.name ?: "Printer")
                result.put("deviceAddress", connectedDevice!!.address)
            } catch (_: SecurityException) {
                result.put("deviceName", "Printer")
                result.put("deviceAddress", "")
            }
        } else if (isConnected && connectedType == "usb") {
            result.put("deviceName", "USB Printer")
            result.put("deviceAddress", "usb-auto")
        } else {
            result.put("deviceName", null)
            result.put("deviceAddress", null)
        }

        result.put("type", connectedType)
        call.resolve(result)
    }

    // ── Default Printer Persistence ─────────────────────────────

    @PluginMethod
    fun getDefaultPrinter(call: PluginCall) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val result = JSObject()
        result.put("address", prefs.getString(KEY_DEFAULT_ADDRESS, null))
        result.put("type", prefs.getString(KEY_DEFAULT_TYPE, null))
        call.resolve(result)
    }

    @PluginMethod
    fun setDefaultPrinter(call: PluginCall) {
        val address = call.getString("address") ?: return call.reject("Address required")
        val type = call.getString("type") ?: return call.reject("Type required")

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(KEY_DEFAULT_ADDRESS, address)
            .putString(KEY_DEFAULT_TYPE, type)
            .apply()

        call.resolve()
    }

    // ── Test Print ──────────────────────────────────────────────

    @PluginMethod
    fun testPrint(call: PluginCall) {
        Thread {
            try {
                val testData = buildTestReceipt()

                when (connectedType) {
                    "bluetooth" -> {
                        outputStream?.write(testData)
                        outputStream?.flush()
                    }
                    "usb" -> {
                        val conn = usbConnectionRef
                        val ep = usbEndpointRef
                        if (conn != null && ep != null) {
                            conn.bulkTransfer(ep, testData, testData.size, 5000)
                        } else {
                            throw IOException("USB not connected")
                        }
                    }
                    else -> throw IOException("No printer connected")
                }

                activity.runOnUiThread {
                    val result = JSObject()
                    result.put("success", true)
                    call.resolve(result)
                }
            } catch (e: Exception) {
                activity.runOnUiThread {
                    val result = JSObject()
                    result.put("success", false)
                    result.put("error", e.message)
                    call.resolve(result)
                }
            }
        }.start()
    }

    private fun buildTestReceipt(): ByteArray {
        val buf = mutableListOf<Byte>()

        // ESC @ (initialize)
        buf.addAll(byteArrayOf(0x1b, 0x40).toList())
        // Center align
        buf.addAll(byteArrayOf(0x1b, 0x61, 0x01).toList())
        // Bold on
        buf.addAll(byteArrayOf(0x1b, 0x45, 0x01).toList())
        // Double size
        buf.addAll(byteArrayOf(0x1d, 0x21, 0x30).toList())

        buf.addAll("billX POS\n".toByteArray().toList())

        // Normal size
        buf.addAll(byteArrayOf(0x1d, 0x21, 0x00).toList())
        buf.addAll(byteArrayOf(0x1b, 0x45, 0x00).toList())

        buf.addAll("Printer Test Page\n".toByteArray().toList())
        buf.addAll("--------------------------------\n".toByteArray().toList())
        buf.addAll("If you can read this,\n".toByteArray().toList())
        buf.addAll("your printer is working!\n".toByteArray().toList())
        buf.addAll("--------------------------------\n".toByteArray().toList())

        // Left align
        buf.addAll(byteArrayOf(0x1b, 0x61, 0x00).toList())
        buf.addAll("Paper: OK\n".toByteArray().toList())
        buf.addAll("Connection: OK\n".toByteArray().toList())
        buf.addAll("Status: Ready\n".toByteArray().toList())

        // Center
        buf.addAll(byteArrayOf(0x1b, 0x61, 0x01).toList())
        buf.addAll("--------------------------------\n".toByteArray().toList())
        buf.addAll("Powered by Zoltrok Tech LLP\n".toByteArray().toList())

        // Feed & cut
        buf.addAll("\n\n\n".toByteArray().toList())
        buf.addAll(byteArrayOf(0x1d, 0x56, 0x00).toList())

        return buf.toByteArray()
    }

    // ── Helpers ─────────────────────────────────────────────────

    private fun hasBluetoothPermissions(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ActivityCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED &&
            ActivityCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED
        } else {
            ActivityCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH) == PackageManager.PERMISSION_GRANTED
        }
    }
}
