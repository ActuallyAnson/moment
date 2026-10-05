# Clip attributions

The repository's MIT license covers the code only, not this media. The media files and extracted frames are not committed; `node backend/scripts/fetch-clips.ts` rebuilds them from the sources below. In every excerpt the **original audio is removed and replaced with silence** (the Tears of Steel soundtrack is credited as CC-BY-ND by the film's copyright notice, so it is not redistributed; silence is used for all clips for consistency). Excerpts are cut, transcoded to H.264/AAC, and keyframes are extracted for analysis. Subtitle files `clips/tos/subs.srt` and `clips/sintel/subs.srt` (committed) are the official English subtitles re-timed to the excerpt. The Blender, Mango, Durian, Peach and similar logos are excluded from the Creative Commons licenses and are not shown in the excerpts used in this project.

| id | Work | Excerpt | License | Attribution | Source |
|---|---|---|---|---|---|
| tos | Tears of Steel | 0:20-1:05 | CC-BY 3.0 | (CC) Blender Foundation, mango.blender.org | https://download.blender.org/demo/movies/ToS/tears_of_steel_720p.mov (subtitles: .../ToS/subtitles/TOS-en.srt) |
| sintel | Sintel | 1:45-2:30 | CC BY 3.0 | (c) copyright Blender Foundation, durian.blender.org | Wikimedia Commons transcode of Sintel_movie_4K.webm (subtitles: durian.blender.org/wp-content/content/subtitles/sintel_en.srt) |
| bbb | Big Buck Bunny | 1:52-2:27 | CC BY 3.0 | (c) copyright 2008, Blender Foundation, www.bigbuckbunny.org | Wikimedia Commons transcode of Big_Buck_Bunny_4K.webm |
| spring | Spring | 0:40-1:25 | CC BY 4.0 | (CC) Blender Foundation, spring.blender.org | Wikimedia Commons transcode of Spring_-_Blender_Open_Movie.webm |
| llama | Caminandes: Llama Drama | 0:33-1:23 | CC BY 3.0 | (CC) Blender Foundation, caminandes.com | Wikimedia Commons Caminandes-_Llama_Drama_-_Short_Movie.ogv |
| marketst | A Trip Down Market Street (1906) | 8:45-9:40 | Public domain (US film published before 1929) | Miles Brothers, via the Prelinger Archives / Internet Archive | https://archive.org/details/sanfran_hd_h264 |

Exact URLs, start times and durations are in `clips/manifest.json`. License pages: https://creativecommons.org/licenses/by/3.0/ , https://creativecommons.org/licenses/by/4.0/ , https://mango.blender.org/sharing/ , https://durian.blender.org/sharing/ .
