const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Simple Hello World window using AppV2 + Handlebars (no jQuery) */
class HelloWorldApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "hello-world-app",
    classes: ["hello-world", "app"],
    tag: "section",
    position: { width: 360, height: "auto" },
    window: {
      title: "HELLO.WorldTitle",
      icon: "fa-solid fa-face-smile",
      controls: [
        { icon: "fa-solid fa-circle-info", label: "HELLO.HeaderButton", action: "say-hello" }
      ]
    },
    actions: {
      "say-hello": HelloWorldApp.#onSayHello
    }
  };

  static PARTS = {
    content: { template: "modules/hello-world/templates/hello.hbs" }
  };

  async _prepareContext() {
    return {
      message: game.i18n.localize("HELLO.WorldMessage"),
      version: game.modules.get("hello-world")?.version ?? "dev"
    };
  }

  static #onSayHello() {
    ui.notifications.info(game.i18n.localize("HELLO.Toast"));
  }
}

/* ---------- Register toolbar hook EARLY (outside 'ready') ---------- */
Hooks.on("getSceneControlButtons", (controls) => {
  // Normalize to an array and log what we have
  const asArray = Array.isArray(controls) ? controls : Object.values(controls ?? {});
  const names = asArray.map(c => c?.name).filter(Boolean);
  console.debug("[hello-world] available control groups:", names);

  // Prefer these groups; otherwise fall back to the first available
  const preferred = ["token", "select", "basic", "notes", "measure"];
  let group =
    preferred.map(name => asArray.find(c => c?.name === name)).find(Boolean) ??
    asArray[0];

  if (!group) {
    console.warn("[hello-world] No control groups found; skipping toolbar button.");
    return;
  }

  // Ensure tools array and skip duplicates
  group.tools ??= [];
  if (group.tools.some(t => t?.name === "hello-world")) {
    console.debug("[hello-world] tool already present; skipping duplicate.");
    return;
  }

  group.tools.push({
    name: "hello-world",
    title: game.i18n.localize("HELLO.ControlTitle"),
    icon: "fa-solid fa-face-smile",
    button: true,
    onClick: () => game.modules.get("hello-world")?.api.open()
  });

  console.debug(`[hello-world] injected tool into '${group.name}' controls`);
});

/* ---------------------- Finalize on 'ready' ------------------------ */
Hooks.once("ready", () => {
  // Expose a tiny API so you can open the app from a macro
  const mod = game.modules.get("hello-world");
  if (mod) mod.api = { open: () => new HelloWorldApp().render(true) };

  // Force the controls to rebuild once (in case init order rendered before we registered)
  try {
    if (ui?.controls?.initialize) ui.controls.initialize();
    else ui.controls?.render(true);
  } catch (err) {
    console.warn("[hello-world] controls refresh failed", err);
  }
});
