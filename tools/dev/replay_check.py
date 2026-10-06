#!/usr/bin/env python3
"""Emulator check for "Replay 10 s". Reads playback time from the question panel's "Paused at m:ss" label.

Usage: python3 tools/dev/replay_check.py <seconds-before-first-menu> <out-dir>
Steps: launch app; Menu; Enter (first question); wait for the answer card; Right; Enter (Replay); wait 2 s; Menu (opens the
panel again). Screenshots: 1_first_panel, 2_answer, 3_after_replay_panel. Compare the "Paused at" labels in 1 and 3:
after a replay from time t the second label should be about max(0, t-10) + 2 s (+ ~1.5 s of key and seek latency).
"""
import os, subprocess, sys

REGION = os.environ.get("DEMO_REGION", "100,127,1160,570")
wait, out = float(sys.argv[1]), sys.argv[2]
os.makedirs(out, exist_ok=True)

def sh(cmd):
    return subprocess.run(["bash", "-lc", "source ~/vega/env; " + cmd], capture_output=True, text=True)

def seq(*items):
    lines = [f"sleep {i}" if isinstance(i, float) else f"echo button_press {i}" for i in items]
    sh("vega exec vda -s emulator-5554 shell '{ " + "; ".join(lines) + "; echo exit; } | inputd-cli start'")

def shot(name):
    subprocess.run(["screencapture", "-x", "-R" + REGION, os.path.join(out, name + ".png")])

sh("cd app && vega run-app build/aarch64-release/moment-app_aarch64.vpkg com.anson.moment.main -d VirtualDevice")
seq(wait, "KEY_MENU", 1.8)
shot("1_first_panel")
seq("KEY_ENTER", 6.0)
shot("2_answer")
seq("KEY_RIGHT", 0.8, "KEY_ENTER", 2.0, "KEY_MENU", 1.8)
shot("3_after_replay_panel")
seq("KEY_BACK", 1.0)
print("screenshots in", out)
