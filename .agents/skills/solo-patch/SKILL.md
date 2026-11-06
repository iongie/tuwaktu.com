---
name: solo-patch
description: >-
  Gunakan skill ini untuk penambalan kode langsung (solo-patch) secara mandiri.
  Wajib Solo Routine tanpa pendelegasian subagent, tanpa artefak plan, dan tanpa
  menjalankan suite pengujian monorepo penuh yang lambat.
---

# Solo Patch Skill

Panduan penambalan berkas langsung secara mandiri (Solo Mode) tanpa beban proses tambahan.

---

## Aturan Baku Eksekusi:

1. **Wajib Solo Routine**: Selesaikan seluruh pekerjaan sendiri tanpa memicu `invoke_subagent`.
2. **Tanpa Planning Mode**: Langsung eksekusi perubahan pada target berkas tanpa membuat `implementation_plan.md`.
3. **Lewati Full Test Suite**: Jangan jalankan `nx test` atau `go test` monorepo lengkap. Cukup targeted test spesifik pada berkas yang disentuh jika dibutuhkan.
4. **Fokus Selesai Cepat**: Selesaikan tugas dalam 1 giliran (turn) responsif.

