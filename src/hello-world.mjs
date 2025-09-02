const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Hello World window using ApplicationV2 + Handlebars (no jQuery) */
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

/* ------------------------------------------------------------------ */
/*  Register a NEW top-level Scene Controls group at init (v13 style)  */
/* ------------------------------------------------------------------ */
Hooks.on("init", () => {
  Hooks.on("getSceneControlButtons", (controls) => {
    // v13+ expectation: controls is a Record<string, SceneControl>
    if (!controls || typeof controls !== "object" || Array.isArray(controls)) return;

    // Skip if already injected by a reload or hot module swap
    if (controls["hello-world"]) return;

    const toolName = "open";

    // Define our tool as part of a record (v13)
    const tool = {
      name: toolName,
      title: game.i18n.localize("HELLO.ControlTitle"),
      icon: "fa-solid fa-face-smile",
      button: true,
      visible: true,
      order: 1000,
      onClick: () => game.modules.get("hello-world")?.api.open()
    };

    // Define our top-level control group (no canvas layer; it’s a launcher)
    controls["hello-world"] = {
      name: "hello-world",
      title: game.i18n.localize("HELLO.ControlTitle"),
      icon: "fa-solid fa-face-smile",
      layer: null,
      activeTool: toolName,        // group state field, not the deprecated ui.controls getter
      tools: { [toolName]: tool }  // v13: tools as a record
    };

    console.debug("[hello-world] Added top-level control group (v13 record).");
  });
});

/* ------------------------- Ready: public API & UI refresh ------------------------- */
Hooks.once("ready", () => {
  // Expose a tiny API so a macro can open the window
  const mod = game.modules.get("hello-world");
  if (mod) mod.api = { open: () => new HelloWorldApp().render(true) };

  // v13-compliant refresh: re-render controls and preserve current tool if present
  try {
    const currentControls = ui.controls?.controls;
    const currentToolName = ui.controls?.tool?.name ?? undefined; // v13 state
    ui.controls?.render({ controls: currentControls, tool: currentToolName });
  } catch (err) {
    console.warn("[hello-world] controls refresh encountered a problem (safe to ignore if the button shows):", err);
  }
});
