#!/usr/bin/env python3
"""MeshChat TCP/IP-brug: WebSocket (browser) <-> TCP (MeshCore WiFi-companion, poort 5000).

Een browser mag geen ruwe TCP-verbinding openen, alleen WebSocket. Dit script draait op een
pc of Raspberry Pi in hetzelfde netwerk als de node en geeft de bytes ongewijzigd door in
beide richtingen; de framing ('<'/'>' + lengte) blijft die van de companion zelf.

Alleen de standaardbibliotheek, geen pip nodig.

Gebruik:
    python meshchat-bridge.py <ip-van-de-node> [node-poort] [--listen 127.0.0.1:5005] [--tls cert.pem key.pem]

Daarna in MeshChat: knop TCP/IP en als adres  ws://127.0.0.1:5005

Standaard luistert de brug alleen op 127.0.0.1 (de eigen pc): de gehoste MeshChat (https)
mag van de browser alleen naar 'localhost' een onbeveiligde ws://-verbinding openen. Wil je
de brug op een andere machine draaien (bv. een Pi), gebruik dan --listen 0.0.0.0:5005 en
open MeshChat als los bestand of via http; of geef --tls cert.pem key.pem mee: dan luistert de
brug als wss:// en werkt hij ook vanaf de gehoste https-versie. Een zelfgetekend certificaat
volstaat: openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 3650
-subj /CN=meshchat-bridge ; open daarna één keer https://<brug>:5005/ in de browser en aanvaard
het certificaat (de brug toont dan "MeshChat bridge OK"), en verbind met wss://<brug>:5005.
"""
import argparse
import asyncio
import base64
import hashlib
import ssl
import struct
import sys

GUID = b"258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


async def ws_handshake(reader, writer):
    req = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), 10)
    lines = req.decode("latin-1").split("\r\n")
    headers = {}
    for line in lines[1:]:
        if ":" in line:
            k, v = line.split(":", 1)
            headers[k.strip().lower()] = v.strip()
    key = headers.get("sec-websocket-key")
    if not key or "websocket" not in headers.get("upgrade", "").lower():
        # Gewone browseraanvraag (bv. om het certificaat te aanvaarden): kort antwoord.
        body = b"MeshChat bridge OK\n"
        writer.write(b"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: %d\r\nConnection: close\r\n\r\n" % len(body) + body)
        await writer.drain()
        raise ConnectionError("geen WebSocket-handshake (gewone HTTP-aanvraag beantwoord)")
    accept = base64.b64encode(hashlib.sha1(key.encode() + GUID).digest()).decode()
    writer.write(("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\n"
                  "Connection: Upgrade\r\nSec-WebSocket-Accept: %s\r\n\r\n" % accept).encode())
    await writer.drain()


async def ws_read_message(reader):
    """Eén volledig bericht (binair of tekst) als bytes; None bij close."""
    payload = bytearray()
    while True:
        b1, b2 = await reader.readexactly(2)
        fin, opcode = b1 & 0x80, b1 & 0x0F
        masked, ln = b2 & 0x80, b2 & 0x7F
        if ln == 126:
            ln = struct.unpack(">H", await reader.readexactly(2))[0]
        elif ln == 127:
            ln = struct.unpack(">Q", await reader.readexactly(8))[0]
        mask = await reader.readexactly(4) if masked else None
        data = bytearray(await reader.readexactly(ln))
        if mask:
            for i in range(len(data)):
                data[i] ^= mask[i & 3]
        if opcode == 0x8:
            return None
        if opcode == 0x9:                       # ping -> pong
            return ("pong", bytes(data))
        if opcode in (0x0, 0x1, 0x2):
            payload += data
            if fin:
                return bytes(payload)
        # pong (0xA) en onbekende opcodes: negeren


def ws_frame(data, opcode=0x2):
    ln = len(data)
    if ln < 126:
        hdr = bytes([0x80 | opcode, ln])
    elif ln < 65536:
        hdr = bytes([0x80 | opcode, 126]) + struct.pack(">H", ln)
    else:
        hdr = bytes([0x80 | opcode, 127]) + struct.pack(">Q", ln)
    return hdr + data


async def handle(ws_reader, ws_writer, node_host, node_port):
    peer = ws_writer.get_extra_info("peername")
    try:
        await ws_handshake(ws_reader, ws_writer)
    except Exception as e:  # noqa: BLE001
        print(f"[brug] {peer}: {e}", flush=True)
        ws_writer.close()
        return
    try:
        tcp_reader, tcp_writer = await asyncio.wait_for(asyncio.open_connection(node_host, node_port), 10)
    except Exception as e:  # noqa: BLE001
        print(f"[brug] {peer}: node {node_host}:{node_port} onbereikbaar: {e}", flush=True)
        ws_writer.write(ws_frame(struct.pack(">H", 1011) + f"node onbereikbaar: {e}".encode()[:100], 0x8))
        await ws_writer.drain()
        ws_writer.close()
        return
    print(f"[brug] {peer} <-> {node_host}:{node_port} verbonden", flush=True)

    async def ws_to_tcp():
        while True:
            msg = await ws_read_message(ws_reader)
            if msg is None:
                break
            if isinstance(msg, tuple):           # pong beantwoorden
                ws_writer.write(ws_frame(msg[1], 0xA))
                await ws_writer.drain()
                continue
            tcp_writer.write(msg)
            await tcp_writer.drain()

    async def tcp_to_ws():
        while True:
            data = await tcp_reader.read(4096)
            if not data:
                break
            ws_writer.write(ws_frame(data))
            await ws_writer.drain()

    tasks = [asyncio.create_task(ws_to_tcp()), asyncio.create_task(tcp_to_ws())]
    try:
        await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    except Exception as e:  # noqa: BLE001
        print(f"[brug] {peer}: {e}", flush=True)
    finally:
        for t in tasks:
            t.cancel()
        for w in (ws_writer, tcp_writer):
            try:
                w.close()
            except Exception:  # noqa: BLE001
                pass
        print(f"[brug] {peer} verbroken", flush=True)


async def main():
    ap = argparse.ArgumentParser(description="MeshChat WebSocket<->TCP-brug voor de MeshCore WiFi-companion")
    ap.add_argument("node", help="IP-adres of hostnaam van de node")
    ap.add_argument("port", nargs="?", type=int, default=5000, help="TCP-poort van de node (standaard 5000)")
    ap.add_argument("--listen", default="127.0.0.1:5005", help="adres:poort waarop de brug luistert (standaard 127.0.0.1:5005)")
    ap.add_argument("--tls", nargs=2, metavar=("CERT", "KEY"), help="TLS-certificaat en sleutel (PEM): luister als wss://")
    a = ap.parse_args()
    host, _, port = a.listen.rpartition(":")
    ctx = None
    if a.tls:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(a.tls[0], a.tls[1])
    server = await asyncio.start_server(lambda r, w: handle(r, w, a.node, a.port), host or "127.0.0.1", int(port), ssl=ctx)
    scheme = "wss" if ctx else "ws"
    shown = "127.0.0.1" if host in ("", "127.0.0.1", "0.0.0.0") else host
    print(f"[brug] luistert op {scheme}://{host or '127.0.0.1'}:{port} -> node {a.node}:{a.port}", flush=True)
    print(f"[brug] MeshChat: knop TCP/IP, adres {scheme}://{shown}:{port}", flush=True)
    if ctx:
        print(f"[brug] zelfgetekend certificaat? Open eerst https://{shown}:{port}/ in de browser en aanvaard het.", flush=True)
    async with server:
        await server.serve_forever()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)
