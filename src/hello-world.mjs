// src/hello-world.mjs
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Hello World window using ApplicationV2 + Handlebars (no jQuery).
 * - Top-level toolbar group "hello-world" with an "open" tool.
 * - PoC: a note saved to world settings ("hello-world.note").
 */
class HelloWorldApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "hello-world-app",
    classes: ["hello-world", "app"],
    tag: "section",
    position: { width: 380, height: "auto" },
    window: {
      title: "HELLO.WorldTitle",
      icon: "fa-solid fa-face-smile",
      controls: [
        { icon: "fa-solid fa-circle-info", label: "HELLO.HeaderButton", action: "say-hello" }
      ]
    },
    actions: {
      "say-hello": HelloWorldApp.#onSayHello,
      "save-note": HelloWorldApp.#onSaveNote
    }
  };

  static PARTS = {
    content: { template: "modules/hello-world/templates/hello.hbs" }
  };

  /** Provide template context each render */
  async _prepareContext() {
    const note = game.settings.get("hello-world", "note");
    return {
      message: game.i18n.localize("HELLO.WorldMessage"),
      version: game.modules.get("hello-world")?.version ?? "dev",
      note,
      saved: note
    };
  }

  /** Header button action */
  static #onSayHello() {
    ui.notifications.info(game.i18n.localize("HELLO.Toast"));
  }

  /** Save note action (wired to a save-note in hello.hbs) */
  static async #onSaveNote(event, target) {
    event.preventDefault();
    // In AppV2, static action handlers have `this` bound to the app instance
    const input = this.element?.querySelector('input[name="note"]');
    const note = (input?.value ?? "").trim();
    await game.settings.set("hello-world", "note", note);
    ui.notifications.info(note ? `Saved: ${note}` : "Saved empty note");
    this.render(); // Re-render to show updated context (saved note)
  }
}

/* ------------------------------------------------------------------ */
/*  Init: register setting + inject a NEW top-level toolbar group      */
/* ------------------------------------------------------------------ */
Hooks.on("init", () => {
  // Persisted world setting for the PoC
  game.settings.register("hello-world", "note", {
    name: "Saved Note",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

  // v13 shape: controls is a Record<string, SceneControl>
  Hooks.on("getSceneControlButtons", (controls) => {
    if (!controls || typeof controls !== "object" || Array.isArray(controls)) return;
    if (controls["hello-world"]) return; // avoid duplicates

    const toolName = "open";

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
      activeTool: toolName,          // group state field (OK in v13)
      tools: { [toolName]: tool }    // v13: tools as a record of SceneControlTool
    };

    console.debug("[hello-world] Added top-level control group (v13).");
  });
});

/* ---------------------- Ready: public API + v13 refresh ---------------------- */
Hooks.once("ready", () => {
  // Expose a tiny API so a macro can open the window:
  //   game.modules.get('hello-world')?.api.open()
  const mod = game.modules.get("hello-world");
  if (mod) mod.api = { open: () => new HelloWorldApp().render(true) };

  // v13-compliant re-render of controls (no deprecated initialize / activeTool)
  try {
    const currentControls = ui.controls?.controls;
    const currentToolName = ui.controls?.tool?.name ?? undefined; // v13 state
    ui.controls?.render({ controls: currentControls, tool: currentToolName });
  } catch (err) {
    console.warn("[hello-world] controls refresh issue (safe to ignore if the button shows):", err);
  }
});
