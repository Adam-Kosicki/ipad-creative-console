package com.adamk.tvassistant;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

final class Wav {
    /** 16 kHz mono 16-bit PCM -> WAV file bytes. */
    static byte[] fromPcm(short[] pcm, int length) {
        int dataBytes = length * 2;
        ByteBuffer b = ByteBuffer.allocate(44 + dataBytes).order(ByteOrder.LITTLE_ENDIAN);
        b.put("RIFF".getBytes()).putInt(36 + dataBytes).put("WAVE".getBytes());
        b.put("fmt ".getBytes()).putInt(16).putShort((short) 1).putShort((short) 1)
                .putInt(16000).putInt(32000).putShort((short) 2).putShort((short) 16);
        b.put("data".getBytes()).putInt(dataBytes);
        for (int i = 0; i < length; i++) b.putShort(pcm[i]);
        return b.array();
    }
}
