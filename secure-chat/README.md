# Secure Chat Prototype

A browser-only proof of concept for encrypted peer-to-peer messaging and audio calling.

## What works

- Peer-to-peer text chat in the browser
- Per-session ECDH P-256 key agreement
- AES-256-GCM encryption for message contents before transmission
- Audio calling through WebRTC
- Mobile-friendly interface
- Installable PWA shell
- No application backend in this repository

## How to test

1. Open the hosted page on two different devices or browser profiles.
2. Give each side a display name.
3. Copy the connection ID from one side into the other side.
4. Tap **Connect securely**.
5. Wait until the badge says **End-to-end encrypted messages**.
6. Send messages or start an audio call.

## Architecture

Peer discovery/signaling currently uses the public PeerJS cloud signaling service. Message bodies are encrypted locally with a session key derived by ECDH and then encrypted with AES-256-GCM. The signaling service does not receive plaintext message bodies from this application.

Audio calls are direct WebRTC peer connections and use WebRTC's encrypted media transport. This demo does not implement WhatsApp/Signal-style safety-number verification, multi-device key management, encrypted backups, key rotation, group E2EE, or an independent identity directory.

## Important production note

This is a functional prototype, not an independently audited secure messenger. Do **not** market it as equivalent to WhatsApp or Signal security and do not use it for sensitive production communications until the cryptographic design, identity model, signaling infrastructure, abuse controls, authentication, privacy compliance, TURN setup, and client code have received professional security review.

For production, self-host the signaling/TURN infrastructure and add authenticated identities plus key verification.
