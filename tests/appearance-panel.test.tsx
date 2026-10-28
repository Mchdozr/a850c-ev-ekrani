import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppearancePanel } from "../components/appearance-panel";
import { createDefaultDesign } from "../lib/design";

test("the main appearance panel exposes lamp intensity and photo upload directly", () => {
  const markup = renderToStaticMarkup(
    createElement(AppearancePanel, {
      design: { ...createDefaultDesign(), lamp: 37 },
      onChange: () => {},
    }),
  );
  assert.match(markup, /type="range"[^>]*value="37"/);
  assert.match(markup, /37\s*%/);
  assert.match(markup, /type="file"[^>]*accept="image\/\*"/);
  assert.match(markup, /Fotoğraf yükle/);
  assert.match(markup, /Dosya ve REA/);
});

test("uploaded wallpaper names remain visible in the main panel", () => {
  const markup = renderToStaticMarkup(
    createElement(AppearancePanel, {
      design: {
        ...createDefaultDesign(),
        wallpaper: {
          type: "image",
          dataUrl: "data:image/jpeg;base64,AA==",
          name: "Benim salonum",
        },
      },
      onChange: () => {},
    }),
  );
  assert.match(markup, /Benim salonum/);
  assert.match(markup, /aria-label="Tema galerisi"/);
});
