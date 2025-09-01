const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

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

Hooks.once("ready", () => {
  const mod = game.modules.get("hello-world");
  if (mod) mod.api = { open: () => new HelloWorldApp().render(true) };

  Hooks.on("getSceneControlButtons", (controls) => {
  const token = controls.find(c => c.name === "token");
  if (!token) return;

  token.tools.push({
    name: "hello-world",
    title: game.i18n.localize("HELLO.ControlTitle"),
    icon: "fa-solid fa-face-smile",
    button: true,
    onClick: () => game.modules.get("hello-world")?.api.open()
  });
});
