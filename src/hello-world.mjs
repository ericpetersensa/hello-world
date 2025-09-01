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

/* ---------- Register toolbar hook EARLY (at 'init') ---------- */
/* Adds a NEW top-level group: 'hello-world' with one tool 'open'. */
Hooks.on("init", () => {
  Hooks.on("getSceneControlButtons", (controls) => {
    const isArray = Array.isArray(controls);
    const hasGroup = isArray
      ? controls.some(c => c?.name === "hello-world")
      : !!controls?.["hello-world"];

    if (hasGroup) {
      console.debug("[hello-world] top-level control group already present; skipping.");
      return;
    }

    // Build the tool object
    const toolName = "open";
    const tool = {
      name: toolName,
      title: game.i18n.localize("HELLO.ControlTitle"),
      icon: "fa-solid fa-face-smile",
      button: true,
      visible: true,
      // order is used by record-shaped tool sets; harmless on arrays
      order: 1000,
      onClick: () => game.modules.get("hello-world")?.api.open()
    };

    // Build the group object
    const group = {
      name: "hello-world",
      title: game.i18n.localize("HELLO.ControlTitle"),
      icon: "fa-solid fa-face-smile",
      // No custom canvas layer; this is just a launcher
      layer: null,
      activeTool: toolName
    };

    if (isArray) {
      // Array-shaped controls & tools
      group.tools = [tool];
      controls.push(group);
      console.debug("[hello-world] added top-level control group (array shape).");
    } else {
      // Record-shaped controls & tools (v13+)
      group.tools = { [toolName]: tool };
      controls["hello-world"] = group;
      console.debug("[hello-world] added top-level control group (record shape).");
    }
  });
});

/* ---------------------- Finalize on 'ready' ------------------------ */
Hooks.once("ready", () => {
  // Expose a tiny API so a macro can open the app
  const mod = game.modules.get("hello-world");
  if (mod) mod.api = { open: () => new HelloWorldApp().render(true) };

  // v13-compliant refresh: re-render controls (no deprecated initialize)
  try {
    const opts = { controls: ui.controls?.controls, tool: ui.controls?.activeTool?.name };
    ui.controls?.render(opts);
  } catch (err) {
    console.warn("[hello-world] controls refresh encountered a problem (safe to ignore if button shows):", err);
  }
});
