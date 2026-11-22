"""Cuts the frames from workspace-tabs-record.mjs into the explainer video: 1080x1350, wide shot on top, a magnified
lens below, a caption per scene. Usage: python3 -I apps/web/scripts/reel/workspace-tabs-edit.py <out.mp4>
Needs ffmpeg with libfreetype (drawtext) and macOS's STHeiti font for the Chinese captions."""
import json, os, shutil, subprocess, sys

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "check-out", "reel-workspace-tabs")
D = os.path.abspath(D)
# drawtext splits options on ":" and the system font path has a space, so work from a copy
FONT = os.path.join(D, "heiti.ttc")
if not os.path.exists(FONT):
    shutil.copy("/System/Library/Fonts/STHeiti Medium.ttc", FONT)
OUT = os.path.abspath(sys.argv[1])
marks = {m["name"]: m["t"] for m in json.load(open(os.path.join(D, "marks.json")))["marks"]}
boxes = json.load(open(os.path.join(D, "marks.json")))["boxes"]
S = 2  # device pixels per CSS px
fx, fy, fw, fh = (boxes["frame"][k] * S for k in ("x", "y", "w", "h"))

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-2000:]); sys.exit(1)

# 1. Constant 30fps sources from the variable-rate screencast frames
def build(frames_json, folder, out_name):
    fr = json.load(open(os.path.join(D, frames_json)))
    lst = os.path.join(D, out_name + ".txt")
    with open(lst, "w") as f:
        for i, t in enumerate(fr):
            dur = (fr[i + 1] - t) if i + 1 < len(fr) else 0.04
            f.write(f"file '{folder}/{i:05d}.jpg'\nduration {max(dur, 0.001):.4f}\n")
        f.write(f"file '{folder}/{len(fr) - 1:05d}.jpg'\n")
    out = os.path.join(D, out_name + ".mp4")
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "12", "-preset", "fast", out])
    return out

src = build("frames.json", "frames", "source")
src_slow = build("frames_slow.json", "frames_slow", "source_slow")
slow_marks = {m["name"]: m["t"] for m in json.load(open(os.path.join(D, "marks_slow.json")))["marks"]}

W, H = 1080, 1350
M = 40
WIDE_W = W - 2 * M  # 1000
pad = 24 * S
wide_crop = (int(fx - pad), int(fy - pad), int(fw + 2 * pad), int(fh + 2 * pad))
wide_h = round(WIDE_W * wide_crop[3] / wide_crop[2] / 2) * 2
lens_corner = (int(fx), int(fy), 330 * S, 150 * S)  # toggle, brand, first tab and the panel's top-left corner
lens_tabs = (int(fx + 190 * S), int(fy + 10 * S), 420 * S, 130 * S)

def text(name, s):
    p = os.path.join(D, f"t_{name}.txt")
    open(p, "w").write(s)
    return p

def scene(i, start, end, title, sub, lens, lens_label, source, pill=None):
    out = os.path.join(D, f"scene{i}.mp4")
    lx, ly, lw, lh = lens
    lens_h = round(WIDE_W * lh / lw / 2) * 2
    wide_y = 190
    lens_y = wide_y + wide_h + 36
    speed = ""
    smooth = ""
    t1, t2, t3 = text(f"{i}a", title), text(f"{i}b", sub), text(f"{i}c", lens_label)
    draw = (
        f"drawtext=fontfile={FONT}:textfile={t1}:x={M}:y=56:fontsize=50:fontcolor=white,"
        f"drawtext=fontfile={FONT}:textfile={t2}:x={M}:y=126:fontsize=28:fontcolor=0xA6ADBB,"
        f"drawbox=x={M - 2}:y={lens_y - 2}:w={WIDE_W + 4}:h={lens_h + 4}:color=0x7AA2FF@0.55:t=2,"
        f"drawtext=fontfile={FONT}:textfile={t3}:x={M + 16}:y={lens_y + lens_h - 50}:fontsize=26:fontcolor=0x0B0D10:box=1:boxcolor=0x7AA2FF:boxborderw=10"
    )
    if pill:
        px, py, ptxt = pill
        tp = text(f"{i}d", ptxt)
        draw += f",drawtext=fontfile={FONT}:textfile={tp}:x={M + px}:y={lens_y + py}:fontsize=30:fontcolor=0x0B0D10:box=1:boxcolor=0x5BD49A:boxborderw=10"
    fc = (
        f"[0:v]{speed}split[a][b];"
        f"[a]crop={wide_crop[2]}:{wide_crop[3]}:{wide_crop[0]}:{wide_crop[1]},scale={WIDE_W}:{wide_h}:flags=lanczos{smooth}[wide];"
        f"[b]crop={lw}:{lh}:{lx}:{ly},scale={WIDE_W}:{lens_h}:flags=lanczos{smooth}[lens];"
        f"color=c=0x0B0D10:s={W}x{H}:r=30[bg];"
        f"[bg][wide]overlay={M}:{wide_y}:shortest=1[v1];[v1][lens]overlay={M}:{lens_y}:shortest=1,{draw},format=yuv420p[v]"
    )
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-to", f"{end:.3f}", "-i", source, "-filter_complex", fc, "-map", "[v]", "-r", "30", "-c:v", "libx264", "-crf", "18", "-preset", "medium", out])
    return out

c1, e1, c2, e2 = marks["collapse1"], marks["expand1"], marks["collapse2"], marks["expand2"]
cs, es = slow_marks["collapse_slow"], slow_marks["expand_slow"]
scenes = [
    scene(1, c1 - 0.7, e2 + 1.0, "側邊欄開關，不再亂跳", "收合、展開，開關和品牌都在原地", lens_corner, "放大 3×", src, pill=(30, 175, "開關位移 0 px")),
    scene(2, cs - 0.3, cs + 2.2, "收合：分頁和面板跟著滑", "面板滑到開關下方，分頁接在品牌後面", lens_corner, "慢動作 0.25×", src_slow),
    scene(3, es - 0.3, es + 2.2, "展開：第一個分頁貼齊面板", "分頁左邊直接接成面板的左邊，轉角變直角", lens_corner, "慢動作 0.25×", src_slow),
    scene(4, marks["tab2"] - 0.6, marks["close"] + 1.1, "分頁和面板接成一塊", "切換時滑過去，新增長出來，關閉縮回去", lens_tabs, "放大 2.4×", src),
]
lst2 = os.path.join(D, "scenes.txt")
open(lst2, "w").write("".join(f"file '{s}'\n" for s in scenes))
run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst2, "-c", "copy", "-movflags", "+faststart", OUT])
print("ok", OUT)
