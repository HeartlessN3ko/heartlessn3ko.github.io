from __future__ import annotations

import argparse
import hashlib
import json
import os
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, model_validator

from studio.articles import Article, draft_segments, draft_visuals, list_articles
from studio.render import RenderError, probe_duration, render_video
from studio.voicebox import VoiceboxClient, VoiceboxError


TOOL_ROOT = Path(__file__).resolve().parent
REPO_ROOT = TOOL_ROOT.parent.parent
ARTICLE_ROOT = REPO_ROOT / "blog" / "articles"
PORTRAIT_PATH = REPO_ROOT / "blog" / "assets" / "skye-vernon.png"
WORKSPACE_ROOT = Path(os.environ.get("LOCALAPPDATA", TOOL_ROOT)) / "LifeOfSkye" / "ArticleVideoStudio"
EXPORT_ROOT = WORKSPACE_ROOT / "exports"
EXPORT_ROOT.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Life of Skye Article Video Studio", docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory=TOOL_ROOT / "static"), name="static")
voicebox = VoiceboxClient()


class SegmentInput(BaseModel):
    kind: str = Field(min_length=2, max_length=40)
    narration: str = Field(min_length=2, max_length=700)
    source_index: int = Field(ge=0)
    source_quote: str = Field(min_length=2, max_length=5000)
    highlight: str = Field(min_length=2, max_length=500)


class VisualInput(BaseModel):
    segment_index: int = Field(ge=0, le=4)
    source_index: int = Field(ge=0)
    source_quote: str = Field(min_length=2, max_length=5000)
    highlight: str = Field(min_length=2, max_length=500)


class VoiceInput(BaseModel):
    id: str
    name: str
    engine: str
    model_size: str | None = None


class ExportRequest(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9-]+$")
    segments: list[SegmentInput] = Field(min_length=5, max_length=5)
    visuals: list[VisualInput] = Field(min_length=8, max_length=15)
    voice: VoiceInput
    approved: bool

    @model_validator(mode="after")
    def validate_approval_and_length(self):
        if not self.approved:
            raise ValueError("Review the narration and source quotes before exporting.")
        words = sum(len(segment.narration.split()) for segment in self.segments)
        if not 60 <= words <= 120:
            raise ValueError(f"Narration must be 60–120 words; this draft has {words}.")
        covered = {visual.segment_index for visual in self.visuals}
        if covered != set(range(5)):
            raise ValueError("Every narration beat needs at least one visual quote.")
        if [visual.segment_index for visual in self.visuals] != sorted(visual.segment_index for visual in self.visuals):
            raise ValueError("Visual quotes must stay in narration order.")
        return self


class JobStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._jobs: dict[str, dict] = {}

    def create(self, slug: str) -> dict:
        job_id = uuid.uuid4().hex[:12]
        job = {
            "id": job_id,
            "slug": slug,
            "state": "queued",
            "progress": 0,
            "message": "Queued",
            "error": None,
            "files": None,
            "output_dir": None,
        }
        with self._lock:
            self._jobs[job_id] = job
        return dict(job)

    def update(self, job_id: str, **changes) -> None:
        with self._lock:
            self._jobs[job_id].update(changes)

    def get(self, job_id: str) -> dict | None:
        with self._lock:
            job = self._jobs.get(job_id)
            return dict(job) if job else None

    def has_active(self) -> bool:
        with self._lock:
            return any(job["state"] in {"queued", "running"} for job in self._jobs.values())

    def restore_completed(self, export_root: Path) -> None:
        restored: dict[str, dict] = {}
        for output_dir in export_root.glob("*/*"):
            if not output_dir.is_dir():
                continue
            slug = output_dir.parent.name
            expected = {
                "video": f"{slug}-tiktok.mp4",
                "cover": f"{slug}-cover.png",
                "caption": f"{slug}-tiktok-caption.txt",
                "subtitles": f"{slug}-captions.ass",
                "project": f"{slug}-project.json",
                "evidence": f"{slug}-evidence.json",
            }
            if not all((output_dir / filename).is_file() for filename in expected.values()):
                continue
            try:
                saved_project = json.loads((output_dir / expected["project"]).read_text(encoding="utf-8"))
                title = saved_project.get("article", {}).get("title", slug.replace("-", " "))
            except (OSError, ValueError):
                title = slug.replace("-", " ")
            job_id = "saved-" + hashlib.sha256(str(output_dir.resolve()).encode("utf-8")).hexdigest()[:12]
            restored[job_id] = {
                "id": job_id,
                "slug": slug,
                "title": title,
                "state": "complete",
                "progress": 100,
                "message": "Saved 60-second export",
                "error": None,
                "files": expected,
                "output_dir": str(output_dir.resolve()),
            }
        with self._lock:
            self._jobs.update(restored)

    def recent_completed(self, limit: int = 5) -> list[dict]:
        with self._lock:
            completed = [dict(job) for job in self._jobs.values() if job["state"] == "complete"]
        return sorted(completed, key=lambda job: job.get("output_dir") or "", reverse=True)[:limit]


