# Project Overview

## Project name

```
PassBy
```

## Elevator pitch

```
Know what your booth is actually worth. PassBy watches your booth's foot traffic and counts who walked by vs who actually stopped. The booth ROI number sponsors never had.
```

## Edit thumbnail

[TODO: media]

# Project Details

## About the project (Project Story)

````markdown
## Inspiration

Sponsoring a booth at a conference is a black box. You pay a lot of money, you stand there for two days, and at the end you have no idea if 200 people walked past or 2000. Tracking it manually is tedious and nobody actually does it. The interesting number is the ratio. Out of everyone who walked by, how many actually stopped.

## How it works

Open the page, hit start camera, and the webcam feed fills the screen. A person-detection model runs on every frame and draws a box around each person it sees. A small IOU tracker keeps the same ID on the same person across frames, so we can watch their bounding box over time. If their centroid stays in a small area for more than a few seconds, they get upgraded from "walked by" to "engaged" and the box turns green. The HUD in the corner shows the running totals.

Everything runs in the browser. No backend, no video upload, no storage. The page is just static files on GitHub Pages.

## What we learned

The biggest thing was that the model pick isn't the hard part. COCO-SSD works fine out of the box. The hard part is the glue. Aligning the canvas overlay to the video element when the aspect ratio is weird. Keeping the per-frame draw loop out of React's render cycle so it doesn't fight the reconciler. Tuning the dwell threshold so someone tying their shoe doesn't get counted as engaged.

We also learned that an in-browser detector is way more capable than we expected. We were ready to ship every-other-frame inference and interpolate boxes, but a modern laptop just handles it.

## Challenges

The hardest part was the differentiation. We actually used to have a third "just looked" category, but it was too difficult for the system to detect reliably. The head-pose signal was noisy and added a second ML model per frame for not much value. Cut it. Two categories tells a cleaner ROI story anyway.

The IOU tracker is also best-effort. If someone walks out of frame for 10 seconds and comes back they get a new ID, which means they could get double counted. For a hackathon demo this is fine. For a real deployment you'd want proper re-identification, which is a much bigger project.
````

## Built with

```
react
typescript
vite
tensorflow.js
coco-ssd
html5-canvas
webrtc
github-pages
```

## "Try it out" links

[TODO: links]

## Image gallery (Project Media)

[TODO: media]

## Video demo link

[TODO: media]

# Additional Info

## Upload a File

[TODO: file]
