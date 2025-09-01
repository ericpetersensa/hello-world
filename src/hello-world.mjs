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
/* v13: controls is a Record<string, SceneControl>; SceneControl.tools is also a Record<string, SceneControlTool> */
Hooks.on("getSceneControlButtons", (controls) => {
  // Log available groups
  const names = Object.keys(controls ?? {});
  console.debug("[hello-world] available control groups:", names);

  // Prefer these groups; otherwise fall back to the first available
  const preferred = ["token", "select", "basic", "notes", "measure"];
  const groupName = preferred.find((n) => controls?.[n]) ?? names[0];
  const group = groupName ? controls[groupName] : null;

  if (!group) {
    console.warn("[hello-world] No control groups found; skipping toolbar button.");
    return;
  }

  // v13: ensure tools is a record, not array
  if (!group.tools || Array.isArray(group.tools)) group.tools = group.tools ?? {};

  // Skip duplicate
  if (group.tools["hello-world"]) {
    console.debug("[hello-world] tool already present; skipping duplicate.");
    return;
  }

  // Compute an order that comes after any existing tools
  const existing = Object.values(group.tools ?? {});
  const maxOrder = existing.length ? Math.max(...existing.map(t => t?.order ?? 0)) : 0;
  const order = maxOrder + 1;

  group.tools["hello-world"] = {
    name: "hello-world",
    title: game.i18n.localize("HELLO.ControlTitle"),
    icon: "fa-solid fa-face-smile",
    button: true,
    order,
    onClick: () => game.modules.get("hello-world")?.api.open()
  };

  console.debug(`[hello-world] injected tool into '${groupName}' controls at order ${order}`);
});

/* ---------------------- Finalize on 'ready' ------------------------ */
Hooks.once("ready", () => {
  // Expose a tiny API so a macro can open the app
  const mod = game.modules.get("hello-world");
  if (mod) mod.api = { open: () => new HelloWorldApp().render(true) };

  // Force the controls to rebuild once, in case init order rendered controls before our hook ran
  try {
    if (ui?.controls?.initialize) ui.controls.initialize();
    else ui.controls?.render(true);
  } catch (err) {
    console.warn("[hello-world] controls refresh failed", err);
  }
});