jobs = JobStore()
jobs.restore_completed(EXPORT_ROOT)


def _articles() -> list[Article]:
    return list_articles(ARTICLE_ROOT)


def _article(slug: str) -> Article:
    for article in _articles():
        if article.slug == slug:
            return article
    raise HTTPException(status_code=404, detail="Article not found")


@app.get("/")
def home():
    return FileResponse(TOOL_ROOT / "templates" / "index.html")


@app.get("/api/articles")
def articles_api():
    return [
        {
            "slug": article.slug,
            "title": article.title,
            "published": article.published,
            "canonical_url": article.canonical_url,
        }
        for article in _articles()
    ]


@app.get("/api/articles/{slug}")
def article_api(slug: str):
    article = _article(slug)
    segments, warnings = draft_segments(article)
    return {
        "article": article.to_dict(),
        "segments": segments,
        "visuals": draft_visuals(article, segments),
        "warnings": warnings,
    }


@app.get("/api/voicebox")
def voicebox_api():
    health = voicebox.health()
    if not health.get("reachable"):
        return {"health": health, "voices": []}
    try:
        voices = voicebox.voices()
    except VoiceboxError as exc:
        return {"health": health, "voices": [], "error": str(exc)}
    return {"health": health, "voices": voices}


@app.post("/api/voicebox/start")
def start_voicebox_api():
    try:
        status = voicebox.start()
        return {"health": status, "voices": voicebox.voices()}
    except VoiceboxError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def _validate_provenance(article: Article, request: ExportRequest) -> None:
    for segment in request.segments:
        if segment.source_index >= len(article.passages):
            raise ValueError(f"{segment.kind}: source passage no longer exists in the article.")
        source = article.passages[segment.source_index].text
        if source != segment.source_quote:
            raise ValueError(f"{segment.kind}: source quote does not match the published article.")
        if segment.highlight.casefold() not in source.casefold():
            raise ValueError(f"{segment.kind}: highlighted words are not present in the selected source quote.")
    for index, visual in enumerate(request.visuals, start=1):
        if visual.source_index >= len(article.passages):
            raise ValueError(f"Visual {index}: source passage no longer exists in the article.")
        source = article.passages[visual.source_index].text
        if source != visual.source_quote:
            raise ValueError(f"Visual {index}: source quote does not match the published article.")
        if visual.highlight.casefold() not in source.casefold():
            raise ValueError(f"Visual {index}: highlighted words are not present in the selected source quote.")


