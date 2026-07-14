---
description: Write concise alt text for the image reference on the currently selected line and move the image into docs/images/
---

Fix the image reference on the line currently selected in the IDE (provided as the selection context of this conversation). Work **only** on that line — do not scan other lines or files for further image references. If there is no selection, or the selected line contains no `![…](…)` image reference, say so and stop.

For that image reference:

1. If the image file is not in `docs/images/`, move it there (`git mv` when tracked, plain `mv` otherwise) and update the reference's path accordingly (from a page in `docs/`, that is `images/<file>`).
2. Open and actually look at the image, then write the alt text as **one short phrase**: the image type plus its key point — e.g. `MobileCoach dialog settings with the id mBouMgt as identifier and variable prefix`. No field-by-field enumeration of what's visible, no bare labels like "screenshot".
3. If the alt text (or surrounding prose) quotes identifiers shown in the image, verify them character by character against the image and the ids used elsewhere in the docs — OCR'd identifiers often contain lookalike mistakes (`l` vs `I`, `0` vs `O`).
4. Report: old location → new location, and the alt text written.
