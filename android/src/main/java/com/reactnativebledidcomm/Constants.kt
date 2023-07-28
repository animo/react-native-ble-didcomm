package com.reactnativebledidcomm

object Constants {
    object Regex {
        const val UUID_REGEX =
            "[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}"
    }

    const val TAG = "BleDidcomm"
    const val CCC_DESCRIPTOR_UUID = "00002902-0000-1000-8000-00805f9b34fb"

    /*  The number of bytes we adjust for in the chunking algorithm to account for the data header
    (3 bytes) + 9 extra bytes to be sure = 12 bytes */
    const val NUMBER_OF_BYTES_FOR_DATA_HEADER = 12
}
