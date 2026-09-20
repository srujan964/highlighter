import "./overlay.css";

import { Feed } from "./ui/feed";

const feed = new Feed(requireElement("feed"), { maxMessages: 5 });

feed.notice(
  "Setup required",
  "Add ?channel=<channelname> to the URL of this source.",
);

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`#${id} is missing from index.html`);
  return element;
}
