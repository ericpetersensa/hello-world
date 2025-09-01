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

  /** Provide template context */
  async _prepareContext() {
    return {
      message: game.i18n.localize("HELLO.WorldMessage"),
      version: game.modules.get("hello-world")?.version ?? "dev"
    };
  }

  /** Header & inline button action */
  static #onSayHello() {
    ui.notifications.info(game.i18n.localize("HELLO.Toast"));
  }
}

Hooks.once("ready", () => {
  // Expose a tiny API so a macro can open the app
  const mod = game.modules.get("hello-world");
  if (mod) mod.api = { open: () => new HelloWorldApp().render(true) };

  // Add a tool button under the existing Token controls group
  Hooks.on("getSceneControlButtons", (controls) => {
    // v13 may provide an array or a record; normalize to an array
    const list = Array.isArray(controls) ? controls : Object.values(controls ?? {});
    const token = list.find((c) => c?.name === "token");
    if (!token) return;

    (token.tools ??= []).push({
      name: "hello-world",
      title: game.i18n.localize("HELLO.ControlTitle"),
      icon: "fa-solid fa-face-smile",
      button: true,
      onClick: () => game.modules.get("hello-world")?.api.open()
    });
  });

  console.debug("[hello-world] ready: toolbar button registered");
});
