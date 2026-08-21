# Aippy Matrix Messenger Stack

This folder integrates mature open-source Matrix components instead of implementing a messenger from scratch.

## Core stack

- Synapse: Matrix homeserver/backend.
- Element Web: production web client.
- Element X iOS: production iOS client built on Matrix Rust SDK.
- Element X Android: production Android client built on Matrix Rust SDK.
- Element Call + MatrixRTC/LiveKit: voice/video calling.
- Matrix Rust SDK: client SDK and end-to-end encryption implementation.
- matrix-docker-ansible-deploy: reproducible deployment of the server stack.
- Sygnal: optional self-hosted push gateway for custom iOS/Android builds.

The upstream projects are attached under this folder as Git submodules by the import workflow, so the Aippy repository stays small while the official source remains directly available.

## Product capabilities

Matrix/Element provides username-based Matrix IDs (`@username:your-domain`) and does not require phone-number identity. The clients support encrypted direct/group chats, images, video, files, voice messages, reactions, read receipts, replies, search and multi-device use. Calls use MatrixRTC/Element Call. End-to-end encryption is provided by Matrix's audited ecosystem and the Matrix Rust SDK rather than custom cryptography.

## Deployment

The deployment submodule is `matrix-messenger/deploy`.

1. Copy `config/vars.example.yml` into the deployment inventory for your domain.
2. Set your domain/server details and secrets.
3. Configure DNS for the Matrix and Element hostnames.
4. Run the playbook from `matrix-messenger/deploy` with `just setup-all` (or the documented Ansible command).

A real public deployment requires a Linux server/VPS and a domain. GitHub Pages cannot host Synapse, MatrixRTC/LiveKit, PostgreSQL or Sygnal.

## Push notifications

`config/vars.push.example.yml` contains the Sygnal configuration skeleton. A custom iOS build requires your own APNs key/certificate and app bundle ID; Android requires your own FCM project credentials. Those secrets must never be committed to GitHub.

## Upstream licensing

Each submodule retains its upstream license. Element X and Element Call are AGPL/commercial dual licensed; Matrix Rust SDK is Apache-2.0. Review upstream license requirements before distributing a modified branded client.
