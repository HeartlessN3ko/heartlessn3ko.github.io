from __future__ import annotations

import hashlib
import json
import math
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


WIDTH = 1080
HEIGHT = 1920
FPS = 30
BG = "#100c14"
SURFACE = "#1c1620"
TEXT = "#f3e9ee"
MUTED = "#b9acb3"
PINK = "#e592b8"
GOLD = "#d8b06b"


class RenderError(RuntimeError):
    pass


def _font(name: str, size: int) -> ImageFont.FreeTypeFont:
    candidates = {
        "serif": [r"C:\Windows\Fonts\georgiab.ttf", r"C:\Windows\Fonts\timesbd.ttf"],
        "sans": [r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf"],
        "bold": [r"C:\Windows\Fonts\seguisb.ttf", r"C:\Windows\Fonts\arialbd.ttf"],
    }[name]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default(size=size)


def _wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if current and draw.textlength(candidate, font=font) > max_width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def _excerpt_around(text: str, highlight: str, limit: int = 70) -> str:
    words = list(re.finditer(r"\S+", text))
    if len(words) <= limit:
        return text
    start_char = text.casefold().find(highlight.casefold()) if highlight else -1
    center = 0
    if start_char >= 0:
        center = next((i for i, word in enumerate(words) if word.start() <= start_char < word.end()), 0)
    before = min(center, limit // 2)
    first = max(0, center - before)
    last = min(len(words), first + limit)
    first = max(0, last - limit)
    excerpt = text[words[first].start() : words[last - 1].end()]
    return ("…" if first else "") + excerpt + ("…" if last < len(words) else "")


def _draw_highlighted_quote(
    draw: ImageDraw.ImageDraw,
    quote: str,
    highlight: str,
    box: tuple[int, int, int, int],
) -> None:
    x0, y0, x1, y1 = box
    quote = _excerpt_around(quote, highlight)
    word_count = len(quote.split())
    if word_count <= 12:
        font = _font("serif", 72)
        y0 += 180
        line_height = 94
    elif word_count <= 30:
        font = _font("serif", 62)
        y0 += 95
        line_height = 82
    else:
        font = _font("serif", 52)
        line_height = 72
    folded = quote.casefold()
    start = folded.find(highlight.casefold()) if highlight else -1
    end = start + len(highlight) if start >= 0 else -1
    x, y = x0, y0
    tokens = list(re.finditer(r"\S+\s*", quote))
    for token in tokens:
        value = token.group(0)
        token_width = draw.textlength(value, font=font)
        if x > x0 and x + token_width > x1:
            x = x0
            y += line_height
        if y + line_height > y1:
            draw.text((x, y), "…", font=font, fill=TEXT)
            break
        is_highlighted = start >= 0 and token.start() < end and token.end() > start
        if is_highlighted:
            draw.rounded_rectangle((x - 5, y + 7, x + token_width + 3, y + line_height - 11), radius=8, fill="#743f5d")
        draw.text((x, y), value, font=font, fill=TEXT)
        x += token_width


def render_scene(
    article: dict,
    segment: dict,
    index: int,
    destination: Path,
    portrait_path: Path,
    total_scenes: int = 5,
) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    glow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((-240, -190, 540, 590), fill=(229, 146, 184, 50))
    glow_draw.ellipse((700, 1300, 1350, 2040), fill=(216, 176, 107, 35))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    image = Image.alpha_composite(image.convert("RGBA"), glow).convert("RGB")
    draw = ImageDraw.Draw(image)

    draw.text((72, 62), "♥", font=_font("bold", 31), fill=PINK)
    draw.text((112, 65), "LIFE OF SKYE", font=_font("bold", 27), fill=TEXT)
    draw.text((WIDTH - 190, 67), f"{index + 1} / {total_scenes}", font=_font("bold", 25), fill=MUTED)

    draw.rounded_rectangle((66, 145, 960, 276), radius=30, fill=SURFACE, outline="#372b3c", width=2)
    draw.text((100, 174), segment["kind"], font=_font("bold", 27), fill=PINK)
    title_lines = _wrap(draw, article["title"], _font("serif", 34), 760)[:2]
    for line_index, line in enumerate(title_lines):
        draw.text((100, 214 + line_index * 42), line, font=_font("serif", 34), fill=TEXT)

    draw.rounded_rectangle((66, 318, 960, 1358), radius=42, fill=SURFACE, outline="#3d3042", width=2)
    draw.text((112, 372), "FROM THE ARTICLE", font=_font("bold", 24), fill=GOLD)
    draw.line((112, 427, 914, 427), fill="#3a303b", width=2)
    _draw_highlighted_quote(draw, segment["source_quote"], segment["highlight"], (112, 474, 910, 1280))

    draw.text((72, 1402), "NARRATION", font=_font("bold", 21), fill=MUTED)
    draw.line((72, 1439, 960, 1439), fill="#352b38", width=2)
    draw.rounded_rectangle((68, 1580, 930, 1670), radius=28, fill="#291d29")
    draw.text((103, 1612), "FULL ARTICLE", font=_font("bold", 21), fill=GOLD)
    draw.text((290, 1607), "srxnexus.org/blog", font=_font("bold", 31), fill=TEXT)
    image.save(destination, quality=96)


def _run(command: list[str], cwd: Path) -> None:
    completed = subprocess.run(command, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if completed.returncode:
        tail = "\n".join(completed.stderr.splitlines()[-20:])
        raise RenderError(f"Media command failed:\n{tail}")


def probe_duration(media_file: Path) -> float:
    completed = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(media_file)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if completed.returncode:
        raise RenderError(f"Could not inspect {media_file.name}: {completed.stderr.strip()}")
    return float(completed.stdout.strip())


def _ass_time(seconds: float) -> str:
    centiseconds = max(0, round(seconds * 100))
    hours, remainder = divmod(centiseconds, 360000)
    minutes, remainder = divmod(remainder, 6000)
    secs, cents = divmod(remainder, 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{cents:02d}"


def _caption_chunks(text: str, max_words: int = 6) -> list[str]:
    words = text.split()
    chunks = []
    while words:
        take = min(max_words, len(words))
        if len(words) > take:
            for candidate in range(take, max(2, take - 3), -1):
                if words[candidate - 1].endswith((".", "?", "!", ",", ":", ";")):
                    take = candidate
                    break
        chunks.append(" ".join(words[:take]))
        words = words[take:]
    return chunks


def write_ass(segments: list[dict], durations: list[float], speed: float, destination: Path) -> None:
    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Segoe UI Semibold,58,&H00F3E9EE,&H00F3E9EE,&H00100814,&H98000000,-1,0,0,0,100,100,0,0,1,6,2,2,110,180,400,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header]
    cursor = 0.0
    for segment, raw_duration in zip(segments, durations):
        spoken_duration = raw_duration / speed
        chunks = _caption_chunks(segment["narration"])
        weights = [max(1, len(chunk.split())) for chunk in chunks]
        total_weight = sum(weights)
        local = cursor
        for chunk, weight in zip(chunks, weights):
            duration = spoken_duration * weight / total_weight
            safe = chunk.replace("{", "(").replace("}", ")").replace("\n", " ")
            lines.append(
                f"Dialogue: 0,{_ass_time(local)},{_ass_time(local + duration)},Caption,,0,0,0,,{{\\fad(80,80)}}{safe}\n"
            )
            local += duration
        cursor += spoken_duration + 0.35
    destination.write_text("".join(lines), encoding="utf-8-sig")


def render_video(
    *,
    article: dict,
    segments: list[dict],
    visuals: list[dict],
    audio_files: list[Path],
    output_dir: Path,
    portrait_path: Path,
    voice: dict,
    update,
) -> dict:
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise RenderError("FFmpeg and ffprobe must be installed and available on PATH.")
    raw_durations = [probe_duration(path) for path in audio_files]
    raw_total = sum(raw_durations) + 0.35 * (len(raw_durations) - 1)
    if raw_total > 72:
        raise RenderError(
            f"The narration is {raw_total:.1f} seconds. Shorten it below 72 seconds so it can fit without sounding unnaturally fast."
        )
    if raw_total < 38:
        raise RenderError(
            f"The narration is only {raw_total:.1f} seconds. Add enough explanation to reach at least 38 seconds before exporting."
        )
    speed = max(1.0, raw_total / 58.5)
    spoken_total = sum(duration / speed for duration in raw_durations) + 0.35 * (len(raw_durations) - 1)
    padding = max(0.0, 60.0 - spoken_total)

    scene_files = []
    for index, visual in enumerate(visuals):
        segment = segments[visual["segment_index"]]
        scene_data = {"kind": segment["kind"], **visual}
        update(68 + int(index * 12 / len(visuals)), f"Building source quote {index + 1} of {len(visuals)}")
        scene = output_dir / f"scene-{index + 1}.png"
        render_scene(article, scene_data, index, scene, portrait_path, len(visuals))
        scene_files.append(scene)

    segment_durations = [duration / speed + (padding if index == len(segments) - 1 else 0.35) for index, duration in enumerate(raw_durations)]
    # Keep visual pacing consistent even when a spoken beat is much longer than
    # another. The ordered cut list still tracks the argument, but no quote is
    # allowed to sit onscreen for an entire long narration block.
    shot_durations = [60.0 / len(visuals)] * len(visuals)

    clip_files = []
    for index, (scene, scene_duration) in enumerate(zip(scene_files, shot_durations)):
        update(80 + int(index * 10 / len(scene_files)), f"Animating quote {index + 1} of {len(scene_files)}")
        filter_graph = (
            f"zoompan=z='min(zoom+0.00036,1.07)':x='iw/2-(iw/zoom/2)':"
            f"y='ih/2-(ih/zoom/2)':d=1:s={WIDTH}x{HEIGHT}:fps={FPS},format=yuv420p"
        )
        clip = output_dir / f"visual-clip-{index + 1}.mp4"
        _run(
            [
                "ffmpeg", "-y", "-loop", "1", "-i", scene.name,
                "-vf", filter_graph, "-t", f"{scene_duration:.3f}", "-an",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", clip.name,
            ],
            output_dir,
        )
        clip_files.append(clip)

    concat_file = output_dir / "clips.txt"
    concat_file.write_text("".join(f"file '{clip.name}'\n" for clip in clip_files), encoding="utf-8")
    base_video = output_dir / "visual-timeline.mp4"
    _run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_file.name, "-c", "copy", base_video.name], output_dir)

    audio_clips = []
    for index, (audio, scene_duration) in enumerate(zip(audio_files, segment_durations)):
        atempo = f"atempo={speed:.6f}," if speed > 1.0001 else ""
        audio_clip = output_dir / f"audio-clip-{index + 1}.m4a"
        _run(
            [
                "ffmpeg", "-y", "-i", audio.name, "-af", f"{atempo}apad=whole_dur={scene_duration:.3f}",
                "-t", f"{scene_duration:.3f}", "-vn", "-c:a", "aac", "-b:a", "192k", audio_clip.name,
            ],
            output_dir,
        )
        audio_clips.append(audio_clip)
    audio_concat = output_dir / "audio-clips.txt"
    audio_concat.write_text("".join(f"file '{clip.name}'\n" for clip in audio_clips), encoding="utf-8")
    audio_timeline = output_dir / "audio-timeline.m4a"
    _run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", audio_concat.name, "-c", "copy", audio_timeline.name], output_dir)

    update(94, "Adding timed captions")
    subtitles = output_dir / f"{article['slug']}-captions.ass"
    write_ass(segments, raw_durations, speed, subtitles)
    final_video = output_dir / f"{article['slug']}-tiktok.mp4"
    _run(
        [
            "ffmpeg", "-y", "-i", base_video.name, "-i", audio_timeline.name,
            "-vf", f"ass={subtitles.name}", "-map", "0:v:0", "-map", "1:a:0", "-t", "60",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "copy", final_video.name,
        ],
        output_dir,
    )
    final_duration = probe_duration(final_video)
    if not 59.5 <= final_duration <= 60.5:
        raise RenderError(f"Final video duration was {final_duration:.2f} seconds instead of 60 seconds.")
    cover = output_dir / f"{article['slug']}-cover.png"
    shutil.copy2(scene_files[0], cover)

    caption = output_dir / f"{article['slug']}-tiktok-caption.txt"
    hashtags = ["#LifeOfSkye"] + ["#" + re.sub(r"[^A-Za-z0-9]", "", tag) for tag in article.get("tags", [])[:3]]
    caption.write_text(
        f"{article['title']}\n\nRead the full article: {article['canonical_url']}\n\nAI narration generated locally with Voicebox. {' '.join(hashtags)}\n",
        encoding="utf-8",
    )
    project_file = output_dir / f"{article['slug']}-project.json"
    project_file.write_text(
        json.dumps({"article": article, "segments": segments, "visuals": visuals, "voice": voice}, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    evidence = output_dir / f"{article['slug']}-evidence.json"
    source_hash = hashlib.sha256(Path(article["source_path"]).read_bytes()).hexdigest()
    evidence.write_text(
        json.dumps(
            {
                "proof_state": "runtime verified locally",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "article_goal": "Explain the topic, opposing side, Skye's side, plan, and full-article link in 60 seconds.",
                "normal_entry_point": "Start Article Video Studio.cmd",
                "source_article": article["source_path"],
                "source_sha256": source_hash,
                "canonical_url": article["canonical_url"],
                "voice_provider": "Voicebox local API",
                "voice_profile": {"id": voice["id"], "name": voice["name"], "engine": voice["engine"]},
                "raw_audio_durations": raw_durations,
                "audio_speed_factor": speed,
                "visual_shot_count": len(visuals),
                "visual_shot_durations": shot_durations,
                "final_video_duration": final_duration,
                "dimensions": [WIDTH, HEIGHT],
                "fps": FPS,
                "failure_policy": "Export stops on missing source provenance, Voicebox failure, unsupported duration, or FFmpeg failure.",
                "publication_state": "local export only; not uploaded to TikTok",
                "tiktok_reminder": "Turn on TikTok's AI-generated content label before posting synthetic narration.",
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return {
        "video": final_video.name,
        "cover": cover.name,
        "caption": caption.name,
        "subtitles": subtitles.name,
        "project": project_file.name,
        "evidence": evidence.name,
        "duration": final_duration,
        "speed": speed,
    }
