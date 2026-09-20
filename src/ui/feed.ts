export interface FeedOptions {
  maxMessages: number;
}

interface Message {
  element: HTMLElement;
  id: string | undefined;
  username: string | undefined;
}

export class Feed {
  private root: HTMLElement;
  private opts: FeedOptions;
  private messages: Set<Message>;

  constructor(root: HTMLElement, opts: FeedOptions) {
    this.root = root;
    this.opts = opts;
  }

  notice(title: string, text: string): void {
    const element = this.render(title, text);
    this.add({ element: element, id: undefined, username: undefined });
  }

  private add(entry: Message): void {
    this.root.append(entry.element);
  }

  private render(name: string, text: string): HTMLElement {
    const element = document.createElement("div");
    element.className = "msg";
    const tab = document.createElement("div");
    tab.className = "tab";
    tab.textContent = name;

    const body = document.createElement("div");
    body.className = "body";
    body.textContent = text;

    element.append(tab, body);
    return element;
  }
}
