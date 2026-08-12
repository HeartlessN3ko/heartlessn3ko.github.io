from __future__ import annotations

import os
import subprocess
import time
from pathlib import Path

import requests


class VoiceboxError(RuntimeError):
    pass


class VoiceboxClient:
    def __init__(self, base_url: str = "http://127.0.0.1:17493", install_dir: Path = Path(r"V:\voicebox")) -> None:
        self.base_url = base_url.rstrip("/")
        self.install_dir = install_dir

    def health(self) -> dict:
        try:
            response = requests.get(f"{self.base_url}/health", timeout=4)
            response.raise_for_status()
            return {"reachable": True, **response.json()}
        except requests.RequestException as exc:
            return {"reachable": False, "error": str(exc)}

    def start(self, timeout: int = 90) -> dict:
        current = self.health()
        if current.get("reachable"):
            return current
        executable = self.install_dir / "voicebox.exe"
        if not executable.exists():
            raise VoiceboxError(f"Voicebox is not installed at {executable}")
        creationflags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
        subprocess.Popen(
            [str(executable)],
            cwd=str(self.install_dir),
            creationflags=creationflags,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            status = self.health()
            if status.get("reachable"):
                return status
            time.sleep(1)
        raise VoiceboxError("Voicebox started, but its local API did not become ready within 90 seconds.")

    def _get_json(self, path: str, timeout: int = 20):
        try:
            response = requests.get(f"{self.base_url}{path}", timeout=timeout)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            raise VoiceboxError(f"Voicebox request failed: {exc}") from exc

    def voices(self) -> list[dict]:
        profiles = self._get_json("/profiles")
        models = self._get_json("/models/status", timeout=30).get("models", [])
        downloaded = {model["model_name"] for model in models if model.get("downloaded")}
        usable: list[dict] = []
        for profile in profiles:
            engine = profile.get("preset_engine") or profile.get("default_engine") or "qwen"
            model_size = None
            compatible = False
            reason = "The model needed by this profile is not downloaded."
            if profile.get("voice_type") == "cloned" and profile.get("sample_count", 0) > 0 and "qwen-tts-0.6B" in downloaded:
                engine = "qwen"
                model_size = "0.6B"
                compatible = True
                reason = ""
            elif engine == "kokoro" and "kokoro" in downloaded:
                compatible = True
                reason = ""
            elif engine == "chatterbox_turbo" and "chatterbox-turbo" in downloaded:
                compatible = True
                reason = ""
            elif engine == "qwen_custom_voice" and "qwen-custom-voice-0.6B" in downloaded:
                model_size = "0.6B"
                compatible = True
                reason = ""
            usable.append(
                {
                    "id": profile["id"],
                    "name": profile["name"],
                    "voice_type": profile.get("voice_type"),
                    "engine": engine,
                    "model_size": model_size,
                    "compatible": compatible,
                    "reason": reason,
                }
            )
        return usable

    def synthesize(self, *, profile_id: str, engine: str, model_size: str | None, text: str, destination: Path) -> None:
        payload = {
            "profile_id": profile_id,
            "text": text,
            "language": "en",
            "engine": engine,
            "normalize": True,
            "max_chunk_chars": 800,
            "crossfade_ms": 50,
        }
        if model_size:
            payload["model_size"] = model_size
        try:
            response = requests.post(
                f"{self.base_url}/generate/stream",
                json=payload,
                timeout=900,
            )
        except requests.RequestException as exc:
            raise VoiceboxError(f"Voicebox narration failed: {exc}") from exc
        if response.status_code != 200:
            try:
                detail = response.json().get("detail", response.text)
            except ValueError:
                detail = response.text
            raise VoiceboxError(f"Voicebox narration failed ({response.status_code}): {detail}")
        content_type = response.headers.get("content-type", "")
        if "audio" not in content_type or len(response.content) < 1000:
            raise VoiceboxError("Voicebox returned no usable audio.")
        destination.write_bytes(response.content)
