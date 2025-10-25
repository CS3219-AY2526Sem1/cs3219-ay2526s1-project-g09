import Quill, { type QuillOptions } from "quill";

interface QuillThemeConstructor {
  new (
    quill: Quill,
    options: QuillOptions,
  ): {
    quill: Quill;
    options: QuillOptions;
  };
}

const SnowTheme = Quill.import(
  "themes/snow",
) as unknown as QuillThemeConstructor;

class PeerPrepTheme extends SnowTheme {
  constructor(quill: Quill, options: QuillOptions) {
    super(quill, options);

    queueMicrotask(() => {
      const toolbarModule = quill.getModule("toolbar") as
        | { container?: HTMLElement }
        | undefined;
      if (toolbarModule?.container) {
        toolbarModule.container.classList.add("ql-peerprep-toolbar");

        toolbarModule.container.style.border = "none";
      }

      if (quill.root instanceof HTMLElement) {
        quill.root.classList.add("ql-peerprep-editor");

        quill.root.style.border = "none";
      }

      const container = quill.root.parentElement;
      if (container) {
        container.classList.add("ql-peerprep-container");
        container.style.border = "1px solid #4b5563";
      }
    });
  }
}

Quill.register("themes/peerprep", PeerPrepTheme, true);

export default PeerPrepTheme;
