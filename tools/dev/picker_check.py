#!/usr/bin/env python3
"""Emulator check for the clip picker: screenshot the picker, start each clip in turn, screenshot after 5 s, press Back.

Usage: python3 tools/dev/picker_check.py <out-dir>
Order of focus: the cards form a 3-column grid (tos, sintel, bbb / spring, llama, marketst). The app is relaunched first.
Screenshots: 0_picker, then <clip>_playing for each clip.
"""
import os, subprocess, sys, time

REGION = os.environ.get("DEMO_REGION", "100,127,1160,570")
out = sys.argv[1]
os.makedirs(out, exist_ok=True)

def sh(cmd):
    return subprocess.run(["bash", "-lc", "source ~/vega/env; " + cmd], capture_output=True, text=True)

def seq(*items):
    lines = [f"sleep {i}" if isinstance(i, float) else f"echo button_press {i}" for i in items]
    sh("vega exec vda -s emulator-5554 shell '{ " + "; ".join(lines) + "; echo exit; } | inputd-cli start'")

def shot(name):
    subprocess.run(["screencapture", "-x", "-R" + REGION, os.path.join(out, name + ".png")])

sh("cd app && vega run-app build/aarch64-release/moment-app_aarch64.vpkg com.anson.moment.main -d VirtualDevice")
time.sleep(4)
shot("0_picker")
# (clip, key presses from the first card to reach it)
path = [("tos", []), ("sintel", ["KEY_RIGHT"]), ("bbb", ["KEY_RIGHT", "KEY_RIGHT"]),
        ("spring", ["KEY_DOWN"]), ("llama", ["KEY_DOWN", "KEY_RIGHT"]), ("marketst", ["KEY_DOWN", "KEY_RIGHT", "KEY_RIGHT"])]
for clip, moves in path:
    seq(*[x for k in moves for x in (k, 0.5)], "KEY_ENTER", 5.0)
    shot(f"{clip}_playing")
    seq("KEY_BACK", 2.0)
    print("started", clip)
