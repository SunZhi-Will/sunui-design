---
name: plush-faces
description: Make the face images for the SunUI PlushPortrait block (a cut-out portrait visitors can grab and stretch). Use when the user has installed plush-portrait, asks for its faces, expressions or images, wants their own photo or a character in it, or the cross-fades between faces jump. Covers consent, the face list and image spec, generating the set with an image tool (or handing the user prompts), checking alignment, converting to WebP and wiring up the faces prop.
---

# PlushPortrait face set

PlushPortrait needs one image per expression. They are cross-faded while the skin stretches, so they must be **the same picture with only the face changed**: same size, same framing, same head position to the pixel. Only `rest` is required; any missing face is skipped.

## 1. Who is in the picture

Ask before making anything:

- **The user themself**: ask for one sharp, front-facing photo (head and shoulders, even light, plain background).
- **A fictional character**: ask for a short description (age, hair, clothing color, style: photo or illustration). Prefer this when the user is unsure.
- **Someone else**: only with that person's consent. Never make a set of a celebrity, public figure or anyone who has not agreed, even "as a joke". Say why and offer a fictional character instead.

## 2. The faces

| key | file | expression | when it shows |
|---|---|---|---|
| `rest` | `rest.png` | gentle closed-mouth smile, eyes on the viewer | always (required) |
| `grab` | `grab.png` | shocked: brows high, eyes wide, small round open mouth | grabbed, tapped, poked |
| `pull` | `pull.png` | ouch: eyes squeezed shut, nose wrinkled, clenched teeth | stretched far |
| `blink` | `blink.png` | rest with both eyes closed | every few seconds |
| `hover` | `hover.png` | mildly annoyed: brows down, lips pursed to one side | mouse resting on the face |
| `dazed` | `dazed.png` | dizzy: half-lidded eyes looking different ways, lopsided smile | just let go after a big pull |
| `idle` | `idle.png` | big yawn, mouth wide open, eyes nearly shut | page quiet for a while |
| `lookLeft` | `look-left.png` | rest, irises shifted to the image's left edge | cursor far to the left |
| `lookRight` | `look-right.png` | rest, irises shifted to the image's right edge | cursor far to the right |

If the user wants fewer images, the minimum that still feels alive is `rest`, `grab`, `pull`, `blink`. The tone of each face is the user's choice (a brand mascot may want "pleased" instead of "annoyed" on hover); keep the keys.

## 3. Image spec

- Square, 1024 x 1024 or larger, PNG or WebP with a **transparent** background.
- Head and shoulders, facing the camera, head centred horizontally.
- Top of the head about 8% below the top edge, shoulders cut off by the bottom edge. The head pops out above the frame, so it needs that room.
- Soft even light, no shadow on the background, no text, no props crossing the face.
- Every face identical to `rest` except the expression: same hair strands, clothing, light, colors, crop.

## 4. Making the set

The one rule that matters: **make `rest` first, then make every other face as an edit of `rest`.** Never generate faces independently; each new generation moves the head and changes the person.

### A. You have an image tool (gpt-image, Codex, Gemini, Flux, etc.)

1. **rest.** From the user's photo: cut out the background and reframe to the spec (or edit it into the spec with the tool). From a description, generate it:

   > A square 1024x1024 PNG with a fully transparent background: a friendly [photorealistic studio portrait / flat illustration] of [description], wearing [plain top in one color]. Head and shoulders bust, facing the camera straight on, head perfectly centred horizontally, eyes looking directly at the viewer, gentle closed-mouth smile. The top of the head sits about 8% below the top edge; shoulders are cut off by the bottom edge. Soft even studio lighting, sharp focus, no props, no text, no shadow on the background.

   Show `rest` to the user and get a yes before making the others.

2. **Each other face**, with `rest.png` as the input image (edit mode, not text-to-image):

   > Edit this image. Keep EVERYTHING identical: same person and identity, same hair, same clothing, same lighting, and above all the exact same head size, head position, framing and camera, pixel-aligned so the images can be cross-faded. Keep the transparent background. Change ONLY the facial expression: [expression from the table].

   Faces are independent edits of `rest`, so they can be made in parallel. Save each under the file name in the table.

### B. You have no image tool

Give the user the two prompts above filled in for their case, the file names, and the order (rest first, then each face as an edit of rest in ChatGPT, Gemini or similar). Ask them to put the files in one folder and tell you where; then continue at step 5.

### C. The user wants to shoot real photos

Tripod at head height, same distance, same light, camera on a timer, one photo per expression without moving the chair. Cut out the backgrounds with the same tool for every photo. Expect some drift; the check below shows which ones to retake.

## 5. Check and convert

Run the checker that comes with this skill (`check-faces.mjs`, next to this file) on the folder:

```bash
node .claude/skills/plush-faces/check-faces.mjs <folder>
```

(Use `.agents/skills/plush-faces/...` if that is where it was installed. It needs `sharp`; Next.js projects usually have it, otherwise `npm i -D sharp`.)

It compares every face's silhouette with `rest`:

- **ok**: under 4% of the silhouette differs and the person moved less than 0.8% of the width. Hair-edge differences of 2 to 3% are normal.
- **warn**: visible as a small hop on the cross-fade. Regenerate if the user cares.
- **FAIL**: will visibly jump, or the size or transparency is wrong. Regenerate that face as an edit of `rest`.

It also prints a suggested `frameBox` from where the top of the head is.

When everything passes, convert into the app's `public` folder (768px WebP, about 60 KB each):

```bash
node .claude/skills/plush-faces/check-faces.mjs <folder> --out public/plush/<name>
```

It prints the `faces` object to paste.

## 6. Wire it up

```tsx
import { PlushPortrait, type PlushFaces } from "@/components/plush-portrait";

const faces: PlushFaces = {
  rest: "/plush/mei/rest.webp",
  grab: "/plush/mei/grab.webp",
  // ...the rest the checker printed
};

<PlushPortrait faces={faces} alt="Portrait of Mei, smiling" pokeLabel="Poke Mei" frame="circle" frameBox={{ y: 0.58, r: 0.42 }} />
```

Use the import path the shadcn CLI printed. Write `alt` and `pokeLabel` in the page's language. Use the suggested `frameBox`, then look at it: the circle should hold the shoulders and the head should rise above it.

## Troubleshooting

- **A face jumps on the cross-fade**: it was generated, not edited, or the tool recropped it. Rerun the checker and regenerate the failing faces from `rest`.
- **Colors shift between faces**: say "same white balance and exposure as the input" in the edit prompt, or regenerate.
- **Stays a still picture**: images on another domain need CORS headers (WebGL cannot read them otherwise). Serve them from `public` or the same origin.
- **Grey or white box around the person**: the background is not transparent. Cut it out again.
- **The head is cut by the frame**: there is no room above the head in `rest`. Regenerate `rest` with more space on top, then the other faces from it.
