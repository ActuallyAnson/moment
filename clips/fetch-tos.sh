#!/bin/sh
# Downloads the Tears of Steel excerpt used by Moment and prepares frames + subtitles.
# Source: (CC) Blender Foundation | mango.blender.org, CC-BY 3.0. See clips/NOTICE.md.
# Audio is replaced with silence on purpose: the original soundtrack is CC-BY-ND.
set -e
cd "$(dirname "$0")/.."
START=20      # seconds into the film
DURATION=45
BASE=https://download.blender.org/demo/movies/ToS
mkdir -p clips/tos
ffmpeg -hide_banner -loglevel error -y -ss $START -i $BASE/tears_of_steel_720p.mov \
  -f lavfi -i anullsrc=r=44100:cl=stereo -map 0:v:0 -map 1:a:0 -t $DURATION -shortest \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 23 -maxrate 1500k -bufsize 3000k -g 48 \
  -c:a aac -b:a 64k -movflags +faststart clips/tos/clip.mp4
curl -fsSL $BASE/subtitles/TOS-en.srt -o clips/tos/source-en.srt
node backend/scripts/prepare-clip.ts tos clips/tos/clip.mp4 clips/tos/source-en.srt $START $DURATION
mkdir -p app/assets/raw && cp clips/tos/clip.mp4 app/assets/raw/clip.mp4
