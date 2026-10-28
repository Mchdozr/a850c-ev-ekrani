# Ev ekranı completion plan

Goal: complete the existing web designer and native HOME launcher at `11dd216`, including shared visuals, missing assets, readable glass settings, and genuine local-network QR phone control.

The user's six-item defect list and subsequent request to implement enhancements are the specification and authorization. Work stays in the existing isolated cloud checkout (`work`); no additional worktree. Preserve REA, package `dev.evekrani.a850c`, system launchers, firmware, boot logos and signing verification. Do not commit local.properties, public/a850c-ev-ekrani.zip or public/CODEX-GOREV.txt. No downloaded official brand packs.

- [ ] Restore reproducible npm lock, Android wrapper/toolchains and shared local fonts/wallpapers; document replacement assets because original binaries never reached Git.
- [ ] Cover visual defaults, layout/focus and appearance settings with regression tests; fix all four web/native layouts and eight wallpaper presets.
- [ ] Complete readable glass settings, immediate lamp/photo access and non-destructive theme presets.
- [ ] Add actual native LAN QR remote with expiring per-process secret, same-origin commands, bounded HTTP input and correct connection state; preserve optional legacy Next bridge.
- [ ] Add isolated browser pairing sessions, scannable QR, clear browser/native labels and clock reveal through phone navigation.
- [ ] Document JSON export → adb push → install → choose HOME; provide deploy helper.
- [ ] Run web tests, type check, lint, production build, browser functional checks, core tests and debug assembly; copy/verify APK and preserve excluded files.
- [ ] Review integration, save tested cloud install/start instructions, report limitations without claiming physical-TV validation.

Interfaces: shared wallpaper paths are `/wallpapers/<preset-id>.jpg` and Android `assets/wallpapers/<preset-id>.jpg`, with identical bytes. Shared font files are Inter.ttf and NunitoSans.ttf; CSS variables --font-inter and --font-nunito-sans. Native HomeView exposes onPairRequested for HomeActivity. Web PhonePairing has optional/default props. JSON remains version1 and localStorage key a850c-ev-ekrani-v3.

Decisions: native remote runs directly on the TV's LAN address and only controls this HOME app and starts supported apps; it cannot inject keys into other apps. Browser remote is a separate preview receiver. Themes change appearance fields only and preserve user's apps/content. APK signing is ordinary debug signing, with upgrade limitations documented.