def _run_export(job_id: str, request: ExportRequest) -> None:
    try:
        article = _article(request.slug)
        _validate_provenance(article, request)
        selected = request.voice.model_dump()
        available = {item["id"]: item for item in voicebox.voices() if item.get("compatible")}
        actual_voice = available.get(selected["id"])
        if not actual_voice:
            raise VoiceboxError("The selected Voicebox profile is not currently usable with a downloaded model.")
        for key in ("name", "engine", "model_size"):
            if selected.get(key) != actual_voice.get(key):
                raise VoiceboxError("Voicebox profile settings changed. Reload the studio and select the voice again.")

        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        output_dir = EXPORT_ROOT / article.slug / timestamp
        output_dir.mkdir(parents=True, exist_ok=False)
        jobs.update(job_id, state="running", progress=2, message="Voicebox is ready", output_dir=str(output_dir), title=article.title)

        segments = [segment.model_dump() for segment in request.segments]
        visuals = [visual.model_dump() for visual in request.visuals]
        audio_files: list[Path] = []
        for index, segment in enumerate(segments):
            start_progress = 5 + index * 12
            jobs.update(
                job_id,
                progress=start_progress,
                message=f"Narrating {segment['kind'].lower()} ({index + 1} of {len(segments)})",
            )
            audio_path = output_dir / f"narration-{index + 1}.wav"
            voicebox.synthesize(
                profile_id=actual_voice["id"],
                engine=actual_voice["engine"],
                model_size=actual_voice.get("model_size"),
                text=segment["narration"],
                destination=audio_path,
            )
            duration = probe_duration(audio_path)
            if duration <= 0.2:
                raise RenderError(f"Voicebox produced empty audio for {segment['kind']}.")
            audio_files.append(audio_path)

        article_data = article.to_dict()

        def render_update(progress: int, message: str) -> None:
            jobs.update(job_id, progress=progress, message=message)

        files = render_video(
            article=article_data,
            segments=segments,
            visuals=visuals,
            audio_files=audio_files,
            output_dir=output_dir,
            portrait_path=PORTRAIT_PATH,
            voice=actual_voice,
            update=render_update,
        )
        jobs.update(
            job_id,
            state="complete",
            progress=100,
            message="60-second video exported locally",
            files=files,
        )
    except (ValueError, VoiceboxError, RenderError, OSError) as exc:
        jobs.update(job_id, state="failed", message="Export stopped", error=str(exc))
    except Exception as exc:  # preserve a clear failure without killing the local server
        jobs.update(job_id, state="failed", message="Export stopped unexpectedly", error=f"{type(exc).__name__}: {exc}")


@app.post("/api/exports", status_code=202)
def create_export(request: ExportRequest):
    if jobs.has_active():
        raise HTTPException(status_code=409, detail="Another export is already running. Wait for it to finish before starting a new one.")
    article = _article(request.slug)
    try:
        _validate_provenance(article, request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    job = jobs.create(request.slug)
    thread = threading.Thread(target=_run_export, args=(job["id"], request), daemon=True)
    thread.start()
    return job


@app.get("/api/exports/{job_id}")
def export_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Export job not found")
    public = {key: value for key, value in job.items() if key != "output_dir"}
    if public.get("files"):
        public["downloads"] = {
            key: f"/api/exports/{job_id}/files/{filename}" for key, filename in public["files"].items() if isinstance(filename, str)
        }
    return public


@app.get("/api/recent-exports")
def recent_exports():
    result = []
    for job in jobs.recent_completed():
        public = {key: value for key, value in job.items() if key != "output_dir"}
        public["downloads"] = {
            key: f"/api/exports/{job['id']}/files/{filename}" for key, filename in job["files"].items()
        }
        public["created"] = Path(job["output_dir"]).name
        result.append(public)
    return result


@app.get("/api/exports/{job_id}/files/{filename}")
def export_file(job_id: str, filename: str):
    job = jobs.get(job_id)
    if not job or job.get("state") != "complete" or not job.get("output_dir"):
        raise HTTPException(status_code=404, detail="Completed export not found")
    allowed = {value for value in (job.get("files") or {}).values() if isinstance(value, str)}
    if filename not in allowed or Path(filename).name != filename:
        raise HTTPException(status_code=404, detail="Export file not found")
    path = Path(job["output_dir"]) / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Export file is missing")
    return FileResponse(path, filename=filename)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the private Life of Skye article video studio.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=17640)
    parser.add_argument("--open-browser", action="store_true", help="Open the studio in the default browser after starting.")
    args = parser.parse_args()
    if args.host not in {"127.0.0.1", "localhost", "::1"}:
        parser.error("The studio is private and may only bind to localhost.")
    if args.open_browser:
        import webbrowser
        threading.Timer(1.2, lambda: webbrowser.open(f"http://{args.host}:{args.port}/")).start()
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
