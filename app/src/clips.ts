// Written by backend/scripts/prepare-app-clips.ts: the clips bundled in the app (shown in the clip picker).
export type BundledClip = {id: string; title: string; file: string; attribution: string; license: string};
export const CLIPS: BundledClip[] = [
  {id: "tos", title: "Tears of Steel", file: "/pkg/assets/raw/tos.mp4", attribution: "(CC) Blender Foundation | mango.blender.org", license: "CC-BY 3.0"},
  {id: "sintel", title: "Sintel", file: "/pkg/assets/raw/sintel.mp4", attribution: "(c) copyright Blender Foundation | durian.blender.org", license: "CC BY 3.0"},
  {id: "bbb", title: "Big Buck Bunny", file: "/pkg/assets/raw/bbb.mp4", attribution: "(c) copyright 2008, Blender Foundation | www.bigbuckbunny.org", license: "CC BY 3.0"},
  {id: "spring", title: "Spring", file: "/pkg/assets/raw/spring.mp4", attribution: "(CC) Blender Foundation | spring.blender.org", license: "CC BY 4.0"},
  {id: "llama", title: "Caminandes: Llama Drama", file: "/pkg/assets/raw/llama.mp4", attribution: "(CC) Blender Foundation | caminandes.com", license: "CC BY 3.0"},
  {id: "marketst", title: "A Trip Down Market Street (1906)", file: "/pkg/assets/raw/marketst.mp4", attribution: "Miles Brothers, A Trip Down Market Street (1906), via the Prelinger Archives / Internet Archive", license: "Public domain (US film published before 1929)"},
];
