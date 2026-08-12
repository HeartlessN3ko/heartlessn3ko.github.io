# Life of Skye Article Video Studio

A private, local creator tool that turns a published Life of Skye article into
an upload-ready 60-second vertical video. It never posts to TikTok.

## Normal entry point

Double-click `Start Article Video Studio.cmd`. The studio opens at
`http://127.0.0.1:17640/` and reads the real published articles from
`blog/articles/*/index.html`.

The normal workflow is:

1. Choose a published article.
2. Review the five narration beats: hook, topic, other side, Skye's side, and
   plan/full-article link.
3. Attach every beat to an exact published passage and choose words from that
   passage to highlight.
4. Select a compatible local Voicebox profile.
5. Approve the reviewed script and generate the export.
6. Download the MP4, cover, TikTok caption, timed captions, project record,
   and runtime-evidence record.

Completed exports are restored into **Recent local exports** when the studio is
closed and reopened.

## Runtime requirements

- Python 3.11+
- packages from `requirements.txt`
- FFmpeg and ffprobe on `PATH`
- Voicebox at `V:\voicebox` with its local API on `127.0.0.1:17493`
- at least one Voicebox profile backed by a downloaded model

Install Python packages, if needed, with:

```powershell
python -m pip install -r requirements.txt
```

Exports are written outside the Git repository under:

`%LOCALAPPDATA%\LifeOfSkye\ArticleVideoStudio\exports`

## Proof and failure boundaries

The studio stops instead of exporting when a quotation or highlight no longer
matches the published article, Voicebox fails, FFmpeg fails, or narration
cannot fit the 60-second target without excessive speed-up. A completed export
includes an evidence JSON file with source hash, loaded paths, voice profile,
raw narration durations, final duration, resolution, and publication state.

An exported file is **local runtime verified**, not TikTok-published. Before
manual upload, turn on TikTok's AI-generated content label for synthetic
narration and review the generated caption and cover.

## Future ElevenLabs provider

Narration is isolated behind `studio/voicebox.py`. An ElevenLabs provider can
be added later without changing article parsing, source provenance, scene
rendering, captions, or export packaging. No disabled ElevenLabs controls are
shown until that provider is actually usable.
